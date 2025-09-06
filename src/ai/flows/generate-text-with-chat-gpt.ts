'use server';

/**
 * @fileOverview An AI agent that leverages ChatGPT-like features for advanced text generation and understanding.
 *
 * - generateTextWithChatGPT - A function that generates text based on user input.
 * - GenerateTextWithChatGPTInput - The input type for the generateTextWithChatGPT function.
 * - GenerateTextWithChatGPTOutput - The return type for the generateTextWithChatGPT function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTextWithChatGPTInputSchema = z.object({
  prompt: z.string().describe('The prompt for generating text.'),
});

export type GenerateTextWithChatGPTInput = z.infer<
  typeof GenerateTextWithChatGPTInputSchema
>;

const GenerateTextWithChatGPTOutputSchema = z.object({
  generatedText: z.string().describe('The generated text from the AI.'),
});

export type GenerateTextWithChatGPTOutput = z.infer<
  typeof GenerateTextWithChatGPTOutputSchema
>;

export async function generateTextWithChatGPT(
  input: GenerateTextWithChatGPTInput
): Promise<GenerateTextWithChatGPTOutput> {
  return generateTextWithChatGPTFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTextWithChatGPTPrompt',
  input: {schema: GenerateTextWithChatGPTInputSchema},
  output: {schema: GenerateTextWithChatGPTOutputSchema},
  prompt: `You are an AI assistant that helps generate text based on the user's prompt. Generate content and provide the best answer.

Prompt: {{{prompt}}}`,
});

const generateTextWithChatGPTFlow = ai.defineFlow(
  {
    name: 'generateTextWithChatGPTFlow',
    inputSchema: GenerateTextWithChatGPTInputSchema,
    outputSchema: GenerateTextWithChatGPTOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
