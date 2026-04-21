const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2/promise');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

const GeminiService = require('./geminiService');
const LiturgicalCalendar = require('./liturgicalCalendar');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { auth, optionalAuth } = require('./middleware/auth');
require('./auth/google');

// Load local data files
const versesData = require('./data/verses.json');
const quizData = require('./data/quiz.json');
const bibleData = require('./data/bible.json');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
app.use(passport.initialize());
app.use(passport.session());
// Expose uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Initialize services
const geminiService = new GeminiService(process.env.GEMINI_API_KEY);
const liturgicalCalendar = new LiturgicalCalendar();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bible_app'
};

// Rate limiting delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Daily verse cache (in-memory)
const dailyVerseCache = new Map();

function getBibleTestaments() {
  const testaments = bibleData.testaments || {};
  return {
    old: testaments['Old Testament'] || testaments.Old_Testament || { books: {} },
    new: testaments['New Testament'] || testaments.New_Testament || { books: {} }
  };
}

function getBookData(bookName) {
  const { old, new: newTestament } = getBibleTestaments();
  const allBooks = {
    ...(old.books || {}),
    ...(newTestament.books || {})
  };

  if (allBooks[bookName]) {
    return { canonicalBookName: bookName, bookData: allBooks[bookName] };
  }

  const matchedBookName = Object.keys(allBooks).find(
    existingBook => existingBook.toLowerCase() === String(bookName).toLowerCase()
  );

  if (!matchedBookName) {
    return { canonicalBookName: null, bookData: null };
  }

  return { canonicalBookName: matchedBookName, bookData: allBooks[matchedBookName] };
}

// Helper function to get verse by date (offline)
function getVerseByDate(date) {
  const dateKey = date.toISOString().split('T')[0];
  
  // Check cache first
  if (dailyVerseCache.has(dateKey)) {
    return dailyVerseCache.get(dateKey);
  }
  
  // Get liturgical information
  const dailyImportance = liturgicalCalendar.getDailyImportance(date);
  const season = dailyImportance.season?.replace('_', ' ')?.toLowerCase() || '';
  const feastNames = dailyImportance.feastDays?.map(f => f.name.toLowerCase()) || [];
  
  // Find matching verse based on tags
  let selectedVerse = null;
  
  // First try to match by feast day
  for (const feast of feastNames) {
    const match = versesData.verses.find(v => 
      v.tags.some(tag => tag.toLowerCase().includes(feast))
    );
    if (match) {
      selectedVerse = match;
      break;
    }
  }
  
  // If no feast match, try season match
  if (!selectedVerse && season) {
    selectedVerse = versesData.verses.find(v => 
      v.tags.some(tag => tag.toLowerCase().includes(season))
    );
  }
  
  // If no match, use date-based selection for consistency
  if (!selectedVerse) {
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const index = dayOfYear % versesData.verses.length;
    selectedVerse = versesData.verses[index];
  }
  
  // Cache the result
  dailyVerseCache.set(dateKey, selectedVerse);
  
  return selectedVerse;
}

// Google OAuth Routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  async (req, res) => {
    try {
      const profile = req.user;
      const email = profile.emails[0].value;
      const name = profile.displayName || profile.name.givenName + ' ' + profile.name.familyName;

      // Check if user exists in database
      const connection = await mysql.createConnection(dbConfig);
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      let userId;
      if (rows.length === 0) {
        // Create new user with Google OAuth (no password)
        const [result] = await connection.execute(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          [name, email, 'google_oauth', 'user']
        );
        userId = result.insertId;
      } else {
        userId = rows[0].id;
      }

      await connection.end();

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, userId, email, role: 'user' },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '24h' }
      );

      // Redirect to frontend OAuth callback with token
      res.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

