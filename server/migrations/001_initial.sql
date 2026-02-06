-- Create status enum for jobs
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create priority enum for tasks
CREATE TYPE public.task_priority AS ENUM ('P0', 'P1', 'P2', 'P3', 'low', 'medium', 'high', 'critical');

-- Create jobs table to track transcript processing
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transcript_hash TEXT NOT NULL,
  original_transcript TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on transcript_hash for idempotency
CREATE UNIQUE INDEX idx_jobs_transcript_hash ON public.jobs(transcript_hash);

-- Create tasks table to store extracted tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  dependencies TEXT[] NOT NULL DEFAULT '{}',
  has_cycle BOOLEAN NOT NULL DEFAULT false,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tasks_job_id ON public.tasks(job_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for jobs table
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
