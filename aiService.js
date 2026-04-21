const OpenAI = require('openai');

class AIService {
  constructor(apiKey = null) {
    this.client = apiKey ? new OpenAI({ apiKey: apiKey }) : null;
  }

  async getDailyVerseWithAnalysis(currentDate, dailyImportance) {
    const season = dailyImportance.season?.replace('_', ' ')?.replace(/\b\w/g, l => l.toUpperCase()) || 'Ordinary Time';
    const feastNames = dailyImportance.feastDays?.map(f => f.name) || [];
    const feastsStr = feastNames.length > 0 ? feastNames.join(', ') : 'none';
    const importanceMsg = dailyImportance.importanceMessage || '';

    if (this.client) {
      try {
        const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        const prompt = `
          Today is ${dateStr}. The liturgical season is ${season}.
          Feast days today: ${feastsStr}.
          Significance of the day: ${importanceMsg}
          
          Please act as a knowledgeable biblical scholar and spiritual guide providing meaningful insights.
          Select a Bible verse that is deeply appropriate for this specific day, considering the season, any feasts, and the overall significance.
          
          Provide:
          1. The selected Bible verse (verse text itself)
          2. The reference (e.g., John 3:16)
          3. A meaningful reflection on this verse for today's context
          4. How this verse relates to daily life and spiritual growth today
          5. A short prayer or meditation based on this verse
          
          Response MUST be purely in JSON format:
          {
            "verse": "the actual verse text",
            "reference": "Book Chapter:Verse",
            "reflection": "meaningful reflection text",
            "daily_application": "how it applies to daily life",
            "prayer": "short prayer or meditation"
          }
        `;

        const response = await this.client.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a biblical scholar AI. You reply exclusively with compliant JSON." },
            { role: "user", content: prompt }
          ],
          max_tokens: 600,
          temperature: 0.7
        });

        const aiResponse = JSON.parse(response.choices[0].message.content);
        return {
          verse: aiResponse.verse || "I can do all this through him who gives me strength.",
          reference: aiResponse.reference || "Philippians 4:13",
          reflection: aiResponse.reflection || "A divine reflection for today.",
          daily_application: aiResponse.daily_application || "Apply this to your daily actions.",
          prayer: aiResponse.prayer || "Amen."
        };
      } catch (error) {
        console.error('AI service error:', error.message);
      }
    }

    return this.getFallbackResponse();
  }

  getFallbackResponse() {
    return {
      verse: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      reference: "John 3:16",
      reflection: "This verse reminds us of God's immense love and the ultimate sacrifice of Jesus Christ for humanity's salvation.",
      daily_application: "Today, let us remember God's love in our interactions with others and show gratitude for the gift of eternal life.",
      prayer: "Dear Lord, thank you for your infinite love. Help me to share this love with others today and always. Amen."
    };
  }
}

module.exports = AIService;
