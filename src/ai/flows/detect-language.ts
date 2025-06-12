
'use server';

/**
 * @fileOverview This file contains a Genkit flow that automatically detects the language of the input text.
 *
 * - detectLanguage - A function that detects the language of the input text.
 * - DetectLanguageInput - The input type for the detectLanguage function.
 * - DetectLanguageOutput - The return type for the detectLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { LanguageCode } from '@/lib/languages';

const DetectLanguageInputSchema = z.object({
  text: z.string().describe('The text to detect the language of.'),
});
export type DetectLanguageInput = z.infer<typeof DetectLanguageInputSchema>;

const DetectLanguageOutputSchema = z.object({
  language: z
    .custom<LanguageCode>() 
    .describe('The detected language of the text (e.g., en, id, ja).'),
});
export type DetectLanguageOutput = z.infer<typeof DetectLanguageOutputSchema>;

export async function detectLanguage(input: DetectLanguageInput): Promise<DetectLanguageOutput> {
  return detectLanguageFlow(input);
}

const detectLanguagePrompt = ai.definePrompt({
  name: 'detectLanguagePrompt',
  input: {schema: DetectLanguageInputSchema},
  output: {schema: DetectLanguageOutputSchema},
  prompt: `Determine the language of the following text and respond ONLY with the ISO 639-1 language code (e.g., 'en' for English, 'id' for Bahasa Indonesia, 'ja' for Japanese). If the language is not one of these three, respond with the most likely of the three.

Text: {{{text}}}`, 
});

const detectLanguageFlow = ai.defineFlow(
  {
    name: 'detectLanguageFlow',
    inputSchema: DetectLanguageInputSchema,
    outputSchema: DetectLanguageOutputSchema,
  },
  async input => {
    const {output} = await detectLanguagePrompt(input);
    // Ensure the output is one of the known language codes, default to 'en' if not.
    const validLanguages: LanguageCode[] = ['en', 'id', 'ja'];
    if (output && validLanguages.includes(output.language as LanguageCode)) {
      return output as DetectLanguageOutput;
    }
    // Fallback or error handling if the language is not one of the expected ones
    // For now, let's default to English if detection is ambiguous or outside the supported set.
    // A more robust solution might involve confidence scores or specific error handling.
    console.warn(`Detected language '${output?.language}' is not in supported list [en, id, ja]. Defaulting to 'en'.`);
    return { language: 'en' };
  }
);