// Routes
app.get('/', (req, res) => {
  res.json({
    message: "Bible App API is running.",
    endpoints: {
      "/api/health": "Health check",
      "/api/daily-verse": "Get today's daily Bible verse (offline)",
      "/api/date-verse?date=YYYY-MM-DD": "Get verse data for a specific date (offline)",
      "/api/divine-guidance": "POST - Get verse by topic (AI)",
      "/api/prayer": "POST - Generate prayer (AI)",
      "/api/quiz?difficulty=easy&category=Old": "Get quiz questions (offline)",
      "/api/quiz/answer": "POST - Validate quiz answer (offline)",
      "/api/bible/books": "Get all Bible books (offline)",
      "/api/bible?book=John&chapter=3": "Get Bible verses (offline)",
      "/api/bible/search?keyword=love": "Search Bible verses (offline)",
      "/api/saved-verses": "POST/GET - Manage saved verses (MySQL)",
      "/api/saved-verses/:id": "DELETE - Delete saved verse (MySQL)",
      "/api/auth/signup": "POST - Register new user",
      "/api/auth/login": "POST - Login user",
      "/api/auth/guest": "POST - Guest login",
      "/api/auth/profile": "GET/PUT - Get or update user profile (protected)",
      "/api/auth/upload": "POST - Upload profile photo (protected)",
      "/api/admin/dashboard": "GET - Admin dashboard (admin only)",
      "/api/admin/users": "GET - Get all users (admin only)"
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    gemini_configured: !!process.env.GEMINI_API_KEY
  });
});

app.get('/api/daily-verse', async (req, res) => {
  try {
    const currentDate = new Date();
    
    // Get daily importance from liturgical calendar
    const dailyImportance = liturgicalCalendar.getDailyImportance(currentDate);
    
    // Get verse from offline data
    const verseData = getVerseByDate(currentDate);
    
    const responseData = {
      date: currentDate.toISOString().split('T')[0],
      verse: verseData.verse,
      reference: verseData.reference,
      reflection: `Reflect on this verse today and let it guide your spiritual journey.`,
      daily_application: `Apply the wisdom of this verse to your daily life.`,
      prayer: `Lord, help me to understand and live according to your word. Amen.`,
      season: dailyImportance.season,
      liturgical_color: dailyImportance.color,
      feast_days: dailyImportance.feastDays,
      importance_message: dailyImportance.importanceMessage,
      hasSignificance: dailyImportance.hasSignificance
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error in daily-verse:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/date-verse', async (req, res) => {
  try {
    const dateStr = req.query.date;
    if (!dateStr) {
      return res.status(400).json({ error: "Date parameter is required" });
    }
    
    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    // Get daily importance for specific date
    const dailyImportance = liturgicalCalendar.getDailyImportance(targetDate);
    
    // Get verse from offline data
    const verseData = getVerseByDate(targetDate);
    
    const responseData = {
      date: targetDate.toISOString().split('T')[0],
      verse: verseData.verse,
      reference: verseData.reference,
      reflection: `Reflect on this verse today and let it guide your spiritual journey.`,
      daily_application: `Apply the wisdom of this verse to your daily life.`,
      prayer: `Lord, help me to understand and live according to your word. Amen.`,
      season: dailyImportance.season,
      liturgical_color: dailyImportance.color,
      feast_days: dailyImportance.feastDays,
      importance_message: dailyImportance.importanceMessage,
      hasSignificance: dailyImportance.hasSignificance
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error in date-verse:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/divine-guidance', async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    
    // Use offline data - find verse by topic
    const match = versesData.verses.find(v => 
      v.tags && v.tags.includes(topic.toLowerCase())
    );

    if (match) {
      res.json({
        verse: match.verse,
        reference: match.reference,
        explanation: match.explanation || 'This verse provides guidance on your topic.',
        offline: true
      });
    } else {
      // Fallback to random verse if no match found
      const randomVerse = versesData.verses[Math.floor(Math.random() * versesData.verses.length)];
      res.json({
        verse: randomVerse.verse,
        reference: randomVerse.reference,
        explanation: randomVerse.explanation || 'This verse provides guidance.',
        offline: true
      });
    }
  } catch (error) {
    console.error('Error in divine-guidance:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prayer', async (req, res) => {
  try {
    await delay(1000); // Rate limiting
    const { intention } = req.body;
    if (!intention) {
      return res.status(400).json({ error: "Intention is required" });
    }
    
    const result = await geminiService.generatePrayer(intention);
    res.json(result);
  } catch (error) {
    console.error('Error in prayer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quiz endpoints (offline)
app.get('/api/quiz', (req, res) => {
  try {
    const { difficulty, category } = req.query;
    
    let filteredQuestions = quizData.questions;
    
    // Filter by difficulty if provided
    if (difficulty) {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficulty);
    }
    
    // Filter by category if provided
    if (category) {
      filteredQuestions = filteredQuestions.filter(q => q.category === category);
    }
    
    // Return 5 random questions
    const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 5);
    
    res.json({ questions: selectedQuestions });
  } catch (error) {
    console.error('Error in quiz:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/quiz/answer', (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer are required" });
    }
    
    const questionData = quizData.questions.find(q => q.question === question);
    if (!questionData) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    const isCorrect = questionData.correct_answer === answer;
    
    res.json({
      correct: isCorrect,
      correct_answer: questionData.correct_answer,
      reference: questionData.reference
    });
  } catch (error) {
    console.error('Error in quiz/answer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bible endpoints (offline)
app.get('/api/bible/structure', (req, res) => {
  try {
    const mapTestamentStructure = testament =>
      Object.entries(testament.books || {}).reduce((bookAccumulator, [bookName, bookData]) => {
        bookAccumulator[bookName] = Object.entries(bookData.chapters || {}).reduce(
          (chapterAccumulator, [chapterNumber, verses]) => {
            chapterAccumulator[chapterNumber] = Array.isArray(verses) ? verses.length : 0;
            return chapterAccumulator;
          },
          {}
        );
        return bookAccumulator;
      }, {});

    res.json({
      old_testament: mapTestamentStructure(bibleData.testaments['Old Testament']),
      new_testament: mapTestamentStructure(bibleData.testaments['New Testament'])
    });
  } catch (error) {
    console.error('Error in bible/structure:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bible', (req, res) => {
  try {
    const { book, chapter, verse } = req.query;
    if (!book || !chapter) {
      return res.status(400).json({ error: "Book and chapter are required" });
    }
    
    // Find the book in either testament
    let bookData = bibleData.testaments['Old Testament'].books[book] || 
                    bibleData.testaments['New Testament'].books[book];
    
    if (!bookData) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const chapterData = bookData.chapters[chapter];
    if (!chapterData) {
      return res.status(404).json({ error: "Chapter not found" });
    }
    
    // If verse is specified, return only that verse
    if (verse) {
      const verseData = chapterData.find(v => v.verse === parseInt(verse));
      if (!verseData) {
        return res.status(404).json({ error: "Verse not found" });
      }
      return res.json({
        reference: `${canonicalBookName} ${chapter}:${verse}`,
        verses: [verseData]
      });
    }
    
    // Return all verses in the chapter
    res.json({
      reference: `${canonicalBookName} ${chapter}`,
      verses: chapterData
    });
  } catch (error) {
    console.error('Error in bible:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bible/search', (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ error: "Keyword is required" });
    }
    
    const results = [];
    const lowerKeyword = keyword.toLowerCase();
    const { old, new: newTestament } = getBibleTestaments();
    
    // Search in both testaments
    for (const testament of [old, newTestament]) {
      for (const [bookName, bookData] of Object.entries(testament.books || {})) {
        for (const [chapterNum, verses] of Object.entries(bookData.chapters || {})) {
          for (const verseData of verses) {
            if (verseData.text.toLowerCase().includes(lowerKeyword)) {
              results.push({
                book: bookName,
                chapter: chapterNum,
                verse: verseData.verse,
                text: verseData.text,
                reference: `${bookName} ${chapterNum}:${verseData.verse}`
              });
            }
          }
        }
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error in bible/search:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verse/explain', async (req, res) => {
  try {
    await delay(1000); // Rate limiting
    const { verse, reference } = req.body;
    if (!verse || !reference) {
      return res.status(400).json({ error: "Verse and reference are required" });
    }
    
    const result = await geminiService.explainVerse(verse, reference);
    res.json(result);
  } catch (error) {
    console.error('Error in verse/explain:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verse/pray', async (req, res) => {
  try {
    await delay(1000); // Rate limiting
    const { verse } = req.body;
    if (!verse) {
      return res.status(400).json({ error: "Verse is required" });
    }
    
    const result = await geminiService.generateVersePrayer(verse);
    res.json(result);
  } catch (error) {
    console.error('Error in verse/pray:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/verse/question', async (req, res) => {
  try {
    await delay(1000); // Rate limiting
    const { question, verse } = req.body;
    if (!question || !verse) {
      return res.status(400).json({ error: "Question and verse are required" });
    }
    
    const result = await geminiService.askVerseQuestion(question, verse);
    res.json(result);
  } catch (error) {
    console.error('Error in verse/question:', error);
    res.status(500).json({ error: error.message });
  }
});

// Saved Verses endpoints (MySQL)
app.post('/api/saved-verses', auth, async (req, res) => {
  try {
    const { book, chapter, verse_number, verse_text, note } = req.body;
    
    // Handle guest users (cannot save verses)
    if (req.user.role === 'guest') {
      return res.status(403).json({ error: "Guest users cannot save verses. Please login to save verses." });
    }
    
    if (!book || !chapter || !verse_number || !verse_text) {
      return res.status(400).json({ error: "book, chapter, verse_number, and verse_text are required" });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    const [result] = await connection.execute(
      'INSERT INTO saved_verses (user_id, book, chapter, verse_number, verse_text, note) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, book, chapter, verse_number, verse_text, note || null]
    );
    
    await connection.end();
    
    res.json({ 
      id: result.insertId, 
      message: 'Verse saved successfully' 
    });
  } catch (error) {
    console.error('Error in saved-verses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/saved-verses', auth, async (req, res) => {
  try {
    // Handle guest users
    if (req.user.role === 'guest') {
      return res.json({ saved_verses: [] });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    const [rows] = await connection.execute(
      'SELECT * FROM saved_verses WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    
    await connection.end();
    
    res.json({ saved_verses: rows });
  } catch (error) {
    console.error('Error in saved-verses:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/saved-verses/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle guest users
    if (req.user.role === 'guest') {
      return res.status(403).json({ error: "Guest users cannot delete verses." });
    }
    
    const connection = await mysql.createConnection(dbConfig);
    
    // Verify the verse belongs to the user
    const [verses] = await connection.execute(
      'SELECT user_id FROM saved_verses WHERE id = ?',
      [id]
    );
    
    if (verses.length === 0) {
      await connection.end();
      return res.status(404).json({ error: "Saved verse not found" });
    }
    
    if (verses[0].user_id !== req.user.id) {
      await connection.end();
      return res.status(403).json({ error: "You can only delete your own saved verses" });
    }
    
    const [result] = await connection.execute(
      'DELETE FROM saved_verses WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    res.json({ message: 'Verse deleted successfully' });
  } catch (error) {
    console.error('Error in saved-verses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Error handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: "The requested URL was not found on the server.",
    endpoints: {
      "/": "API root status",
      "/api/health": "Health check",
      "/api/daily-verse": "Get today's daily Bible verse (offline)",
      "/api/date-verse?date=YYYY-MM-DD": "Get verse data for a specific date (offline)",
      "/api/divine-guidance": "POST - Get verse by topic (AI)",
      "/api/prayer": "POST - Generate prayer (AI)",
      "/api/quiz?difficulty=easy&category=Old": "Get quiz questions (offline)",
      "/api/quiz/answer": "POST - Validate quiz answer (offline)",
      "/api/bible/books": "Get all Bible books (offline)",
      "/api/bible?book=John&chapter=3": "Get Bible verses (offline)",
      "/api/bible/search?keyword=love": "Search Bible verses (offline)",
      "/api/saved-verses": "POST/GET - Manage saved verses (MySQL)",
      "/api/saved-verses/:id": "DELETE - Delete saved verse (MySQL)"
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Bible App API server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
