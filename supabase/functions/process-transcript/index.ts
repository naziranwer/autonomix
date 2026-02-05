 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 interface ExtractedTask {
   id: string;
   description: string;
   priority: string;
   dependencies: string[];
   assigned_to?: string;
   has_cycle?: boolean;
 }
 
 interface LLMResponse {
   tasks: ExtractedTask[];
 }
 
 // Generate SHA-256 hash for transcript
 async function hashTranscript(transcript: string): Promise<string> {
   const encoder = new TextEncoder();
   const data = encoder.encode(transcript.trim().toLowerCase());
   const hashBuffer = await crypto.subtle.digest('SHA-256', data);
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
 }
 
 // Validate and sanitize dependencies - remove non-existent IDs
 function sanitizeDependencies(tasks: ExtractedTask[]): ExtractedTask[] {
   const validIds = new Set(tasks.map(t => t.id));
   return tasks.map(task => ({
     ...task,
     dependencies: task.dependencies.filter(depId => validIds.has(depId))
   }));
 }
 
 // Detect cycles using DFS and mark affected tasks
 function detectCycles(tasks: ExtractedTask[]): { tasks: ExtractedTask[], hasCycles: boolean } {
   const graph = new Map<string, string[]>();
   const taskMap = new Map<string, ExtractedTask>();
   
   tasks.forEach(task => {
     graph.set(task.id, task.dependencies);
     taskMap.set(task.id, { ...task });
   });
   
   const visited = new Set<string>();
   const recStack = new Set<string>();
   const inCycle = new Set<string>();
   
   function dfs(nodeId: string, path: string[]): boolean {
     visited.add(nodeId);
     recStack.add(nodeId);
     
     const dependencies = graph.get(nodeId) || [];
     for (const dep of dependencies) {
       if (!visited.has(dep)) {
         if (dfs(dep, [...path, nodeId])) {
           inCycle.add(nodeId);
           return true;
         }
       } else if (recStack.has(dep)) {
         // Found cycle - mark all nodes in the cycle
         const cycleStart = path.indexOf(dep);
         if (cycleStart !== -1) {
           path.slice(cycleStart).forEach(n => inCycle.add(n));
         }
         inCycle.add(dep);
         inCycle.add(nodeId);
         return true;
       }
     }
     
     recStack.delete(nodeId);
     return false;
   }
   
   for (const task of tasks) {
     if (!visited.has(task.id)) {
       dfs(task.id, []);
     }
   }
   
   const updatedTasks = tasks.map(task => ({
     ...task,
     has_cycle: inCycle.has(task.id)
   }));
   
   return { tasks: updatedTasks, hasCycles: inCycle.size > 0 };
 }
 
 // Call LLM to extract tasks from transcript
 async function extractTasksFromTranscript(transcript: string): Promise<ExtractedTask[]> {
   const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
   
   if (!LOVABLE_API_KEY) {
     throw new Error('LOVABLE_API_KEY not configured');
   }
   
   const systemPrompt = `You are a task extraction AI. Analyze meeting transcripts and extract actionable tasks with their dependencies.
 
 IMPORTANT RULES:
 1. Extract ALL actionable tasks mentioned in the transcript
 2. Assign unique short IDs (e.g., "TASK-1", "TASK-2", etc.)
 3. Set priority based on urgency mentioned (P0=critical blocker, P1=high, P2=medium, P3=low)
 4. Identify dependencies between tasks - which tasks must be completed before others can start
 5. Extract the assigned person's name if mentioned
 
 Return ONLY valid JSON in this exact format:
 {
   "tasks": [
     {
       "id": "TASK-1",
       "description": "Clear description of the task",
       "priority": "P0",
       "dependencies": [],
       "assigned_to": "Person Name"
     },
     {
       "id": "TASK-2", 
       "description": "Another task",
       "priority": "P1",
       "dependencies": ["TASK-1"],
       "assigned_to": "Another Person"
     }
   ]
 }
 
 DEPENDENCY RULES:
 - A task's dependencies array contains IDs of tasks that MUST be completed BEFORE this task can start
 - Only reference task IDs that exist in your output
 - If Task B depends on Task A, Task B's dependencies array should contain "TASK-A"`;
 
   const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${LOVABLE_API_KEY}`,
       'Content-Type': 'application/json',
     },
     body: JSON.stringify({
       model: 'google/gemini-3-flash-preview',
       messages: [
         { role: 'system', content: systemPrompt },
         { role: 'user', content: `Extract tasks from this meeting transcript:\n\n${transcript}` }
       ],
       temperature: 0.1,
       max_tokens: 4096,
     }),
   });
   
   if (!response.ok) {
     const error = await response.text();
       throw new Error(`LLM API error: ${await response.text()}`);
   }
   
   const data = await response.json();
   const content = data.choices[0]?.message?.content || '';
   
   // Extract JSON from response (handle markdown code blocks)
   let jsonStr = content;
   const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
   if (jsonMatch) {
     jsonStr = jsonMatch[1].trim();
   }
   
   try {
     const parsed: LLMResponse = JSON.parse(jsonStr);
     return parsed.tasks || [];
   } catch (e) {
     console.error('Failed to parse LLM response:', content);
     throw new Error('Failed to parse LLM response as JSON');
   }
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
   
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
     
     const { transcript } = await req.json();
     
     if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
       return new Response(
         JSON.stringify({ error: 'Transcript is required' }),
         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Generate hash for idempotency
     const transcriptHash = await hashTranscript(transcript);
     
     // Check if we already processed this transcript (idempotency)
     const { data: existingJob } = await supabase
       .from('jobs')
       .select('*')
       .eq('transcript_hash', transcriptHash)
       .maybeSingle();
     
     if (existingJob) {
       // Return existing job for idempotency
       return new Response(
         JSON.stringify({ 
           jobId: existingJob.id, 
           status: existingJob.status,
           cached: true 
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
     // Create new job
     const { data: newJob, error: jobError } = await supabase
       .from('jobs')
       .insert({
         transcript_hash: transcriptHash,
         original_transcript: transcript,
         status: 'processing'
       })
       .select()
       .single();
     
     if (jobError) {
       throw new Error(`Failed to create job: ${jobError.message}`);
     }
     
     // Process in background (async architecture)
     // For this implementation, we'll process synchronously but the pattern supports async
     try {
       // Extract tasks from transcript using LLM
       let tasks = await extractTasksFromTranscript(transcript);
       
       // Validate and sanitize dependencies
       tasks = sanitizeDependencies(tasks);
       
       // Detect cycles
       const { tasks: processedTasks, hasCycles } = detectCycles(tasks);
       
       // Store tasks in database
       const taskInserts = processedTasks.map(task => ({
         job_id: newJob.id,
         task_id: task.id,
         description: task.description,
         priority: task.priority,
         dependencies: task.dependencies,
         has_cycle: (task as ExtractedTask & { has_cycle?: boolean }).has_cycle || false,
         assigned_to: task.assigned_to || null,
         is_completed: false
       }));
       
       if (taskInserts.length > 0) {
         const { error: taskError } = await supabase
           .from('tasks')
           .insert(taskInserts);
         
         if (taskError) {
           throw new Error(`Failed to insert tasks: ${taskError.message}`);
         }
       }
       
       // Update job status to completed
       await supabase
         .from('jobs')
         .update({ 
           status: 'completed',
           result: { tasks: processedTasks, hasCycles }
         })
         .eq('id', newJob.id);
       
       return new Response(
         JSON.stringify({ 
           jobId: newJob.id, 
           status: 'completed',
           cached: false
         }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
       
       } catch (processingError: unknown) {
       const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error';
       // Update job status to failed
       await supabase
         .from('jobs')
         .update({ 
           status: 'failed',
           error_message: errorMessage
         })
         .eq('id', newJob.id);
       
       return new Response(
         JSON.stringify({ 
           jobId: newJob.id, 
           status: 'failed',
           error: errorMessage
         }),
         { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
     
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
     console.error('Error processing transcript:', error);
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });