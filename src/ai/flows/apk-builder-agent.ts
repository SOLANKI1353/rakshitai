'use server';

/**
 * @fileOverview An AI agent that guides users on how to convert a web project into an APK.
 *
 * - apkBuilderAgent - A function that analyzes a web project and provides guidance.
 * - ApkBuilderAgentInput - The input type for the apkBuilderAgent function.
 * - ApkBuilderAgentOutput - The return type for the apkBuilderAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ApkBuilderAgentInputSchema = z.object({
  projectZipDataUri: z
    .string()
    .describe(
      "The web project's data, as a data URI of a ZIP file. It must include a MIME type and use Base64 encoding. Expected format: 'data:application/zip;base64,<encoded_data>'."
    ),
  instructions: z
    .string()
    .describe(
      'Specific instructions from the user, e.g., "Convert this project to an APK" or "Provide steps to build an APK for this project".'
    ),
});
export type ApkBuilderAgentInput = z.infer<typeof ApkBuilderAgentInputSchema>;

const ApkBuilderAgentOutputSchema = z.object({
  guidance: z
    .string()
    .describe(
      'Step-by-step guidance on how to convert the provided web project into an APK using tools like Capacitor or Cordova. Include code snippets and commands where necessary.'
    ),
  isPossible: z
    .boolean()
    .describe('Whether it is feasible to convert the given project to an APK.'),
});
export type ApkBuilderAgentOutput = z.infer<typeof ApkBuilderAgentOutputSchema>;

export async function apkBuilderAgent(
  input: ApkBuilderAgentInput
): Promise<ApkBuilderAgentOutput> {
  return apkBuilderAgentFlow(input);
}

const apkBuilderAgentPrompt = ai.definePrompt({
  name: 'apkBuilderAgentPrompt',
  input: {schema: ApkBuilderAgentInputSchema},
  output: {schema: ApkBuilderAgentOutputSchema},
  prompt: `You are an expert mobile developer specializing in converting web applications into native mobile apps (APKs for Android).

You cannot actually build the APK. Your role is to guide the user on how to do it themselves.

A user has uploaded their web project as a ZIP file and wants to create an APK from it. Analyze the project structure and provide clear, step-by-step instructions.

Instructions from user: {{{instructions}}}
Project ZIP file: {{media url=projectZipDataUri}}

Your Task:
1.  Determine if the project is a standard web project (React, Next.js, Vue, etc.) suitable for conversion. Set 'isPossible' to true or false.
2.  If it's not possible, explain why in the 'guidance' field.
3.  If it is possible, provide detailed, step-by-step guidance in the 'guidance' field. Recommend using a tool like Capacitor.
4.  The guidance should include:
    -   Prerequisites (like installing Node.js, Android Studio).
    -   Commands to install Capacitor CLI.
    -   Commands to initialize Capacitor in their project.
    -   Commands to add the Android platform.
    -   Any necessary configuration changes (e.g., in 'capacitor.config.json').
    -   How to build the web assets.
    -   How to open the project in Android Studio.
    -   How to build and run the app to generate the APK from Android Studio.

Respond in the user's language (the instructions are in Hindi, so respond in Hindi).
Your final output must be a JSON object with 'guidance' and 'isPossible' keys.`,
});

const apkBuilderAgentFlow = ai.defineFlow(
  {
    name: 'apkBuilderAgentFlow',
    inputSchema: ApkBuilderAgentInputSchema,
    outputSchema: ApkBuilderAgentOutputSchema,
  },
  async input => {
    const {output} = await apkBuilderAgentPrompt(input);
    return output!;
  }
);
