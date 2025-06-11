'use client';

import { useState, useEffect, useCallback } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import LanguageCard from '@/components/LanguageCard';
import { Button } from '@/components/ui/button'; // Added for potential future use like clear
import { useToast } from '@/hooks/use-toast';
import { translateText, type TranslationInput, type TranslationOutput } from '@/ai/flows/real-time-translation';
import { LANGUAGES, UI_LANGUAGE_ORDER, type LanguageCode } from '@/lib/languages';
import { debounce } from '@/lib/debounce';

type InputValuesState = Record<LanguageCode, string>;
type DisplayValuesState = {
  en: string;
  id: string;
  ja: { kanji: string; romaji: string };
};

export default function Home() {
  const [inputValues, setInputValues] = useState<InputValuesState>({ en: '', id: '', ja: '' });
  const [displayValues, setDisplayValues] = useState<DisplayValuesState>({
    en: '',
    id: '',
    ja: { kanji: '', romaji: '' },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastTypedLang, setLastTypedLang] = useState<LanguageCode | null>(null);
  const { toast } = useToast();

  const performTranslation = useCallback(async (text: string, sourceLang: LanguageCode) => {
    if (!text.trim()) {
      setDisplayValues({ en: '', id: '', ja: { kanji: '', romaji: '' } });
      // Clear other input fields if source is cleared
      const clearedInputs: InputValuesState = { en: '', id: '', ja: '' };
      clearedInputs[sourceLang] = ''; // Keep the typed field as is (empty)
      setInputValues(clearedInputs);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const translationInput: TranslationInput = { text, sourceLanguage: sourceLang };
      const result: TranslationOutput = await translateText(translationInput);
      
      setDisplayValues(result);

      // Update other input fields with translations
      const newInputValues: InputValuesState = { ...inputValues, [sourceLang]: text };
      if (sourceLang !== 'en') newInputValues.en = result.en;
      if (sourceLang !== 'id') newInputValues.id = result.id;
      if (sourceLang !== 'ja') newInputValues.ja = result.ja.kanji; // Populate with Kanji
      setInputValues(newInputValues);

    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Failed",
        description: "Could not translate the text. Please try again.",
        variant: "destructive",
      });
      // Reset display values on error for clarity
      setDisplayValues({ en: text, id: text, ja: { kanji: text, romaji: text } });
    } finally {
      setIsLoading(false);
    }
  }, [toast, inputValues]); // Added inputValues to dependencies

  const debouncedTranslate = useCallback(debounce(performTranslation, 750), [performTranslation]);

  useEffect(() => {
    if (lastTypedLang && inputValues[lastTypedLang] !== undefined) {
      const textToTranslate = inputValues[lastTypedLang];
      if (textToTranslate.trim() === '') { // If field is cleared
        performTranslation('', lastTypedLang); // Clear translations and other fields
      } else {
        debouncedTranslate(textToTranslate, lastTypedLang);
      }
    }
  }, [inputValues, lastTypedLang, debouncedTranslate, performTranslation]);


  const handleInputChange = (langCode: LanguageCode, value: string) => {
    setInputValues(prev => ({ ...prev, [langCode]: value }));
    setLastTypedLang(langCode);
    // If user clears the input, immediately update display for that card to be empty
    if (value.trim() === '') {
      if (langCode === 'ja') {
        setDisplayValues(prev => ({ ...prev, ja: { kanji: '', romaji: '' } }));
      } else {
        setDisplayValues(prev => ({ ...prev, [langCode]: '' }));
      }
    }
  };

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
          Translate between Bahasa Indonesia, English, and Japanese with a retro touch!
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
            displayValue={
              langCode === 'ja'
                ? displayValues.ja
                : displayValues[langCode as Exclude<LanguageCode, 'ja'>]
            }
            onInputChange={handleInputChange}
            isLoading={isLoading}
            isSourceLanguage={lastTypedLang === langCode && isLoading}
          />
        ))}
      </div>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Tommyzki Translator. Inspired by classic Pokémon games.</p>
      </footer>
    </main>
  );
}
