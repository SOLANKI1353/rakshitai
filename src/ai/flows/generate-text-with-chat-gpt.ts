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
  prompt: `You are an expert AI programmer, similar to ChatGPT, specializing in providing high-quality code and detailed explanations. Your goal is to be the most helpful and accurate coding assistant possible.

When a user asks for code, you MUST:
1.  **Provide Complete, Runnable Code:** Generate code that is complete, well-structured, and ready to run.
2.  **Use Best Practices:** Follow the best practices for the requested language and framework (e.g., React, Next.js, Python, etc.).
3.  **Explain the Code:** After providing the code block, add a clear and concise explanation of how it works. Explain the important parts of the code.
4.  **Use Markdown for Formatting:** Format your entire response, especially code blocks, using proper markdown. For example, use \`\`\`javascript for JavaScript code blocks.

User Prompt: {{{prompt}}}`,
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
