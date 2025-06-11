export type LanguageCode = 'en' | 'id' | 'ja';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  placeholder: string;
}

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  id: { code: 'id', name: 'Bahasa Indonesia', placeholder: 'Ketik Bahasa Indonesia di sini...' },
  en: { code: 'en', name: 'English', placeholder: 'Type English here...' },
  ja: { code: 'ja', name: 'Japanese', placeholder: '日本語で入力してください...' },
};

// Order of cards displayed on the UI
export const UI_LANGUAGE_ORDER: LanguageCode[] = ['id', 'en', 'ja'];
