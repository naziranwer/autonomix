 import { supabase } from "@/integrations/supabase/client";
 import type { ProcessTranscriptResponse, JobStatusResponse } from "@/types";
 
 const SUPABASE_URL = "https://vimorpjnrwyabefjjufy.supabase.co";
 
 export async function processTranscript(transcript: string): Promise<ProcessTranscriptResponse> {
   const response = await fetch(`${SUPABASE_URL}/functions/v1/process-transcript`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW9ycGpucnd5YWJlZmpqdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjU3ODAsImV4cCI6MjA4NTg0MTc4MH0.3LcrV5cgA1KG6D1XJ4EZWRskWyVKJEOwyxyS6cjg3hY',
     },
     body: JSON.stringify({ transcript }),
   });
   
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error || 'Failed to process transcript');
   }
   
   return response.json();
 }
 
 export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
   const response = await fetch(`${SUPABASE_URL}/functions/v1/get-job-status?jobId=${jobId}`, {
     method: 'GET',
     headers: {
       'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpbW9ycGpucnd5YWJlZmpqdWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNjU3ODAsImV4cCI6MjA4NTg0MTc4MH0.3LcrV5cgA1KG6D1XJ4EZWRskWyVKJEOwyxyS6cjg3hY',
     },
   });
   
   if (!response.ok) {
     const error = await response.json();
     throw new Error(error.error || 'Failed to get job status');
   }
   
   return response.json();
 }
 
 export async function updateTaskCompletion(taskId: string, isCompleted: boolean): Promise<void> {
   const { error } = await supabase
     .from('tasks')
     .update({ is_completed: isCompleted })
     .eq('id', taskId);
   
   if (error) {
     throw new Error(`Failed to update task: ${error.message}`);
   }
 }