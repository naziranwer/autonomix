 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { FileText, Loader2, Send, Sparkles } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 
 interface TranscriptInputProps {
   onSubmit: (transcript: string) => void;
   isLoading: boolean;
 }
 
 const sampleTranscript = `**Meeting Title:** Project Odyssey - Pre-Launch Technical & GTM Sync
 **Date:** November 21, 2023
 **Attendees:** Priya (Product Manager), David (Lead Engineer), Maria (Marketing Lead), Sam (QA Lead)
 
 ---
 
 **Priya:** Alright team, welcome to the sync for Project Odyssey. We're officially in the home stretch, with launch scheduled for two weeks from today. The goal here is to get a final status check, identify any remaining red flags, and ensure Engineering, QA, and Marketing are perfectly aligned. David, let's start with you. How is the engineering work looking?
 
 **David:** It's been a challenging week, Priya. The good news is that the new multi-tenant architecture is fully deployed to staging. The bad news is we've uncovered a pretty nasty P0 blocker. The integration with the Stripe payment gateway is failing intermittently under load. During our stress tests last night, we saw a 20% transaction failure rate once we went past 100 concurrent users. This is a complete showstopper for launch.
 
 **Priya:** A 20% failure rate is definitely a no-go. What's the immediate plan?
 
 **David:** It's my only priority right now. I've been tracing the logs since 5 AM. It seems to be a race condition when new customer accounts are created simultaneously with their first subscription record. I need to get this fixed, patched, and redeployed by the end of this week, no excuses. After that, I will need Sam's team to run a full regression test over the weekend.
 
 **Sam:** We can do that, David, but my team is already stretched. Our automated test suite for the CI/CD pipeline is still flaky because of environment timeouts. It's been failing randomly for a week. We've been having to do a lot of manual testing, which is slow. The signup and login flows have to be manually verified on Chrome, Firefox, and Safari for every single build. It's becoming a huge bottleneck.
 
 **Priya:** Okay, two major issues. David, is the environment instability related to the payment gateway bug?
 
 **David:** Unlikely. I think the timeouts are a separate issue, probably related to the database connection pool on the staging server. It's a lower priority than the payment bug, but it's clearly impacting QA. Let me be clear, the P0 bug is the mountain we have to climb this week. I can create a ticket to investigate the staging DB performance, but I won't be able to look at it until Odyssey is launched.
 
 **Priya:** Understood. Sam, for now, you'll have to continue with manual verification for the critical paths. David, please provide a stable build to Sam by Monday morning for the full regression run. That's a hard dependency.
 
 **David:** Got it. Stable build by Monday AM.
 
 **Priya:** Let's switch to marketing. Maria, what do you need from the technical team?
 
 **Maria:** We're moving full speed ahead. The launch day blog post is written, but I'm blocked. I need David to review the "How It Works" section for technical accuracy. It's a bit jargon-heavy, and I want to make sure we're not misrepresenting the new architecture. I need that review done by Thursday EOD to get it to our copy-editor on Friday.
 
 **David:** I can do that. Send me the draft. It'll be a welcome distraction from the payment bug.`;
 
 export function TranscriptInput({ onSubmit, isLoading }: TranscriptInputProps) {
   const [transcript, setTranscript] = useState('');
 
   const handleSubmit = () => {
     if (transcript.trim()) {
       onSubmit(transcript);
     }
   };
 
   const handleUseSample = () => {
     setTranscript(sampleTranscript);
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5, delay: 0.1 }}
     >
       <Card className="glass-card">
         <CardHeader>
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-primary/10">
               <FileText className="h-5 w-5 text-primary" />
             </div>
             <div>
               <CardTitle>Meeting Transcript</CardTitle>
               <CardDescription>
                 Paste your meeting transcript and we'll extract actionable tasks with dependencies
               </CardDescription>
             </div>
           </div>
         </CardHeader>
         <CardContent className="space-y-4">
           <Textarea
             value={transcript}
             onChange={(e) => setTranscript(e.target.value)}
             placeholder="Paste your meeting transcript here..."
             className="min-h-[300px] resize-none font-mono text-sm bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
           />
           
           <div className="flex items-center justify-between gap-4">
             <Button
               variant="outline"
               onClick={handleUseSample}
               disabled={isLoading}
               className="gap-2"
             >
               <Sparkles className="h-4 w-4" />
               Use Sample Transcript
             </Button>
             
             <Button
               onClick={handleSubmit}
               disabled={!transcript.trim() || isLoading}
               className="gap-2 gradient-primary border-0 hover:opacity-90 transition-opacity"
             >
               {isLoading ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   Processing...
                 </>
               ) : (
                 <>
                   <Send className="h-4 w-4" />
                   Extract Tasks
                 </>
               )}
             </Button>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }