
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Languages, Loader2, CornerDownLeft, Sparkles } from 'lucide-react';
import LanguageCard from '@/components/LanguageCard';
import { useToast } from '@/hooks/use-toast';
import { detectLanguage } from '@/ai/flows/detect-language';
import { translateText, type TranslationOutput } from '@/ai/flows/real-time-translation';
import { LANGUAGES, UI_LANGUAGE_ORDER, type LanguageCode } from '@/lib/languages';
import { debounce } from '@/lib/debounce';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


export default function Home() {
  const [universalInput, setUniversalInput] = useState('');
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<LanguageCode | null>(null);
  const [livePreviews, setLivePreviews] = useState<TranslationOutput>({
    source: {
      code: '',
      name: '',
    },
    en: '',
    id: '',
    ja: {
      kanji: '',
      romaji: '',
    },
  });
  const [translationHistory, setTranslationHistory] = useState<TranslationOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clearPreviews = useCallback(() => {
    setLivePreviews({
      source: {
        code: '',
        name: '',
      },
      en: '',
      id: '',
      ja: {
        kanji: '',
        romaji: '',
      },
    });
    setDetectedSourceLanguage(null);
  }, []);

  const performFullTranslation = useCallback(async (text: string, sourceLang: LanguageCode | null): Promise<TranslationOutput | null> => {
    if (!sourceLang) {
      // If source language is not detected or set, we can't reliably translate.
      // However, the prompt for translateText might be robust enough if we pass a generic instruction.
      // For now, let's assume the translateText flow can handle an unknown source or default.
      // Alternatively, we could show an error or default to a specific source language.
      console.warn("Source language not specified for full translation. Relying on Genkit flow's robustness.");
    }
    setIsLoading(true);
    try {
      // The current translateText flow doesn't explicitly take sourceLanguage as a top-level param in its input schema.
      // It expects the prompt to infer or be told the source language implicitly.
      // We will modify the prompt in real-time-translation.ts if explicit source is needed.
      // For now, we rely on the language detection being part of the overall process leading to this.
      // The `source` field in TranslationOutput is set by the AI.
      const result: TranslationOutput = await translateText({ text });
      return result;
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: typeof error === 'string' ? error : (error as Error)?.message || "Could not perform translation.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  const debouncedDetectAndTranslateRef = useRef(
    debounce(async (text: string) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        clearPreviews();
        return;
      }

      setIsLoading(true);
      try {
        const detectionResult = await detectLanguage({ text: trimmedText });
        const detectedLang = detectionResult.language;
        setDetectedSourceLanguage(detectedLang);

        const translationResult = await translateText({ text: trimmedText });

        if (translationResult) {
          setLivePreviews(translationResult);
        } else {
          // Handle case where translation might fail but detection worked
          // Or provide some default state for previews
          const fallbackPreviews: Partial<TranslationOutput> = { source: { code: detectedLang, name: LANGUAGES[detectedLang]?.name || detectedLang.toUpperCase() }};
          UI_LANGUAGE_ORDER.forEach(lang => {
            if (lang === detectedLang) {
              fallbackPreviews[lang] = trimmedText as any; // Type assertion might be needed depending on structure
            } else {
               fallbackPreviews[lang] = '' as any;
            }
          });
          setLivePreviews(prev => ({...prev, ...fallbackPreviews}));
        }
      } catch (error) {
        console.error('Detection or Translation failed:', error);
        toast({
          title: "Error",
          description: "Could not detect language or translate.",
          variant: "destructive",
        });
        clearPreviews(); // Clear previews on error
      } finally {
        setIsLoading(false);
      }
    }, 1000)
  );

  useEffect(() => {
    debouncedDetectAndTranslateRef.current(universalInput);
  }, [universalInput]);

  const handleUniversalInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUniversalInput(e.target.value);
    if (!e.target.value.trim()) {
      clearPreviews();
    }
  };

  const handleCommitTranslation = async () => {
    const trimmedInput = universalInput.trim();
    if (!trimmedInput) {
      toast({ title: "Cannot Translate", description: "Please enter some text to translate.", variant: "default" });
      return;
    }

    // Use the latest livePreviews if available and consistent, otherwise re-translate
    // This ensures the committed history entry is accurate
    let resultToCommit = livePreviews;

    // If the source in livePreviews doesn't match detected or input is very different, re-translate fully.
    // For simplicity, we can re-fetch based on current universalInput and detectedSourceLanguage.
    if (!livePreviews.source.code || livePreviews[livePreviews.source.code as Exclude<LanguageCode, 'ja'>] !== trimmedInput && livePreviews.source.code !== 'ja') {
        const finalTranslation = await performFullTranslation(trimmedInput, detectedSourceLanguage);
        if (finalTranslation) {
            resultToCommit = finalTranslation;
        } else {
            // If final translation fails, don't add to history.
            toast({ title: "Save Failed", description: "Could not save the translation.", variant: "destructive" });
            return;
        }
    }


    if (resultToCommit && resultToCommit.source.code) { // Ensure we have a valid translation
      setTranslationHistory(prev => [resultToCommit, ...prev]);
      setUniversalInput('');
      clearPreviews();
    } else {
       toast({ title: "Save Failed", description: "Translation data is incomplete.", variant: "destructive" });
    }
  };

  return (
    <main className="flex flex-col w-full min-h-screen bg-background">
      <header className="w-full py-3 px-4 md:px-8 border-b border-border/50 bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Languages className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-primary">
            Tommyzki Translator
          </h1>
        </div>
      </header>

      {/* Container for the rest of the page content, applying padding and centering */}
      <div className="flex flex-col items-center flex-grow w-full p-4 md:p-8">
        {isLoading && (
          <div className="fixed top-16 right-4 z-50 bg-card p-3 rounded-md shadow-lg border-2 border-primary flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-primary font-medium">Translating...</span>
          </div>
        )}

        {/* Content wrapper for cards */}
        <div className="w-full max-w-6xl">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {UI_LANGUAGE_ORDER.map((langCode) => (
              <LanguageCard
                key={langCode}
                languageInfo={LANGUAGES[langCode]}
                livePreviewText={
                  langCode === 'ja'
                    ? livePreviews.ja
                    : livePreviews[langCode as Exclude<LanguageCode, 'ja'>]
                }
                historyEntries={translationHistory}
                isLoading={isLoading && detectedSourceLanguage !== langCode} // Card specific loading might be complex
                isDetectedSource={detectedSourceLanguage === langCode && universalInput.trim().length > 0}
              />
            ))}
          </div>
        </div>

        {/* Input Area - Moved to the bottom of this centered, padded container */}
        <div className="w-full max-w-2xl mt-auto pt-6 mb-2">
          <div className="relative">
            <Textarea
              value={universalInput}
              onChange={handleUniversalInputChange}
              placeholder="Type here to translate (English, Bahasa Indonesia, or Japanese)..."
              className="w-full resize-none text-base border-2 border-input focus:border-accent ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 p-4 pr-28"
              rows={4}
              aria-label="Universal translation input"
              disabled={isLoading} // Disable input while any global loading is active
            />
            {livePreviews.source.name && universalInput.trim() && !isLoading && (
              <Badge variant="secondary" className="absolute top-3 right-3 bg-accent/80 text-accent-foreground">
                <Sparkles className="w-3 h-3 mr-1.5" />
                Detected: {livePreviews.source.name}
              </Badge>
            )}
          </div>
          <Button
            onClick={handleCommitTranslation}
            disabled={!universalInput.trim() || isLoading}
            className="w-full mt-3"
            variant="default"
            size="lg"
          >
            <CornerDownLeft className="mr-2 h-5 w-5" />
            Next Line & Save
          </Button>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground w-full border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <p>&copy; {new Date().getFullYear()} Tommyzki Translator. Inspired by classic Pokémon games.</p>
        </div>
      </footer>
    </main>
  );
}
