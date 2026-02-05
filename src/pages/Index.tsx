 import { useState, useCallback } from 'react';
 import { motion, AnimatePresence } from 'framer-motion';
 import { Header } from '@/components/layout/Header';
 import { TranscriptInput } from '@/components/transcript/TranscriptInput';
 import { DependencyGraph } from '@/components/graph/DependencyGraph';
 import { ProcessingState } from '@/components/ProcessingState';
 import { processTranscript, getJobStatus } from '@/services/api';
 import { useToast } from '@/hooks/use-toast';
 import type { Task } from '@/types';
 
 type AppState = 'input' | 'processing' | 'result';
 
 const Index = () => {
   const [appState, setAppState] = useState<AppState>('input');
   const [isLoading, setIsLoading] = useState(false);
   const [tasks, setTasks] = useState<Task[]>([]);
   const [hasCycles, setHasCycles] = useState(false);
   const [cached, setCached] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const { toast } = useToast();
 
   const handleSubmit = useCallback(async (transcript: string) => {
     setIsLoading(true);
     setError(null);
     setAppState('processing');
     
     try {
       // Submit transcript for processing
       const response = await processTranscript(transcript);
       setCached(response.cached);
       
       if (response.status === 'failed') {
         setError(response.error || 'Processing failed');
         setAppState('processing');
         setIsLoading(false);
         return;
       }
       
       // Fetch the results
       const jobResult = await getJobStatus(response.jobId);
       
       if (jobResult.job.status === 'completed') {
         setTasks(jobResult.tasks);
         setHasCycles(jobResult.hasCycles);
         setAppState('result');
         
         toast({
           title: response.cached ? 'Cached Result Loaded' : 'Tasks Extracted Successfully',
           description: `Found ${jobResult.tasks.length} tasks with ${jobResult.tasks.filter(t => t.dependencies.length > 0).length} dependencies.`,
         });
       } else if (jobResult.job.status === 'failed') {
         setError(jobResult.job.error_message);
         setAppState('processing');
       }
       
     } catch (err) {
       const errorMessage = err instanceof Error ? err.message : 'An error occurred';
       setError(errorMessage);
       toast({
         title: 'Error',
         description: errorMessage,
         variant: 'destructive',
       });
     } finally {
       setIsLoading(false);
     }
   }, [toast]);
 
   const handleNewTranscript = useCallback(() => {
     setAppState('input');
     setTasks([]);
     setHasCycles(false);
     setCached(false);
     setError(null);
   }, []);
 
   return (
     <div className="min-h-screen bg-background">
       <Header />
       
       <main className="container mx-auto px-4 py-8">
         <AnimatePresence mode="wait">
           {appState === 'input' && (
             <motion.div
               key="input"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <TranscriptInput onSubmit={handleSubmit} isLoading={isLoading} />
             </motion.div>
           )}
           
           {appState === 'processing' && (
             <motion.div
               key="processing"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <ProcessingState 
                 status={error ? 'failed' : 'processing'} 
                 cached={cached}
                 error={error}
               />
               {error && (
                 <motion.div 
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="mt-6 text-center"
                 >
                   <button
                     onClick={handleNewTranscript}
                     className="text-primary hover:underline text-sm"
                   >
                     ← Try with a different transcript
                   </button>
                 </motion.div>
               )}
             </motion.div>
           )}
           
           {appState === 'result' && tasks.length > 0 && (
             <motion.div
               key="result"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="space-y-6"
             >
               <div className="flex items-center justify-between">
                 <div>
                   <h2 className="text-2xl font-bold text-foreground">Task Dependencies</h2>
                   <p className="text-sm text-muted-foreground mt-1">
                     Click on ready tasks to mark them complete and unlock dependents
                   </p>
                 </div>
                 <button
                   onClick={handleNewTranscript}
                   className="text-primary hover:underline text-sm"
                 >
                   ← Process new transcript
                 </button>
               </div>
               
               <DependencyGraph tasks={tasks} hasCycles={hasCycles} />
             </motion.div>
           )}
         </AnimatePresence>
       </main>
     </div>
   );
 };
 
 export default Index;
