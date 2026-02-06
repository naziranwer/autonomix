import { Router } from 'express';
import { processTranscript } from '../services/taskProcessor.js';

export const transcriptRouter = Router();

transcriptRouter.post('/process-transcript', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      res.status(400).json({ error: 'Transcript is required' });
      return;
    }

    const result = await processTranscript(transcript);

    if (result.status === 'failed') {
      res.status(500).json(result);
      return;
    }

    res.json(result);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error processing transcript:', err);
    res.status(500).json({ error: errorMessage });
  }
});
