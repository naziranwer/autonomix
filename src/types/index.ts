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
 
 export interface Job {
   id: string;
   status: 'pending' | 'processing' | 'completed' | 'failed';
   error_message: string | null;
   created_at: string;
   updated_at: string;
 }
 
 export interface JobStatusResponse {
   job: Job;
   tasks: Task[];
   hasCycles: boolean;
 }
 
 export interface ProcessTranscriptResponse {
   jobId: string;
   status: string;
   cached: boolean;
   error?: string;
 }
 
 export type TaskStatus = 'blocked' | 'ready' | 'completed' | 'error';
 
 export interface TaskNode extends Task {
   status: TaskStatus;
 }