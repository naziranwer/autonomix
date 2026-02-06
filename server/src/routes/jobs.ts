import { Router } from 'express';
import { pool } from '../db.js';

export const jobRouter = Router();

jobRouter.get('/get-job-status', async (req, res) => {
  try {
    const jobId = req.query.jobId as string;

    if (!jobId) {
      res.status(400).json({ error: 'jobId is required' });
      return;
    }

    const jobResult = await pool.query(
      'SELECT id, status, error_message, created_at, updated_at FROM jobs WHERE id = $1',
      [jobId]
    );

    if (jobResult.rows.length === 0) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const job = jobResult.rows[0];

    const tasksResult = await pool.query(
      'SELECT * FROM tasks WHERE job_id = $1 ORDER BY created_at ASC',
      [jobId]
    );

    const tasks = tasksResult.rows;

    res.json({
      job: {
        id: job.id,
        status: job.status,
        error_message: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
      tasks,
      hasCycles: tasks.some((t: { has_cycle: boolean }) => t.has_cycle),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error fetching job status:', err);
    res.status(500).json({ error: errorMessage });
  }
});
