 import { motion } from 'framer-motion';
 import { Network, Sparkles } from 'lucide-react';
 
 export function Header() {
   return (
     <motion.header 
       initial={{ opacity: 0, y: -20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.5 }}
       className="border-b border-border/50 bg-card/80 backdrop-blur-lg sticky top-0 z-50"
     >
       <div className="container mx-auto px-4 py-4">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl gradient-primary">
               <Network className="h-6 w-6 text-primary-foreground" />
             </div>
             <div>
               <h1 className="text-xl font-bold tracking-tight text-foreground">
                 InsightBoard
               </h1>
               <p className="text-xs text-muted-foreground">
                 Dependency Engine
               </p>
             </div>
           </div>
           
           <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <Sparkles className="h-4 w-4 text-primary" />
             <span>AI-Powered Task Extraction</span>
           </div>
         </div>
       </div>
     </motion.header>
   );
 }