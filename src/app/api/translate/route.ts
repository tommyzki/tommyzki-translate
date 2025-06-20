import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { translateText, type TranslationInput, type TranslationOutput } from '@/ai/flows/real-time-translation';
import type { LanguageCode } from '@/lib/languages';

const ApiTranslationInputSchema = z.object({
  text: z.string().min(1, { message: "Text cannot be empty." }),
  sourceLanguage: z.enum(['en', 'id', 'ja'] as [LanguageCode, ...LanguageCode[]], {
    errorMap: () => ({ message: "Invalid source language. Must be 'en', 'id', or 'ja'." })
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = ApiTranslationInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Invalid input", details: validationResult.error.flatten().fieldErrors }, { status: 400 });
    }

    const { text } = validationResult.data;

    const translationInput: TranslationInput = { text };
    const result: TranslationOutput = await translateText(translationInput);

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API Translation error:", error);
    let errorMessage = "An unexpected error occurred during translation.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to translate text", details: errorMessage }, { status: 500 });
  }
}

// Optional: Add a GET handler to describe the API or handle OPTIONS for CORS if needed later
export async function GET() {
  return NextResponse.json({
    message: "Tommyzki Translator API",
    usage: "POST to this endpoint with { text: string, sourceLanguage: 'en'|'id'|'ja' } to get translations.",
  });
}
