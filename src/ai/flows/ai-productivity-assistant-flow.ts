'use server';
/**
 * @fileOverview An AI Productivity Assistant that analyzes historical shift data
 * and provides recommendations to maximize a driver's earnings per hour.
 *
 * - aiProductivityAssistant - A function that handles the AI-powered recommendations process.
 * - AIProductivityAssistantInput - The input type for the aiProductivityAssistant function.
 * - AIProductivityAssistantOutput - The return type for the aiProductivityAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ShiftDataSchema = z.object({
  date: z.string().describe('Date of the shift in YYYY-MM-DD format.'),
  totalEarnings: z.number().describe('Total money earned during the shift.'),
  netProfit: z.number().describe('Net profit for the shift.'),
  totalHours: z.number().describe('Total productive hours worked during the shift.'),
  totalKm: z.number().describe('Total kilometers driven during the shift.'),
  earningsPerHour: z.number().describe('Calculated earnings per hour for the shift.'),
  earningsPerKm: z.number().describe('Calculated earnings per kilometer for the shift.'),
});

const AIProductivityAssistantInputSchema = z.object({
  shifts: z.array(ShiftDataSchema).describe('An array of historical shift data for analysis.'),
  // Add optional user preferences here if needed in the future
  // preferences: z.object({ /* ... */ }).optional(),
});
export type AIProductivityAssistantInput = z.infer<typeof AIProductivityAssistantInputSchema>;

const AIProductivityAssistantOutputSchema = z.object({
  summary: z.string().describe('A general summary of the driver\'s historical performance.'),
  optimalWorkingHours: z
    .array(z.string())
    .describe('Suggested time ranges or days for working to maximize earnings.'),
  optimalRoutes: z
    .array(z.string())
    .describe('General advice on optimal routes or areas, if discernible.'),
  tips: z
    .array(z.string())
    .describe('Actionable tips to improve earnings per hour and overall productivity.'),
  averageEarningsPerHour: z
    .number()
    .describe('The calculated average earnings per hour across the analyzed shifts.'),
  averageEarningsPerKm: z
    .number()
    .describe('The calculated average earnings per kilometer across the analyzed shifts.'),
});
export type AIProductivityAssistantOutput = z.infer<typeof AIProductivityAssistantOutputSchema>;

export async function aiProductivityAssistant(
  input: AIProductivityAssistantInput
): Promise<AIProductivityAssistantOutput> {
  return aiProductivityAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProductivityAssistantPrompt',
  input: { schema: AIProductivityAssistantInputSchema },
  output: { schema: AIProductivityAssistantOutputSchema },
  prompt: `You are an AI Productivity Assistant for an app driver (Uber, 99, iFood etc). Your goal is to analyze the provided historical work session data and provide actionable recommendations to maximize the driver's earnings per hour.

Here is the historical shift data provided by the driver. This data is a JSON array of past shifts, including earnings, hours, and kilometers:

{{{JSON.stringify shifts}}}

Analyze the data above and provide recommendations. Focus on:
1.  A general summary of the driver's overall performance and any notable trends.
2.  Optimal working hours or days based on the trends in earnings per hour and net profit.
3.  Optimal routes or areas to work in, if discernible from the data (e.g., consistently more profitable routes/periods, areas with higher demand).
4.  General, actionable tips to improve earnings per hour and overall productivity.
5.  Calculate the average earnings per hour and average earnings per kilometer across ALL the provided shifts.

Ensure your response is structured as a JSON object matching the output schema exactly.`,
});

const aiProductivityAssistantFlow = ai.defineFlow(
  {
    name: 'aiProductivityAssistantFlow',
    inputSchema: AIProductivityAssistantInputSchema,
    outputSchema: AIProductivityAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI Productivity Assistant.');
    }
    return output;
  }
);
