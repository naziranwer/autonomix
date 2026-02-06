import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';
import type { ExtractedTask, LLMResponse } from '../types.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const SYSTEM_PROMPT = `You are a task extraction AI. Analyze meeting transcripts and extract actionable tasks with their dependencies.

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

export async function extractTasksFromTranscript(transcript: string): Promise<ExtractedTask[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract tasks from this meeting transcript:\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  });

  const content = response.text ?? '';

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
