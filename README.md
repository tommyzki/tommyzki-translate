# 🌐 Bidirectional Translation App

A **fullstack, responsive translation web app** built with **Next.js** and **Firebase**, supporting **Bahasa Indonesia**, **English**, and **Japanese** (Kanji + Romaji).  
Designed for **real-time, bidirectional translation** with a clean UI for both mobile and desktop users.

---

## ✨ Features

- 🔁 Translate between Bahasa Indonesia, English, and Japanese
- 🈶 Japanese output includes both **Kanji** and **Romaji**
- 📱 **Mobile-friendly layout** with vertically stacked sections
- 🖥️ **Desktop layout** with horizontally stacked cards and bottom-aligned input fields
- 🔗 **REST API** for external use (Postman, mobile apps, etc.)
- ☁️ **Firebase backend** with optional **Firestore** for history
- 🔐 Optional **Google login** for saving user translation history

---

## 📦 Tech Stack

**Frontend**: [Next.js](https://nextjs.org/) (React), [TailwindCSS](https://tailwindcss.com)  
**Backend**: Next.js API Routes, Firebase Functions (optional)  
**Translation API**: Google Translate API / DeepL / OpenAI  
**Database**: Firebase Firestore (optional)  
**Deployment**: Vercel / Firebase Hosting

---

## 📲 API Usage

### `POST /api/translate`

**Request Body**
```json
{
  "text": "Selamat pagi",
  "source": "id"
}
```

**Response**
```json
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
```

---

## 🛠️ Future Improvements

- 🌍 Add more languages (e.g. Korean, Chinese)
- 🧠 Offline support using localStorage/cache
- 📝 Editable translation history
- 🧩 Browser extension or PWA

---

## 🚀 Getting Started

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/bidirectional-translate-app.git
cd bidirectional-translate-app
npm install
```

Run the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the app.

---

## 🧑‍💻 Author

Made with ❤️ by [Your Name](https://github.com/yourusername)
