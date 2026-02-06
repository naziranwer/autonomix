import type { ExtractedTask } from '../types.js';

export function sanitizeDependencies(tasks: ExtractedTask[]): ExtractedTask[] {
  const validIds = new Set(tasks.map(t => t.id));
  return tasks.map(task => ({
    ...task,
    dependencies: task.dependencies.filter(depId => validIds.has(depId)),
  }));
}
