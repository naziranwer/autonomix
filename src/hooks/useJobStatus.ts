 import { useState, useEffect, useCallback } from 'react';
 import { getJobStatus } from '@/services/api';
 import type { JobStatusResponse } from '@/types';
 
 export function useJobStatus(jobId: string | null) {
   const [data, setData] = useState<JobStatusResponse | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
 
   const fetchStatus = useCallback(async () => {
     if (!jobId) return;
     
     setIsLoading(true);
     setError(null);
     
     try {
       const result = await getJobStatus(jobId);
       setData(result);
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to fetch job status');
     } finally {
       setIsLoading(false);
     }
   }, [jobId]);
 
   useEffect(() => {
     if (jobId) {
       fetchStatus();
     }
   }, [jobId, fetchStatus]);
 
   // Poll for updates if job is still processing
   useEffect(() => {
     if (data?.job.status === 'pending' || data?.job.status === 'processing') {
       const interval = setInterval(fetchStatus, 2000);
       return () => clearInterval(interval);
     }
   }, [data?.job.status, fetchStatus]);
 
   return { data, isLoading, error, refetch: fetchStatus };
 }