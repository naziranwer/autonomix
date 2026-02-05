 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
   
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
     
     const url = new URL(req.url);
     const jobId = url.searchParams.get('jobId');
     
     if (!jobId) {
       return new Response(
         JSON.stringify({ error: 'jobId is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Get job details
     const { data: job, error: jobError } = await supabase
       .from('jobs')
       .select('*')
       .eq('id', jobId)
       .maybeSingle();
     
     if (jobError) {
       throw new Error(`Failed to fetch job: ${jobError.message}`);
     }
     
     if (!job) {
       return new Response(
         JSON.stringify({ error: 'Job not found' }),
         { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Get tasks for this job
     const { data: tasks, error: tasksError } = await supabase
       .from('tasks')
       .select('*')
       .eq('job_id', jobId)
       .order('created_at', { ascending: true });
     
     if (tasksError) {
       throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
     }
     
     return new Response(
       JSON.stringify({
         job: {
           id: job.id,
           status: job.status,
           error_message: job.error_message,
           created_at: job.created_at,
           updated_at: job.updated_at
         },
         tasks: tasks || [],
         hasCycles: tasks?.some(t => t.has_cycle) || false
       }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
     
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Error fetching job status:', error);
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });