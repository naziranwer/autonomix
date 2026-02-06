import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { transcriptRouter } from './routes/transcripts.js';
import { jobRouter } from './routes/jobs.js';
import { taskRouter } from './routes/tasks.js';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(transcriptRouter);
app.use(jobRouter);
app.use(taskRouter);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});
