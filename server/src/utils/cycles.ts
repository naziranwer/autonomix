import type { ExtractedTask } from '../types.js';

export function detectCycles(tasks: ExtractedTask[]): {
  tasks: ExtractedTask[];
  hasCycles: boolean;
} {
  const graph = new Map<string, string[]>();
  tasks.forEach(task => {
    graph.set(task.id, task.dependencies);
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
    has_cycle: inCycle.has(task.id),
  }));

  return { tasks: updatedTasks, hasCycles: inCycle.size > 0 };
}
