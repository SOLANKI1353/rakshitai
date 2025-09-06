import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-uploaded-file.ts';
import '@/ai/flows/respond-in-preferred-language.ts';
import '@/ai/flows/generate-text-with-chat-gpt.ts';
import '@/ai/flows/text-to-speech.ts';
