import { pool } from '../db.js';
import { hashTranscript } from '../utils/hash.js';
import { sanitizeDependencies } from '../utils/sanitize.js';
import { detectCycles } from '../utils/cycles.js';
import { extractTasksFromTranscript } from './llm.js';

export async function processTranscript(transcript: string) {
  const transcriptHash = hashTranscript(transcript);

  // Check idempotency cache
  const existing = await pool.query(
    'SELECT id, status FROM jobs WHERE transcript_hash = $1',
    [transcriptHash]
  );

  if (existing.rows.length > 0) {
    return {
      jobId: existing.rows[0].id,
      status: existing.rows[0].status,
      cached: true,
    };
  }

  // Create new job
  const jobResult = await pool.query(
    `INSERT INTO jobs (transcript_hash, original_transcript, status)
     VALUES ($1, $2, 'processing')
     RETURNING id`,
    [transcriptHash, transcript]
  );
  const jobId = jobResult.rows[0].id;

  try {
    // Extract tasks via LLM
    let tasks = await extractTasksFromTranscript(transcript);

    // Sanitize dependencies
    tasks = sanitizeDependencies(tasks);

    // Detect cycles
    const { tasks: processedTasks, hasCycles } = detectCycles(tasks);

    // Store tasks in database
    if (processedTasks.length > 0) {
      const values: unknown[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      for (const task of processedTasks) {
        placeholders.push(
          `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
        );
        values.push(
          jobId,
          task.id,
          task.description,
          task.priority,
          task.dependencies,
          task.has_cycle || false,
          task.assigned_to || null
        );
      }

      await pool.query(
        `INSERT INTO tasks (job_id, task_id, description, priority, dependencies, has_cycle, assigned_to)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    // Update job to completed
    await pool.query(
      `UPDATE jobs SET status = 'completed', result = $1 WHERE id = $2`,
      [JSON.stringify({ tasks: processedTasks, hasCycles }), jobId]
    );

    return { jobId, status: 'completed', cached: false };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    await pool.query(
      `UPDATE jobs SET status = 'failed', error_message = $1 WHERE id = $2`,
      [errorMessage, jobId]
    );

    return { jobId, status: 'failed', cached: false, error: errorMessage };
  }
}
