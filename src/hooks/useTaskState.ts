 import { useState, useCallback, useMemo } from 'react';
 import type { Task, TaskNode, TaskStatus } from '@/types';
 
 export function useTaskState(initialTasks: Task[]) {
   const [completedTasks, setCompletedTasks] = useState<Set<string>>(
     new Set(initialTasks.filter(t => t.is_completed).map(t => t.task_id))
   );
 
   const getTaskStatus = useCallback((task: Task): TaskStatus => {
     if (task.has_cycle) return 'error';
     if (completedTasks.has(task.task_id)) return 'completed';
     
     // Check if all dependencies are completed
     const allDepsCompleted = task.dependencies.every(depId => 
       completedTasks.has(depId)
     );
     
     return allDepsCompleted ? 'ready' : 'blocked';
   }, [completedTasks]);
 
   const taskNodes: TaskNode[] = useMemo(() => {
     return initialTasks.map(task => ({
       ...task,
       status: getTaskStatus(task)
     }));
   }, [initialTasks, getTaskStatus]);
 
   const toggleTaskCompletion = useCallback((taskId: string) => {
     setCompletedTasks(prev => {
       const next = new Set(prev);
       if (next.has(taskId)) {
         next.delete(taskId);
       } else {
         next.add(taskId);
       }
       return next;
     });
   }, []);
 
   const readyTasks = useMemo(() => 
     taskNodes.filter(t => t.status === 'ready'),
     [taskNodes]
   );
 
   const blockedTasks = useMemo(() => 
     taskNodes.filter(t => t.status === 'blocked'),
     [taskNodes]
   );
 
   const completedTasksList = useMemo(() => 
     taskNodes.filter(t => t.status === 'completed'),
     [taskNodes]
   );
 
   const errorTasks = useMemo(() => 
     taskNodes.filter(t => t.status === 'error'),
     [taskNodes]
   );
 
   return {
     taskNodes,
     completedTasks,
     toggleTaskCompletion,
     readyTasks,
     blockedTasks,
     completedTasksList,
     errorTasks,
     getTaskStatus
   };
 }