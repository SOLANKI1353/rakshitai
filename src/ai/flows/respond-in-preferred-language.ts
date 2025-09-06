'use server';

/**
 * @fileOverview An AI agent that detects the language of the user's input and responds in the same language.
 *
 * - respondInPreferredLanguage - A function that detects the language and responds.
 * - RespondInPreferredLanguageInput - The input type for the respondInPreferredLanguage function.
 * - RespondInPreferredLanguageOutput - The return type for the respondInPreferredLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RespondInPreferredLanguageInputSchema = z.object({
  query: z.string().describe('The user query to respond to.'),
});
export type RespondInPreferredLanguageInput = z.infer<typeof RespondInPreferredLanguageInputSchema>;

const RespondInPreferredLanguageOutputSchema = z.object({
  response: z.string().describe('The AI response in the detected language.'),
});
export type RespondInPreferredLanguageOutput = z.infer<typeof RespondInPreferredLanguageOutputSchema>;

export async function respondInPreferredLanguage(
  input: RespondInPreferredLanguageInput
): Promise<RespondInPreferredLanguageOutput> {
  return respondInPreferredLanguageFlow(input);
}

const detectLanguageTool = ai.defineTool({
  name: 'detectLanguage',
  description: 'Detects the language of the input text.',
  inputSchema: z.object({
    text: z.string().describe('The text to detect the language of.'),
  }),
  outputSchema: z.string().describe('The detected language of the text.'),
}, async (input) => {
  // This is a placeholder implementation. Replace with actual language detection logic.
  // For example, you can use the Google Translate API or a similar service.
  // For now, let's assume it always detects English.
  return 'English';
});

const respondInPreferredLanguagePrompt = ai.definePrompt({
  name: 'respondInPreferredLanguagePrompt',
  tools: [detectLanguageTool],
  input: {schema: RespondInPreferredLanguageInputSchema},
  output: {schema: RespondInPreferredLanguageOutputSchema},
  prompt: `You are an AI assistant that can understand and respond in multiple languages. Your goal is to respond to the user in the same language they used.

  First, use the detectLanguage tool to identify the language of the user's query.
  Then, formulate a helpful response to their query in that same detected language.
  
  User Query: {{{query}}}
  
  Your final output must be a JSON object with a single key "response" containing your answer.`, 
});

const respondInPreferredLanguageFlow = ai.defineFlow(
  {
    name: 'respondInPreferredLanguageFlow',
    inputSchema: RespondInPreferredLanguageInputSchema,
    outputSchema: RespondInPreferredLanguageOutputSchema,
  },
  async input => {
    const {output} = await respondInPreferredLanguagePrompt(input);
    return output!;
  }
);
