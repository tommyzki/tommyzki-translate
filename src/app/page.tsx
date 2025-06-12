
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Languages, Loader2, CornerDownLeft, Sparkles } from 'lucide-react';
import LanguageCard from '@/components/LanguageCard';
import { useToast } from '@/hooks/use-toast';
import { translateText, type TranslationInput, type TranslationOutput } from '@/ai/flows/real-time-translation';
import { detectLanguage, type DetectLanguageInput, type DetectLanguageOutput } from '@/ai/flows/detect-language';
import { LANGUAGES, UI_LANGUAGE_ORDER, type LanguageCode } from '@/lib/languages';
import { debounce } from '@/lib/debounce';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type LivePreviewState = Record<LanguageCode, string>;

export default function Home() {
  const [universalInput, setUniversalInput] = useState('');
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<LanguageCode | null>(null);
  const [livePreviews, setLivePreviews] = useState<LivePreviewState>({ en: '', id: '', ja: '' });
  const [translationHistory, setTranslationHistory] = useState<TranslationOutput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  const clearPreviews = useCallback(() => {
    setLivePreviews({ en: '', id: '', ja: '' });
    setDetectedSourceLanguage(null);
  }, []);
  
  const performFullTranslation = useCallback(async (text: string, sourceLang: LanguageCode): Promise<TranslationOutput | null> => {
    setIsLoading(true);
    try {
      const result: TranslationOutput = await translateText({ text, sourceLanguage: sourceLang });
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


  const updateLivePreviews = useCallback(async (text: string, sourceLang: LanguageCode) => {
    if (!text.trim()) {
      clearPreviews();
      return;
    }
    const translationResult = await performFullTranslation(text, sourceLang);
    if (translationResult) {
      setLivePreviews(currentPreviews => {
        const newPreviews = { ...currentPreviews };
        newPreviews[sourceLang] = text; 
        if (sourceLang !== 'en') newPreviews.en = translationResult.en;
        if (sourceLang !== 'id') newPreviews.id = translationResult.id;
        if (sourceLang !== 'ja') newPreviews.ja = translationResult.ja.kanji;
        return newPreviews;
      });
    } else {
      // If translation failed, at least keep the source text in its preview
      setLivePreviews(currentPreviews => ({
        ...currentPreviews,
        [sourceLang]: text,
      }));
    }
  }, [clearPreviews, performFullTranslation]);


  const debouncedDetectAndTranslateRef = useRef(
    debounce(async (text: string) => {
      if (!text.trim()) {
        clearPreviews();
        setIsDetecting(false);
        return;
      }
      setIsDetecting(true);
      try {
        const detectionResult: DetectLanguageOutput = await detectLanguage({ text });
        setDetectedSourceLanguage(detectionResult.language);
        await updateLivePreviews(text, detectionResult.language);
      } catch (error) {
        console.error("Language Detection error:", error);
        toast({
          title: "Language Detection Failed",
          description: "Could not detect language. Defaulting to English or try specifying.",
          variant: "destructive",
        });
        setDetectedSourceLanguage('en'); // Fallback
        await updateLivePreviews(text, 'en');
      } finally {
        setIsDetecting(false);
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
    if (!universalInput.trim() || !detectedSourceLanguage) {
      toast({ title: "Cannot Translate", description: "Please enter some text to translate.", variant: "default" });
      return;
    }

    const result = await performFullTranslation(universalInput, detectedSourceLanguage);
    if (result) {
      setTranslationHistory(prev => [result, ...prev]); // Add to top of history
      setUniversalInput(''); 
      clearPreviews();
    }
  };
  
  return (
    <main className="flex flex-col items-center p-4 md:p-8 w-full min-h-screen">
      <header className="mb-6 text-center w-full max-w-6xl">
        <div className="flex items-center justify-center gap-3">
          <Languages className="h-10 w-10 text-primary" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">
            Tommyzki Translator
          </h1>
        </div>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Type in any supported language, and see live translations. Press "Next Line" to save.
        </p>
      </header>

      {(isLoading || isDetecting) && (
        <div className="fixed top-4 right-4 z-50 bg-card p-3 rounded-md shadow-lg border-2 border-primary flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-primary font-medium">{isDetecting ? 'Detecting Language...' : 'Translating...'}</span>
        </div>
      )}

      {/* Content wrapper for cards and footer, this will grow */}
      <div className="flex flex-col items-center flex-grow w-full max-w-6xl">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {UI_LANGUAGE_ORDER.map((langCode) => (
            <LanguageCard
              key={langCode}
              languageInfo={LANGUAGES[langCode]}
              livePreviewText={livePreviews[langCode]}
              historyEntries={translationHistory}
              isLoading={isLoading || isDetecting}
              isDetectedSource={detectedSourceLanguage === langCode && universalInput.trim() !== ''}
            />
          ))}
        </div>
        
        <footer className="mt-auto pt-12 pb-4 text-center text-sm text-muted-foreground w-full">
          <p>&copy; {new Date().getFullYear()} Tommyzki Translator. Inspired by classic Pokémon games.</p>
        </footer>
      </div>

      {/* Input Area - Moved to the bottom of the page flow */}
      <div className="w-full max-w-2xl mt-6 mb-2">
        <div className="relative">
          <Textarea
            value={universalInput}
            onChange={handleUniversalInputChange}
            placeholder="Type here to translate (English, Bahasa Indonesia, or Japanese)..."
            className="w-full resize-none text-base border-2 border-input focus:border-accent ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 p-4 pr-28"
            rows={4}
            aria-label="Universal translation input"
            disabled={isLoading || isDetecting}
          />
          {detectedSourceLanguage && universalInput.trim() && (
            <Badge variant="secondary" className="absolute top-3 right-3 bg-accent/80 text-accent-foreground">
              <Sparkles className="w-3 h-3 mr-1.5" />
              {LANGUAGES[detectedSourceLanguage].name}
            </Badge>
          )}
        </div>
        <Button 
          onClick={handleCommitTranslation} 
          disabled={!universalInput.trim() || isLoading || isDetecting || !detectedSourceLanguage}
          className="w-full mt-3"
          variant="default"
          size="lg"
        >
          <CornerDownLeft className="mr-2 h-5 w-5" />
          Next Line & Save
        </Button>
      </div>
    </main>
  );
}
