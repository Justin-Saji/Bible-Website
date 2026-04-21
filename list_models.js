const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function list() {
  try {
    const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
      .then(res => res.json());
    console.log(models);
  } catch(e) {
    console.log(e);
  }
}

list();
