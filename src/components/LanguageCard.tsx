import type { ChangeEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { LanguageInfo, LanguageCode } from '@/lib/languages';

interface LanguageCardProps {
  languageInfo: LanguageInfo;
  inputValue: string;
  displayValue: string | { kanji: string; romaji: string };
  onInputChange: (langCode: LanguageCode, value: string) => void;
  isLoading: boolean;
  isSourceLanguage?: boolean;
}

export default function LanguageCard({
  languageInfo,
  inputValue,
  displayValue,
  onInputChange,
  isLoading,
  isSourceLanguage = false,
}: LanguageCardProps) {
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(languageInfo.code, e.target.value);
  };

  const renderDisplayValue = () => {
    if (isLoading && !isSourceLanguage) {
      return (
        <>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </>
      );
    }
    if (languageInfo.code === 'ja' && typeof displayValue === 'object') {
      return (
        <div>
          <p className="text-lg font-semibold" lang="ja">{displayValue.kanji || ' '}</p>
          <p className="text-sm text-muted-foreground" lang="ja-Latn">{displayValue.romaji || ' '}</p>
        </div>
      );
    }
    return <p className="text-lg">{typeof displayValue === 'string' ? (displayValue || ' ') : ' '}</p>;
  };

  return (
    <Card className="w-full shadow-lg border-2 border-foreground/20 hover:border-primary transition-colors duration-300 flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary">{languageInfo.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow min-h-[100px] bg-background/50 p-4 rounded-md">
        {renderDisplayValue()}
      </CardContent>
      <CardFooter className="p-4">
        <Textarea
          value={inputValue}
          onChange={handleInputChange}
          placeholder={languageInfo.placeholder}
          className="w-full resize-none text-base border-2 border-input focus:border-accent ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
          rows={4}
          aria-label={`Input for ${languageInfo.name}`}
          disabled={isLoading && isSourceLanguage} 
        />
      </CardFooter>
    </Card>
  );
}
