import { Router } from 'express';
import { pool } from '../db.js';

export const taskRouter = Router();

taskRouter.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
      res.status(400).json({ error: 'is_completed (boolean) is required' });
      return;
    }

    const result = await pool.query(
      'UPDATE tasks SET is_completed = $1 WHERE id = $2 RETURNING *',
      [is_completed, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});
