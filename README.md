# ✝️ Bible Website

A modern, interactive Bible web application that provides daily scripture, spiritual guidance, and user-personalized experiences with both **offline features** and **AI-powered insights**.

---

## 🌟 Features

### 📖 Core Features 

* **📅 Daily Word**
  Automatically displays a Bible verse for each day based on liturgical significance or predefined data.

* **🕊️ Divine Guidance**
  Get Bible verses based on user topics (offline dataset or AI-enhanced).

* **🧠 Bible Quiz**
  Interactive quiz system with:

  * Difficulty levels (Easy, Medium, Hard)
  * Categories (Old / New Testament)
  * Score tracking

* **📚 Virtual Bible (Core Feature)**
  Read the Bible like a real book:

  * Select Testament → Book → Chapter → Verse
  * Fast loading using local JSON
  * Search functionality (optional)

* ❤️ **Saved Verses**
  Users can save their favorite verses for later reading.

---

### 🤖 AI Features 

* **🙏 Prayer Generator**

> These features require a valid AI API key (e.g., Gemini).
> The app gracefully falls back to offline responses if unavailable.

---

### 🔐 Authentication

* **Google Sign-In Integration**
* Secure session handling
* Personalized user experience

---

## 🛠️ Tech Stack

### Frontend

* React (Modern Hooks)
* Axios (API calls)
* CSS / Styled Components
* Responsive UI Design

### Backend

* Node.js
* Express.js
* JWT Authentication
* REST API Architecture

### Data Handling

* JSON-based offline storage:

  * Bible verses
  * Quiz questions
  * Daily words

### Optional Integrations

* Gemini API (AI features)

---

## 📁 Project Structure

```
Bible-App/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── middleware/
│   ├── auth/
│   ├── database/
│   ├── data/
│   │   ├── bible.json
│   │   └── quiz.json
│   └── package.json
│
├── .gitignore
├── README.md
└── .env.example
```

---

## ⚙️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/bible-app.git
cd bible-app
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key (optional)
```

Run backend:

```bash
node server.js
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

## 🌐 API Endpoints

### Health Check

```
GET /api/health
```

### Daily Verse

```
GET /api/daily-verse
```

### Bible Quiz

```
GET /api/quiz
POST /api/quiz/answer
```

### Virtual Bible

```
GET /api/bible/books
GET /api/bible/:book/:chapter
```

### Divine Guidance

```
POST /api/verse-finder
```

### Authentication

```
POST /api/auth/login
POST /api/auth/signup
```

---

## 🔐 Environment Variables

Create a `.env` file in backend:

```env
PORT=5000
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_api_key
```

---

## 🚀 Deployment

### Recommended Free Hosting

| Service | Purpose  |
| ------- | -------- |
| Vercel  | Frontend |
| Render  | Backend  |

---

### ⚠️ Important Deployment Notes

* Replace:

  ```
  http://localhost:5000
  ```

  with your deployed backend URL

* Update CORS:

  ```js
  origin: [
    'http://localhost:3000',
    'https://your-app.vercel.app'
  ]
  ```

* Add your domain in Google OAuth settings

---

## 🧠 Design Philosophy

* Clean and reverent UI
* Scripture-focused experience
* Minimal distractions
* Accessible and responsive

---

## ⚠️ Known Limitations

* Free hosting may cause backend sleep (Render)
* AI features depend on API quota
* Large JSON files may impact performance

---

## 📌 Future Improvements

* Bookmark syncing with database
* Advanced Bible search
* Multi-language support
* Admin dashboard

---

## 📜 License

MIT License

---

🙏 *“Your word is a lamp to my feet and a light to my path.”* – Psalm 119:105
