
import type { ChangeEvent } from 'react';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CornerDownLeft } from 'lucide-react';
import type { LanguageInfo, LanguageCode } from '@/lib/languages';
import type { TranslationOutput } from '@/ai/flows/real-time-translation'; // Assuming this is the type for history entries

interface LanguageCardProps {
  languageInfo: LanguageInfo;
  inputValue: string;
  historyEntries: TranslationOutput[];
  onInputChange: (langCode: LanguageCode, value: string) => void;
  onCommit: (langCode: LanguageCode) => void;
  isLoading: boolean;
  isInputDisabled?: boolean;
}

export default function LanguageCard({
  languageInfo,
  inputValue,
  historyEntries,
  onInputChange,
  onCommit,
  isLoading,
  isInputDisabled = false,
}: LanguageCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historyEntries]);

  const handleInputChangeLocal = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(languageInfo.code, e.target.value);
  };

  const handleCommitClick = () => {
    onCommit(languageInfo.code);
  };

  const renderHistoryEntry = (entry: TranslationOutput, index: number) => {
    let textToShow: React.ReactNode;
    if (languageInfo.code === 'ja') {
      textToShow = (
        <div>
          <p className="font-semibold" lang="ja">{entry.ja.kanji || ' '}</p>
          <p className="text-xs text-muted-foreground/80" lang="ja-Latn">{entry.ja.romaji || ' '}</p>
        </div>
      );
    } else {
      textToShow = <p>{entry[languageInfo.code as Exclude<LanguageCode, 'ja'>] || ' '}</p>;
    }
    return (
      <div 
        key={`${languageInfo.code}-history-${index}`} 
        className="p-2 mb-2 rounded-md bg-card text-sm border border-border/50 shadow-sm break-words whitespace-pre-wrap"
      >
        {textToShow}
      </div>
    );
  };

  return (
    <Card className="w-full shadow-lg border-2 border-foreground/20 hover:border-primary transition-colors duration-300 flex flex-col">
      <CardHeader className="py-4 px-4">
        <CardTitle className="font-headline text-lg text-primary">{languageInfo.name}</CardTitle>
      </CardHeader>
      <CardContent 
        ref={scrollRef}
        className="flex-grow flex flex-col gap-1 p-3 overflow-y-auto h-72 bg-background/30 rounded-md mx-2 mb-2 border border-border/30"
      >
        {historyEntries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Translation history will appear here.</p>
        )}
        {historyEntries.map(renderHistoryEntry)}
      </CardContent>
      <CardFooter className="p-3 flex flex-col gap-2 border-t border-border/20">
        <Textarea
          value={inputValue}
          onChange={handleInputChangeLocal}
          placeholder={languageInfo.placeholder}
          className="w-full resize-none text-base border-2 border-input focus:border-accent ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          rows={3}
          aria-label={`Input for ${languageInfo.name}`}
          disabled={isInputDisabled || isLoading} 
        />
        <Button 
          onClick={handleCommitClick} 
          disabled={!inputValue.trim() || isLoading || isInputDisabled}
          className="w-full"
          variant="default"
          size="sm"
        >
          <CornerDownLeft className="mr-2 h-4 w-4" />
          Next Line
        </Button>
      </CardFooter>
    </Card>
  );
}
