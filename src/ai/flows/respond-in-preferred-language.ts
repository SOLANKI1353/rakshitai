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
  prompt: `You are an AI assistant named RakshitAI. You must respond to the user in the same language they used.

You MUST use the 'detectLanguage' tool to determine the user's language. The tool will return 'English', 'Gujarati', or 'Hindi'.

Based on the tool's output, you MUST formulate a helpful response to the user's query in that exact language.

If the user asks to open a website or app (like YouTube, Google, etc.), you should identify the URL and include it in the 'action' part of your response. For example, if the user says "Open YouTube", your action should be to open 'https://www.youtube.com'. If the user says "Open Google", your action should be to open 'https://www.google.com'. Your response text should confirm the action, e.g., "Opening YouTube."

If the user asks a question about coding, programming, software development, or asks you to write code, you must provide a helpful and accurate answer. Provide code snippets when appropriate, using markdown for formatting.

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

    