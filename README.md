🌐 Bidirectional Translation App
A fullstack, responsive translation web app built with Next.js and Firebase, supporting Bahasa Indonesia, English, and Japanese (Kanji + Romaji). Designed for real-time, bidirectional translation with a clean UI for both mobile and desktop users.

✨ Features
🔁 Translate between Bahasa Indonesia, English, and Japanese
🈶 Japanese output includes both Kanji and Romaji
📱 Mobile-friendly layout with vertically stacked sections
🖥️ Desktop layout with horizontally stacked cards and bottom-aligned input fields
🔗 REST API for external use (Postman, mobile apps, etc.)
☁️ Firebase backend with optional Firestore for history
🔐 Optional Google login for saving user translation history


📦 Tech Stack
Frontend: Next.js (React), TailwindCSS
Backend: Next.js API Routes, Firebase Functions (optional)
Translation API: Google Translate API / DeepL / OpenAI
Database: Firebase Firestore (optional)
Deployment: Vercel / Firebase Hosting


📲 API Usage
POST /api/translate
{
  "text": "Selamat pagi",
  "source": "id"
}

Response:
{
  "original": "Selamat pagi",
  "translations": {
    "en": "Good morning",
    "ja": {
      "kanji": "おはようございます",
      "romaji": "ohayou gozaimasu"
    }
  }
}


