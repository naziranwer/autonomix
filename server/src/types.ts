export interface ExtractedTask {
  id: string;
  description: string;
  priority: string;
  dependencies: string[];
  assigned_to?: string;
  has_cycle?: boolean;
}

export interface LLMResponse {
  tasks: ExtractedTask[];
}

export interface Job {
  id: string;
  transcript_hash: string;
  original_transcript: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result: unknown;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  job_id: string;
  task_id: string;
  description: string;
  priority: string;
  dependencies: string[];
  has_cycle: boolean;
  is_completed: boolean;
  assigned_to: string | null;
  created_at: string;
}
