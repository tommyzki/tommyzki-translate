
import type { ChangeEvent } from 'react';
import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from 'lucide-react';
import type { LanguageInfo, LanguageCode } from '@/lib/languages';
import type { TranslationOutput } from '@/ai/flows/real-time-translation';

interface LanguageCardProps {
  languageInfo: LanguageInfo;
  livePreviewText: string;
  historyEntries: TranslationOutput[];
  isLoading: boolean;
  isDetectedSource: boolean;
}

export default function LanguageCard({
  languageInfo,
  livePreviewText,
  historyEntries,
  isLoading,
  isDetectedSource,
}: LanguageCardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const livePreviewScrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (scrollRef.current) {
      // Scroll to bottom for new history entries
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historyEntries]);

  useEffect(() => {
    // Scroll live preview to bottom if content overflows, e.g. for multi-line Japanese
    if (livePreviewScrollRef.current) {
      livePreviewScrollRef.current.scrollTop = livePreviewScrollRef.current.scrollHeight;
    }
  }, [livePreviewText]);


  const renderHistoryEntry = (entry: TranslationOutput, index: number) => {
    let textToShow: React.ReactNode;
    const textKey = `${languageInfo.code}-history-${index}-${Date.now()}`; // More unique key

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
        key={textKey}
        className="p-2 mb-2 rounded-md bg-card/80 text-sm border border-border/30 shadow-sm break-words whitespace-pre-wrap"
      >
        {textToShow}
      </div>
    );
  };
  
  const livePreviewContent = () => {
    if (isLoading && !livePreviewText) return <span className="text-muted-foreground italic">Loading preview...</span>;
    if (!livePreviewText && !isDetectedSource) return <span className="text-muted-foreground italic">Awaiting input...</span>;
    if (!livePreviewText && isDetectedSource) return <span className="text-muted-foreground italic">Type to see translation...</span>;


    if (languageInfo.code === 'ja') {
        // Assuming livePreviewText for Japanese is just Kanji.
        // If it contains an object {kanji, romaji} like TranslationOutput, adjust accordingly.
        // For simplicity, let's assume it's just the Kanji string for live preview.
        // If livePreviewText is an object {kanji, romaji} from a more complex state:
        // return (
        //   <>
        //     <p className="font-semibold" lang="ja">{livePreviewText.kanji || ' '}</p>
        //     <p className="text-xs text-muted-foreground/80" lang="ja-Latn">{livePreviewText.romaji || ' '}</p>
        //   </>
        // );
       return <p className="font-semibold" lang="ja">{livePreviewText || ' '}</p>;
    }
    return <p>{livePreviewText || ' '}</p>;
  };


  return (
    <Card className={`w-full shadow-lg border-2 ${isDetectedSource && livePreviewText.trim() ? 'border-primary' : 'border-foreground/20'} hover:border-accent transition-all duration-300 flex flex-col`}>
      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
        <CardTitle className={`font-headline text-lg ${isDetectedSource && livePreviewText.trim() ? 'text-primary' : 'text-foreground'}`}>{languageInfo.name}</CardTitle>
        {isDetectedSource && livePreviewText.trim() && (
          <Badge variant="outline" className="border-primary text-primary">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Source
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-1 p-0 overflow-hidden">
        <ScrollArea className="h-60 w-full px-3 pt-2">
          <div ref={scrollRef}>
            {historyEntries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Saved translations will appear here.</p>
            )}
            {historyEntries.map(renderHistoryEntry)}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter 
        ref={livePreviewScrollRef}
        className="p-3 border-t border-border/20 bg-background/40 min-h-[70px] max-h-[120px] overflow-y-auto flex items-start" // Ensure footer can scroll if content is long
        style={{ scrollbarWidth: 'thin' }}
      >
        <div className="text-sm w-full break-words whitespace-pre-wrap">
         {livePreviewContent()}
        </div>
      </CardFooter>
    </Card>
  );
}
