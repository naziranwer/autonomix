import type { ProcessTranscriptResponse, JobStatusResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function processTranscript(transcript: string): Promise<ProcessTranscriptResponse> {
  const response = await fetch(`${API_BASE_URL}/process-transcript`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
  const response = await fetch(`${API_BASE_URL}/get-job-status?jobId=${jobId}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get job status');
  }

  return response.json();
}

export async function updateTaskCompletion(taskId: string, isCompleted: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_completed: isCompleted }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update task');
  }
}
