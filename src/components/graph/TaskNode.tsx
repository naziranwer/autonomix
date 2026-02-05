 import { memo } from 'react';
 import { Handle, Position } from '@xyflow/react';
 import { motion } from 'framer-motion';
 import { CheckCircle2, Clock, AlertTriangle, XCircle, User } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { TaskNode as TaskNodeType, TaskStatus } from '@/types';
 
 interface TaskNodeProps {
   data: {
   task: TaskNodeType;
   onComplete: (taskId: string) => void;
   };
 }
 
 const statusConfig: Record<TaskStatus, { 
   icon: typeof CheckCircle2; 
   bgClass: string;
   borderClass: string;
   textClass: string;
   label: string;
 }> = {
   ready: {
     icon: Clock,
     bgClass: 'bg-status-ready/10',
     borderClass: 'border-status-ready',
     textClass: 'text-status-ready',
     label: 'Ready'
   },
   blocked: {
     icon: AlertTriangle,
     bgClass: 'bg-status-blocked/10',
     borderClass: 'border-status-blocked',
     textClass: 'text-status-blocked',
     label: 'Blocked'
   },
   completed: {
     icon: CheckCircle2,
     bgClass: 'bg-status-completed/10',
     borderClass: 'border-status-completed',
     textClass: 'text-status-completed',
     label: 'Done'
   },
   error: {
     icon: XCircle,
     bgClass: 'bg-status-error/10',
     borderClass: 'border-status-error',
     textClass: 'text-status-error',
     label: 'Cycle Detected'
   }
 };
 
 const priorityColors: Record<string, string> = {
   'P0': 'bg-priority-p0 text-primary-foreground',
   'P1': 'bg-priority-p1 text-primary-foreground',
   'P2': 'bg-priority-p2 text-primary-foreground',
   'P3': 'bg-priority-p3 text-primary-foreground',
   'critical': 'bg-priority-p0 text-primary-foreground',
   'high': 'bg-priority-p1 text-primary-foreground',
   'medium': 'bg-priority-p2 text-primary-foreground',
   'low': 'bg-priority-p3 text-primary-foreground',
 };
 
 function TaskNodeComponent({ data }: TaskNodeProps) {
   const { task, onComplete } = data || {};
   
   if (!task) return null;
   
   const config = statusConfig[task.status];
   const StatusIcon = config.icon;
 
   const handleClick = () => {
     if (task.status === 'ready' || task.status === 'completed') {
       onComplete(task.task_id);
     }
   };
 
   return (
     <>
       <Handle type="target" position={Position.Top} className="!bg-edge" />
       
       <motion.div
         initial={{ scale: 0.9, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         whileHover={{ scale: 1.02 }}
         onClick={handleClick}
         className={cn(
           "w-72 p-4 rounded-xl border-2 shadow-lg cursor-pointer transition-all duration-200",
           "bg-card hover:shadow-xl",
           config.borderClass,
           task.status === 'completed' && "opacity-60"
         )}
       >
         {/* Header */}
         <div className="flex items-start justify-between gap-2 mb-3">
           <div className="flex items-center gap-2">
             <span className={cn(
               "px-2 py-0.5 rounded-md text-xs font-bold",
               priorityColors[task.priority] || 'bg-muted text-muted-foreground'
             )}>
               {task.priority}
             </span>
             <span className="text-xs font-mono text-muted-foreground">
               {task.task_id}
             </span>
           </div>
           
           <div className={cn("p-1.5 rounded-lg", config.bgClass)}>
             <StatusIcon className={cn("h-4 w-4", config.textClass)} />
           </div>
         </div>
         
         {/* Description */}
         <p className={cn(
           "text-sm leading-relaxed mb-3",
           task.status === 'completed' ? "line-through text-muted-foreground" : "text-foreground"
         )}>
           {task.description}
         </p>
         
         {/* Footer */}
         <div className="flex items-center justify-between">
           {task.assigned_to && (
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
               <User className="h-3 w-3" />
               <span>{task.assigned_to}</span>
             </div>
           )}
           
           <span className={cn(
             "px-2 py-0.5 rounded-full text-xs font-medium",
             config.bgClass,
             config.textClass
           )}>
             {config.label}
           </span>
         </div>
         
         {/* Dependencies indicator */}
         {task.dependencies.length > 0 && (
           <div className="mt-2 pt-2 border-t border-border/50">
             <span className="text-xs text-muted-foreground">
               Depends on: {task.dependencies.join(', ')}
             </span>
           </div>
         )}
       </motion.div>
       
       <Handle type="source" position={Position.Bottom} className="!bg-edge" />
     </>
   );
 }
 
 export const TaskNodeMemo = memo(TaskNodeComponent);