'use server';

/**
 * @fileOverview An AI agent that interacts with the GitHub API to manage repositories.
 *
 * - githubAgent - A function that creates a GitHub repository and publishes a project.
 * - GithubAgentInput - The input type for the githubAgent function.
 * - GithubAgentOutput - The return type for the githubAgent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GithubAgentInputSchema = z.object({
  projectZipDataUri: z
    .string()
    .describe(
      "The web project's data, as a data URI of a ZIP file. It must include a MIME type and use Base64 encoding. Expected format: 'data:application/zip;base64,<encoded_data>'."
    ),
  repoName: z.string().describe('The desired name for the new GitHub repository.'),
  repoDescription: z.string().optional().describe('An optional description for the repository.'),
  isPublic: z.boolean().optional().default(true).describe('Whether the repository should be public or private.'),
  githubToken: z.string().optional().describe('A GitHub personal access token. If not provided, the user may need to authenticate.'),
});
export type GithubAgentInput = z.infer<typeof GithubAgentInputSchema>;

const GithubAgentOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  repoUrl: z.string().url().optional().describe('The URL of the created repository.'),
  message: z
    .string()
    .describe(
      'A message detailing the result of the operation, including success or failure information.'
    ),
});
export type GithubAgentOutput = z.infer<typeof GithubAgentOutputSchema>;


export async function githubAgent(
  input: GithubAgentInput
): Promise<GithubAgentOutput> {
  return githubAgentFlow(input);
}


// This is a placeholder for a real GitHub API tool.
// In a real application, this tool would make authenticated API calls to GitHub.
const createAndPushToGithubRepo = ai.defineTool(
    {
        name: 'createAndPushToGithubRepo',
        description: 'Creates a new GitHub repository and pushes the provided project files to it. The project files are inside a ZIP file.',
        inputSchema: GithubAgentInputSchema,
        outputSchema: GithubAgentOutputSchema,
    },
    async (input) => {
        // In a real implementation, you would:
        // 1. Authenticate with GitHub using the provided token or another method.
        // 2. Call the GitHub API to create a new repository.
        // 3. Unzip the project files from the data URI.
        // 4. Use the GitHub API to commit and push the files to the new repository.
        
        console.log(`Simulating GitHub repo creation for '${input.repoName}'...`);

        // For this mock, we will just return a success message with a fake URL.
        const repoUrl = `https://github.com/example-user/${input.repoName}`;
        
        return {
            success: true,
            repoUrl: repoUrl,
            message: `Successfully created and published project to ${repoUrl}. Please note: This is a simulation. In a real app, you would need to provide a valid GitHub token.`,
        };
    }
);


const githubAgentPrompt = ai.definePrompt({
  name: 'githubAgentPrompt',
  tools: [createAndPushToGithubRepo],
  input: {schema: z.object({
     instructions: z.string(),
     projectZipDataUri: z.string(),
     githubToken: z.string().optional(),
  })},
  output: {schema: GithubAgentOutputSchema},

  prompt: `You are a GitHub expert AI. Your task is to help the user publish their project (provided as a ZIP file) to a new GitHub repository based on their instructions.

You must use the 'createAndPushToGithubRepo' tool to perform this action.

Instructions from user: {{{instructions}}}

Extract the desired repository name and description from the user's instructions. Determine if the repository should be public or private based on the instructions (default to public if not specified).

Then, call the 'createAndPushToGithubRepo' tool with the correct parameters.

The project ZIP data is available. You must pass this data to the tool.

User's GitHub token (if provided): {{{githubToken}}}

After the tool runs, formulate a user-friendly response based on the tool's output.`,
});

const githubAgentFlow = ai.defineFlow(
  {
    name: 'githubAgentFlow',
    inputSchema: GithubAgentInputSchema,
    outputSchema: GithubAgentOutputSchema,
  },
  async (input) => {
     // For this mock, we are directly calling the tool.
     // In a more complex flow, you might call a prompt that decides to use the tool.
    const { output } = await createAndPushToGithubRepo(input);
    return output;
  }
);
