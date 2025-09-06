'use server';

/**
 * @fileOverview An AI agent that detects the language of the user's input and responds in the same language. It can also perform actions like opening URLs.
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
  response: z
    .string()
    .describe('The AI response in the detected language.'),
  action: z
    .object({
      type: z
        .string()
        .describe("The type of action to perform, e.g., 'open_url'."),
      url: z.string().url().describe('The URL to open for the action.'),
    })
    .optional()
    .describe('An action for the client to perform, like opening a URL.'),
});
export type RespondInPreferredLanguageOutput = z.infer<typeof RespondInPreferredLanguageOutputSchema>;

export async function respondInPreferredLanguage(
  input: RespondInPreferredLanguageInput
): Promise<RespondInPreferredLanguageOutput> {
  return respondInPreferredLanguageFlow(input);
}


const respondInPreferredLanguagePrompt = ai.definePrompt({
  name: 'respondInPreferredLanguagePrompt',
  input: {schema: RespondInPreferredLanguageInputSchema},
  output: {schema: RespondInPreferredLanguageOutputSchema},
  prompt: `You are an AI assistant named RakshitAI. You are an expert programmer and helpful assistant. You must first detect the user's language from the query (the possible languages are English, Gujarati, and Hindi) and then respond to the user in that same language.

If the user asks a question about coding, programming, software development, or asks you to write code, you must provide a helpful and accurate answer. Provide complete, runnable code snippets when appropriate, using markdown for formatting. Explain the code clearly.

If the user asks to open a website or app (like YouTube, Google, etc.), you should identify the URL and include it in the 'action' part of your response. For example, if the user says "Open YouTube", your action should be to open 'https://www.youtube.com'. If the user says "Open Google", your action should be to open 'https://www.google.com'. Your response text should confirm the action, e.g., "Opening YouTube." in the detected language.

User Query: {{{query}}}

Your final output must be a JSON object with a "response" key containing your answer, and an optional "action" key if a URL needs to be opened.`, 
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

    