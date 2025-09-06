'use server';

/**
 * @fileOverview Analyzes uploaded files (ZIP, photos) and provides insights or performs actions based on the file's data.
 *
 * - analyzeUploadedFile - A function that handles the file analysis process.
 * - AnalyzeUploadedFileInput - The input type for the analyzeUploadedFile function.
 * - AnalyzeUploadedFileOutput - The return type for the analyzeUploadedFile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUploadedFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The uploaded file's data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileType: z.string().describe('The type of the uploaded file (e.g., zip, image/jpeg).'),
  instructions: z
    .string()
    .describe(
      'Specific instructions for analyzing the file content and what type of insights to extract or actions to perform.'
    ),
});
export type AnalyzeUploadedFileInput = z.infer<typeof AnalyzeUploadedFileInputSchema>;

const AnalyzeUploadedFileOutputSchema = z.object({
  analysisResult: z
    .string()
    .describe(
      'The result of analyzing the file, including any insights extracted or actions performed.'
    ),
});
export type AnalyzeUploadedFileOutput = z.infer<typeof AnalyzeUploadedFileOutputSchema>;

export async function analyzeUploadedFile(
  input: AnalyzeUploadedFileInput
): Promise<AnalyzeUploadedFileOutput> {
  return analyzeUploadedFileFlow(input);
}

const analyzeUploadedFilePrompt = ai.definePrompt({
  name: 'analyzeUploadedFilePrompt',
  input: {schema: AnalyzeUploadedFileInputSchema},
  output: {schema: AnalyzeUploadedFileOutputSchema},
  prompt: `You are an expert file analyzer.

You will analyze the content of the uploaded file based on the provided instructions and file type.

If the file is a ZIP archive, you MUST look inside the archive and analyze the files within it to answer the user's request. You have the capability to inspect the contents of ZIP files.

File Type: {{{fileType}}}
Instructions: {{{instructions}}}
File Data: {{media url=fileDataUri}}

Provide a detailed analysis based on the user's instructions. If the user asks for code, provide complete, runnable code snippets with explanations.`,
});

const analyzeUploadedFileFlow = ai.defineFlow(
  {
    name: 'analyzeUploadedFileFlow',
    inputSchema: AnalyzeUploadedFileInputSchema,
    outputSchema: AnalyzeUploadedFileOutputSchema,
  },
  async input => {
    const {output} = await analyzeUploadedFilePrompt(input);
    return output!;
  }
);
