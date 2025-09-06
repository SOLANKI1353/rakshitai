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

const detectLanguageTool = ai.defineTool(
  {
    name: 'detectLanguage',
    description: 'Detects the language of the input text from the available languages: English, Gujarati, and Hindi.',
    inputSchema: z.object({
      text: z.string().describe('The text to detect the language of.'),
    }),
    outputSchema: z.string().describe('The detected language of the text.'),
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Detect the language of the following text. The possible languages are English, Gujarati, and Hindi. Respond with only the name of the language in English. Text: "${input.text}"`,
    });
    
    const detectedLanguage = output as string;

    if (detectedLanguage && detectedLanguage.toLowerCase().includes('hindi')) return 'Hindi';
    if (detectedLanguage && detectedLanguage.toLowerCase().includes('gujarati')) return 'Gujarati';
    return 'English';
  }
);


const respondInPreferredLanguagePrompt = ai.definePrompt({
  name: 'respondInPreferredLanguagePrompt',
  tools: [detectLanguageTool],
  input: {schema: RespondInPreferredLanguageInputSchema},
  output: {schema: RespondInPreferredLanguageOutputSchema},
  prompt: `You are an AI assistant that must respond to the user in the same language they used.

You MUST use the 'detectLanguage' tool to determine the user's language. The tool will return 'English', 'Gujarati', or 'Hindi'.

Based on the tool's output, you MUST formulate a helpful response to the user's query in that exact language.

User Query: {{{query}}}

Your final output must be a JSON object with a single key "response" containing your answer in the correct language.`, 
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
