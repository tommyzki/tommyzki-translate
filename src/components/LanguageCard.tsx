
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
  livePreviewText: string | TranslationOutput['ja'];
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

  const renderMessage = (msg: string, romaji?: string) => (
    <>
      <p className="text-sm text-muted-foreground" lang={languageInfo.code}>{msg}</p>
      {romaji && <p className="text-xs text-muted-foreground/80" lang="ja-Latn">{romaji}</p>}
    </>
  );

  const livePreviewContent = () => {
    const langCode = languageInfo.code;

    const isJapanesePreview = (
      val: string | TranslationOutput['ja']
    ): val is TranslationOutput['ja'] =>
      typeof val === 'object' && val !== null && 'kanji' in val && 'romaji' in val;

    const isEmptyJa = (val: string | TranslationOutput['ja']) =>
      isJapanesePreview(val) && !val.kanji.trim() && !val.romaji.trim();

    // Loading or awaiting input
    if (isLoading && (!livePreviewText || isEmptyJa(livePreviewText))) {
      if (langCode === 'ja') return renderMessage('プレビューを読み込み中...', 'Purebyū o yomikomi-chū...');
      if (langCode === 'id') return renderMessage('Memuat pratinjau...');
      return renderMessage('Loading preview...');
    }

    if ((!livePreviewText || isEmptyJa(livePreviewText)) && !isDetectedSource) {
      if (langCode === 'ja') return renderMessage('入力を待っています...', 'Nyūryoku o matte imasu...');
      if (langCode === 'id') return renderMessage('Menunggu input...');
      return renderMessage('Awaiting input...');
    }

    // Render Japanese with kanji + romaji
    if (langCode === 'ja' && isJapanesePreview(livePreviewText)) {
      return renderMessage(livePreviewText.kanji || '　', livePreviewText.romaji || '　');
    }

    // Default for EN/ID text
    return <p>{(livePreviewText as string) || '　'}</p>;
  };

  return (
    <Card className={`w-full shadow-lg border-2 ${isDetectedSource ? 'border-primary' : 'border-foreground/20'} hover:border-accent transition-all duration-300 flex flex-col`}>
      <CardHeader className="py-3 px-4 flex flex-row justify-between items-center">
        <CardTitle className={`font-headline text-lg ${isDetectedSource ? 'text-primary' : 'text-foreground'}`}>{languageInfo.name}</CardTitle>
        {isDetectedSource && (
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
              <>
                {languageInfo.code == 'en' && renderMessage('Saved translations will appear here.')}
                {languageInfo.code == 'id' && renderMessage('Terjemahan yang disimpan akan muncul di sini.')}
                {languageInfo.code == 'ja' && renderMessage('保存された翻訳はここに表示されます。', `Hozon sareta hon'yaku wa koko ni hyōji sa remasu.`)}
              </>
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
