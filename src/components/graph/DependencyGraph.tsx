 import { useMemo, useCallback } from 'react';
 import {
   ReactFlow,
   Background,
   Controls,
   MiniMap,
   useNodesState,
   useEdgesState,
   type Node,
   type Edge,
   ConnectionMode,
   Panel,
 } from '@xyflow/react';
 import '@xyflow/react/dist/style.css';
 import { motion } from 'framer-motion';
 import { GitBranch, AlertCircle, CheckCircle, Clock } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { TaskNodeMemo } from './TaskNode';
 import { useTaskState } from '@/hooks/useTaskState';
 import type { Task, TaskNode as TaskNodeType } from '@/types';
 
 interface DependencyGraphProps {
   tasks: Task[];
   hasCycles: boolean;
 }
 
 const nodeTypes: Record<string, any> = {
   taskNode: TaskNodeMemo,
 };
 
 function layoutNodes(tasks: TaskNodeType[]): Node[] {
   // Calculate levels based on dependencies
   const levels = new Map<string, number>();
   const taskMap = new Map(tasks.map(t => [t.task_id, t]));
   
   function getLevel(taskId: string, visited: Set<string> = new Set()): number {
     if (visited.has(taskId)) return 0; // Cycle protection
     visited.add(taskId);
     
     if (levels.has(taskId)) return levels.get(taskId)!;
     
     const task = taskMap.get(taskId);
     if (!task || task.dependencies.length === 0) {
       levels.set(taskId, 0);
       return 0;
     }
     
     const maxDepLevel = Math.max(
       ...task.dependencies.map(depId => getLevel(depId, visited) + 1)
     );
     levels.set(taskId, maxDepLevel);
     return maxDepLevel;
   }
   
   tasks.forEach(t => getLevel(t.task_id));
   
   // Group tasks by level
   const levelGroups = new Map<number, TaskNodeType[]>();
   tasks.forEach(task => {
     const level = levels.get(task.task_id) || 0;
     if (!levelGroups.has(level)) {
       levelGroups.set(level, []);
     }
     levelGroups.get(level)!.push(task);
   });
   
   // Position nodes
   const nodeWidth = 300;
   const nodeHeight = 180;
   const horizontalSpacing = 80;
   const verticalSpacing = 100;
   
   const nodes: Node[] = [];
   
   levelGroups.forEach((tasksInLevel, level) => {
     const totalWidth = tasksInLevel.length * nodeWidth + (tasksInLevel.length - 1) * horizontalSpacing;
     const startX = -totalWidth / 2 + nodeWidth / 2;
     
     tasksInLevel.forEach((task, index) => {
       nodes.push({
         id: task.task_id,
         type: 'taskNode',
         position: {
           x: startX + index * (nodeWidth + horizontalSpacing),
           y: level * (nodeHeight + verticalSpacing),
         },
         data: { task },
       });
     });
   });
   
   return nodes;
 }
 
 function createEdges(tasks: TaskNodeType[]): Edge[] {
   const edges: Edge[] = [];
   
   tasks.forEach(task => {
     task.dependencies.forEach(depId => {
       edges.push({
         id: `${depId}-${task.task_id}`,
         source: depId,
         target: task.task_id,
         animated: task.status === 'blocked',
         style: {
           stroke: task.has_cycle ? 'hsl(var(--status-error))' : 'hsl(var(--edge-default))',
           strokeWidth: 2,
         },
       });
     });
   });
   
   return edges;
 }
 
 export function DependencyGraph({ tasks, hasCycles }: DependencyGraphProps) {
   const { taskNodes, toggleTaskCompletion, readyTasks, blockedTasks, completedTasksList, errorTasks } = useTaskState(tasks);
   
   const initialNodes = useMemo(() => layoutNodes(taskNodes), [taskNodes]);
   const initialEdges = useMemo(() => createEdges(taskNodes), [taskNodes]);
   
   const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
   
   // Update node data when task status changes
   useMemo(() => {
     setNodes(nodes => nodes.map(node => {
       const task = taskNodes.find(t => t.task_id === node.id);
       if (task) {
         return {
           ...node,
           data: { 
             task,
             onComplete: toggleTaskCompletion 
           },
         };
       }
       return node;
     }));
     
     setEdges(createEdges(taskNodes));
   }, [taskNodes, toggleTaskCompletion, setNodes, setEdges]);
 
   return (
     <motion.div
       initial={{ opacity: 0, scale: 0.98 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ duration: 0.5 }}
       className="space-y-4"
     >
       {/* Stats Bar */}
       <div className="flex flex-wrap gap-3">
         <Badge variant="outline" className="gap-2 px-3 py-1.5">
           <GitBranch className="h-3.5 w-3.5" />
           {tasks.length} Tasks
         </Badge>
         <Badge variant="outline" className="gap-2 px-3 py-1.5 text-status-ready border-status-ready/30 bg-status-ready/10">
           <Clock className="h-3.5 w-3.5" />
           {readyTasks.length} Ready
         </Badge>
         <Badge variant="outline" className="gap-2 px-3 py-1.5 text-status-blocked border-status-blocked/30 bg-status-blocked/10">
           <AlertCircle className="h-3.5 w-3.5" />
           {blockedTasks.length} Blocked
         </Badge>
         <Badge variant="outline" className="gap-2 px-3 py-1.5 text-status-completed border-status-completed/30 bg-status-completed/10">
           <CheckCircle className="h-3.5 w-3.5" />
           {completedTasksList.length} Done
         </Badge>
         {hasCycles && (
           <Badge variant="destructive" className="gap-2 px-3 py-1.5">
             <AlertCircle className="h-3.5 w-3.5" />
             {errorTasks.length} Cycle Errors
           </Badge>
         )}
       </div>
 
       {/* Graph */}
       <Card className="glass-card overflow-hidden">
         <CardHeader className="pb-0">
           <CardTitle className="flex items-center gap-2 text-lg">
             <GitBranch className="h-5 w-5 text-primary" />
             Dependency Graph
           </CardTitle>
         </CardHeader>
         <CardContent className="p-0">
           <div className="h-[600px] w-full">
             <ReactFlow
               nodes={nodes}
               edges={edges}
               onNodesChange={onNodesChange}
               onEdgesChange={onEdgesChange}
               nodeTypes={nodeTypes}
               connectionMode={ConnectionMode.Loose}
               fitView
               fitViewOptions={{ padding: 0.2 }}
               minZoom={0.3}
               maxZoom={1.5}
               className="bg-background"
             >
               <Background color="hsl(var(--border))" gap={20} />
               <Controls className="!bg-card !border-border !shadow-lg" />
               <MiniMap 
                 className="!bg-card !border-border" 
                 nodeColor={(node) => {
                   const status = (node.data as any)?.task?.status;
                   switch (status) {
                     case 'ready': return 'hsl(var(--status-ready))';
                     case 'blocked': return 'hsl(var(--status-blocked))';
                     case 'completed': return 'hsl(var(--status-completed))';
                     case 'error': return 'hsl(var(--status-error))';
                     default: return 'hsl(var(--node-default))';
                   }
                 }}
               />
               <Panel position="top-right" className="!m-4">
                 <Card className="p-3 glass-card">
                   <p className="text-xs text-muted-foreground">
                     Click on <span className="text-status-ready font-medium">Ready</span> tasks to mark complete
                   </p>
                 </Card>
               </Panel>
             </ReactFlow>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 }