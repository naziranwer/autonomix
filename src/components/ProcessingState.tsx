 import { motion } from 'framer-motion';
 import { Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 
 interface ProcessingStateProps {
   status: 'pending' | 'processing' | 'completed' | 'failed';
   cached?: boolean;
   error?: string | null;
 }
 
 export function ProcessingState({ status, cached, error }: ProcessingStateProps) {
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.4 }}
     >
       <Card className="glass-card">
         <CardContent className="py-12">
           <div className="flex flex-col items-center justify-center text-center space-y-4">
             {(status === 'pending' || status === 'processing') && (
               <>
                 <motion.div
                   animate={{ rotate: 360 }}
                   transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                   className="p-4 rounded-full gradient-primary"
                 >
                   <Sparkles className="h-8 w-8 text-primary-foreground" />
                 </motion.div>
                 <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-foreground">
                     Analyzing Your Transcript
                   </h3>
                   <p className="text-sm text-muted-foreground max-w-md">
                     Our AI is extracting actionable tasks and identifying dependencies...
                   </p>
                 </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                   <Loader2 className="h-4 w-4 animate-spin" />
                   <span>This may take 10-30 seconds</span>
                 </div>
               </>
             )}
             
             {status === 'completed' && cached && (
               <>
                 <div className="p-4 rounded-full bg-info/10">
                   <CheckCircle2 className="h-8 w-8 text-info" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-foreground">
                     Cached Result Found
                   </h3>
                   <p className="text-sm text-muted-foreground max-w-md">
                     We've already processed this transcript. Loading cached results...
                   </p>
                 </div>
               </>
             )}
             
             {status === 'failed' && (
               <>
                 <div className="p-4 rounded-full bg-destructive/10">
                   <AlertCircle className="h-8 w-8 text-destructive" />
                 </div>
                 <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-foreground">
                     Processing Failed
                   </h3>
                   <p className="text-sm text-muted-foreground max-w-md">
                     {error || 'An error occurred while processing your transcript. Please try again.'}
                   </p>
                 </div>
               </>
             )}
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }