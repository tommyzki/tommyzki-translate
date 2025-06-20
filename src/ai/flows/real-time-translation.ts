// This is an AI-powered function for real-time translation between Bahasa Indonesia, English, and Japanese.
'use server';

/**
 * @fileOverview Real-time translation flow using Genkit and Gemini.
 *
 * - translateText - Translates input text into Bahasa Indonesia, English, and Japanese.
 * - TranslationInput - Input type for the translation function.
 * - TranslationOutput - Output type for the translation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TranslationInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
});
export type TranslationInput = z.infer<typeof TranslationInputSchema>;

const TranslationOutputSchema = z.object({
  source: z.object({
    code: z.string().describe('The text to translate Source Language code'),
    name: z.string().describe('The text to translate Source Language full name'),
  }).describe('The text to translate Source Language.'),
  en: z.string().describe('The translated text in English.'),
  id: z.string().describe('The translated text in Bahasa Indonesia.'),
  ja: z.object({
    kanji: z.string().describe('The translated text in Japanese (Kanji).'),
    romaji: z.string().describe('The translated text in Japanese (Romaji).'),
  }).describe('The translated text in Japanese.'),
});
export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;

export async function translateText(input: TranslationInput): Promise<TranslationOutput> {
  return translateTextFlow(input);
}

const translatePrompt = ai.definePrompt({
  name: 'translatePrompt',
  input: { schema: TranslationInputSchema },
  output: { schema: TranslationOutputSchema },
  prompt: `You are a translation expert. Translate the given text from {{sourceLanguage}} to English, Bahasa Indonesia, and Japanese.

Text to translate: {{{text}}}

Output the translations in JSON format, with separate fields for kanji and romaji in Japanese. 
also give me the source or languange has translated with code source with separate field name code and full name of language`,
});

const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslationInputSchema,
    outputSchema: TranslationOutputSchema,
  },
  async input => {
    const { output } = await translatePrompt(input);
    return output!;
  }
);
