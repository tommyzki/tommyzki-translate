
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import LanguageCard from '@/components/LanguageCard';
import { useToast } from '@/hooks/use-toast';
import { translateText, type TranslationInput, type TranslationOutput } from '@/ai/flows/real-time-translation';
import { LANGUAGES, UI_LANGUAGE_ORDER, type LanguageCode } from '@/lib/languages';
import { debounce } from '@/lib/debounce';

type InputValuesState = Record<LanguageCode, string>;

export default function Home() {
  const [inputValues, setInputValues] = useState<InputValuesState>({ en: '', id: '', ja: '' });
  const [translationHistory, setTranslationHistory] = useState<TranslationOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastTypedLang, setLastTypedLang] = useState<LanguageCode | null>(null);
  const { toast } = useToast();

  const updatePreviews = useCallback(async (text: string, sourceLang: LanguageCode) => {
    if (!text.trim()) { // Should be handled by useEffect clearing, but as a safeguard
      setInputValues(currentInputs => {
        const newInputs = { ...currentInputs };
        UI_LANGUAGE_ORDER.forEach(langCode => {
          if (langCode !== sourceLang) newInputs[langCode] = '';
        });
        newInputs[sourceLang] = ''; // Ensure current input is also empty in state
        return newInputs;
      });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result: TranslationOutput = await translateText({ text, sourceLanguage: sourceLang });
      setInputValues(currentInputs => {
        const newPreviews = { ...currentInputs };
        newPreviews[sourceLang] = text; // Current text in the source input
        if (sourceLang !== 'en') newPreviews.en = result.en;
        if (sourceLang !== 'id') newPreviews.id = result.id;
        if (sourceLang !== 'ja') newPreviews.ja = result.ja.kanji;
        return newPreviews;
      });
    } catch (error) {
      console.error("Preview Translation error:", error);
      toast({
        title: "Preview Failed",
        description: "Could not fetch live preview. Please continue typing or try committing.",
        variant: "destructive",
      });
      // Optionally reset previews or keep them as is
      setInputValues(currentInputs => ({
        ...currentInputs,
        en: sourceLang === 'en' ? text : (currentInputs.en || ''), // Keep source text, clear others or keep if they had manual input
        id: sourceLang === 'id' ? text : (currentInputs.id || ''),
        ja: sourceLang === 'ja' ? text : (currentInputs.ja || ''),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Removed setIsLoading, setInputValues from deps as they are stable setters

  const debouncedUpdatePreviewsRef = useRef(
    debounce((text: string, sourceLang: LanguageCode) => {
      updatePreviews(text, sourceLang);
    }, 1000)
  );
  
  const activeInputText = lastTypedLang ? inputValues[lastTypedLang] : undefined;

  useEffect(() => {
    if (lastTypedLang && activeInputText !== undefined) {
      if (activeInputText.trim() === '') {
        setInputValues(currentInputs => {
          const newInputs = { ...currentInputs };
          UI_LANGUAGE_ORDER.forEach(langCode => {
            if (langCode !== lastTypedLang) {
              newInputs[langCode] = ''; 
            }
          });
          newInputs[lastTypedLang] = '';
          return newInputs;
        });
      } else {
        debouncedUpdatePreviewsRef.current(activeInputText, lastTypedLang);
      }
    }
  }, [activeInputText, lastTypedLang, setInputValues]);
  
  const handleInputChange = (langCode: LanguageCode, value: string) => {
    setInputValues(prev => ({ ...prev, [langCode]: value }));
    setLastTypedLang(langCode);
  };

  const handleCommitTranslation = useCallback(async (sourceLang: LanguageCode) => {
    const textToCommit = inputValues[sourceLang];
    if (!textToCommit.trim()) return;

    setIsLoading(true);
    try {
      const result = await translateText({ text: textToCommit, sourceLanguage: sourceLang });
      setTranslationHistory(prev => [...prev, result]);
      setInputValues({ en: '', id: '', ja: '' }); // Clear all inputs
      setLastTypedLang(null);
    } catch (error) {
      console.error("Commit Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "Could not commit the translation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputValues, toast]); // Removed stable setters

  return (
    <main className="flex flex-col items-center justify-center p-4 md:p-8 flex-grow w-full">
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <Languages className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Tommyzki Translator
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Translate, see history, and enjoy the retro vibe!
        </p>
      </header>

      {isLoading && (
        <div className="fixed top-4 right-4 z-50 bg-card p-3 rounded-md shadow-lg border-2 border-primary flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-primary font-medium">Translating...</span>
        </div>
      )}

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {UI_LANGUAGE_ORDER.map((langCode) => (
          <LanguageCard
            key={langCode}
            languageInfo={LANGUAGES[langCode]}
            inputValue={inputValues[langCode]}
            historyEntries={translationHistory}
            onInputChange={handleInputChange}
            onCommit={handleCommitTranslation}
            isLoading={isLoading}
            isInputDisabled={isLoading && lastTypedLang === langCode}
          />
        ))}
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Tommyzki Translator. Inspired by classic Pokémon games.</p>
      </footer>
    </main>
  );
}
