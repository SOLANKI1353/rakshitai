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

A user has uploaded their web project as a ZIP file and wants to create an APK from it. You must analyze the project structure and code within the ZIP file to provide clear, step-by-step instructions.

The user's instructions are in Hindi. You MUST respond in polite, clear, and easy-to-understand Hindi.

Instructions from user: {{{instructions}}}
Project ZIP file: {{media url=projectZipDataUri}}

Your Task:
1.  **Inspect the ZIP file contents.** Look at the file structure, package.json, and other configuration files to determine if the project is a standard web project (React, Next.js, Vue, etc.) suitable for conversion. Set 'isPossible' to true or false.
2.  If it's not possible (e.g., it's not a web project), explain why in the 'guidance' field in Hindi.
3.  If it is possible, provide detailed, step-by-step guidance in the 'guidance' field in Hindi. Recommend using a tool like Capacitor.
4.  The guidance should include:
    -   Prerequisites (like installing Node.js, Android Studio).
    -   Commands to install Capacitor CLI.
    -   Commands to initialize Capacitor in their project.
    -   Any necessary configuration changes (e.g., in 'capacitor.config.json'), tailored to the user's project if possible.
    -   How to build the web assets (e.g., 'npm run build').
    -   How to open the project in Android Studio.
    -   How to build and run the app to generate the APK from Android Studio.
    -   Explain each step clearly in Hindi.

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
