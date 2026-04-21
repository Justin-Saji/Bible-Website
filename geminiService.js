const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor(apiKey = null) {
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  getSaintRecommendation(intention = '') {
    const normalizedIntention = intention.toLowerCase();

    const saintRules = [
      { saint: 'St. Jude', type: 'intercession', keywords: ['hopeless', 'desperate', 'impossible', 'urgent crisis', 'lost cause', 'despair'] },
      { saint: 'St. Peregrine', type: 'healing', keywords: ['cancer', 'tumor', 'terminal illness', 'chemo'] },
      { saint: 'St. Raphael the Archangel', type: 'healing', keywords: ['healing', 'sickness', 'illness', 'recovery', 'hospital', 'doctor', 'health', 'medical'] },
      { saint: 'St. Dymphna', type: 'healing', keywords: ['anxiety', 'depression', 'mental health', 'stress', 'panic', 'emotional healing', 'worry'] },
      { saint: 'St. Joseph', type: 'provision', keywords: ['job', 'work', 'employment', 'provider', 'fatherhood', 'home', 'house', 'family', 'father', 'career'] },
      { saint: 'St. Anthony of Padua', type: 'petition', keywords: ['lost', 'missing', 'find', 'finding', 'misplaced'] },
      { saint: 'St. Thomas Aquinas', type: 'wisdom', keywords: ['study', 'exam', 'school', 'learning', 'wisdom', 'understanding', 'knowledge', 'education'] },
      { saint: 'St. Michael the Archangel', type: 'protection', keywords: ['protection', 'danger', 'fear', 'spiritual warfare', 'evil', 'safety', 'attack'] },
      { saint: 'St. Monica', type: 'intercession', keywords: ['children', 'child', 'son', 'daughter', 'parenting', 'wayward child', 'conversion of family'] },
      { saint: 'St. Rita of Cascia', type: 'intercession', keywords: ['marriage', 'relationship', 'spouse', 'difficult marriage', 'reconciliation', 'husband', 'wife'] },
      { saint: 'St. Francis of Assisi', type: 'peace', keywords: ['peace', 'peacemaking', 'conflict', 'harmony', 'unity'] },
      { saint: 'St. Thérèse of Lisieux', type: 'trust', keywords: ['trust', 'simplicity', 'daily struggles', 'little way'] },
      { saint: 'Our Lady, Undoer of Knots', type: 'intercession', keywords: ['confusion', 'complicated problem', 'knots', 'blocked situation', 'stuck'] },
      { saint: 'Our Lady of Perpetual Help', type: 'intercession', keywords: ['motherly care', 'guidance', 'comfort', 'mother mary', 'mother of god'] }
    ];

    let bestMatch = null;

    for (const rule of saintRules) {
      for (const keyword of rule.keywords) {
        if (normalizedIntention.includes(keyword)) {
          const score = keyword.length;
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = {
              saint_invoked: rule.saint,
              type: rule.type,
              score
            };
          }
        }
      }
    }

    if (bestMatch) {
      return {
        saint_invoked: bestMatch.saint_invoked,
        type: bestMatch.type
      };
    }

    return {
      saint_invoked: 'Our Lady of Perpetual Help',
      type: 'petition'
    };
  }

  parseJsonResponse(text) {
    const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();

    try {
      return JSON.parse(cleanText);
    } catch (error) {
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw error;
    }
  }

  buildOfflineTheologicalAnswer(question) {
    const qaData = [
      {
        "question_keywords": ["moses", "who is moses"],
        "answer": "Moses is one of the greatest prophets in the Bible. He was chosen by God to lead the Israelites out of slavery in Egypt and received the Ten Commandments on Mount Sinai.",
        "references": ["Exodus 3:10", "Exodus 20:1-17"],
        "context": "Moses serves as a mediator between God and His people and is central to the Old Testament law."
      },
      {
        "question_keywords": ["jesus", "who is jesus"],
        "answer": "Jesus Christ is the Son of God and the Savior of humanity. He preached love, forgiveness, and salvation, and Christians believe He died and rose again for the redemption of the world.",
        "references": ["John 3:16", "Philippians 2:6-11"],
        "context": "Jesus is the foundation of Christian faith and the fulfillment of Old Testament prophecy."
      },
      {
        "question_keywords": ["holy spirit", "who is the holy spirit"],
        "answer": "The Holy Spirit is the third person of the Holy Trinity. He guides, comforts, and strengthens believers in their spiritual lives.",
        "references": ["John 14:26", "Acts 1:8"],
        "context": "The Holy Spirit continues God's presence and work in the Church today."
      },
      {
        "question_keywords": ["prayer", "why pray"],
        "answer": "Prayer is communication with God. It allows believers to express gratitude, seek guidance, and grow in relationship with Him.",
        "references": ["1 Thessalonians 5:17", "Matthew 6:6"],
        "context": "Prayer is a central practice in Christian life, connecting believers to God's will."
      },
      {
        "question_keywords": ["faith", "what is faith"],
        "answer": "Faith is trusting in God and believing in His promises even without seeing. It is the foundation of a Christian life.",
        "references": ["Hebrews 11:1", "Romans 10:17"],
        "context": "Faith enables believers to live according to God's will and receive His grace."
      },
      {
        "question_keywords": ["sin", "what is sin"],
        "answer": "Sin is any action, thought, or behavior that goes against God's will. It separates humans from God.",
        "references": ["Romans 3:23", "1 John 1:9"],
        "context": "Through repentance and God's grace, sin can be forgiven."
      },
      {
        "question_keywords": ["forgiveness", "why forgive"],
        "answer": "Forgiveness is releasing anger and resentment toward others. God calls believers to forgive as He forgives us.",
        "references": ["Ephesians 4:32", "Matthew 6:14"],
        "context": "Forgiveness brings healing and restores relationships."
      },
      {
        "question_keywords": ["love", "what is love"],
        "answer": "Love is the greatest commandment. It means caring for others selflessly as God loves us.",
        "references": ["1 Corinthians 13:4-7", "John 13:34"],
        "context": "Christian love reflects God's nature and is the basis of all moral teaching."
      },
      {
        "question_keywords": ["salvation", "what is salvation"],
        "answer": "Salvation is the deliverance from sin and its consequences through Jesus Christ.",
        "references": ["Ephesians 2:8-9", "Romans 10:9"],
        "context": "It is a gift from God received through faith."
      },
      {
        "question_keywords": ["bible", "what is the bible"],
        "answer": "The Bible is the sacred scripture of Christianity, containing God's revelation to humanity.",
        "references": ["2 Timothy 3:16", "Psalm 119:105"],
        "context": "It is divided into the Old and New Testaments."
      },
      {
        "question_keywords": ["commandments", "ten commandments"],
        "answer": "The Ten Commandments are laws given by God to Moses to guide moral behavior.",
        "references": ["Exodus 20:1-17"],
        "context": "They form the foundation of ethical living in the Bible."
      },
      {
        "question_keywords": ["heaven", "what is heaven"],
        "answer": "Heaven is the eternal dwelling place of God where believers experience everlasting joy and peace.",
        "references": ["John 14:2-3", "Revelation 21:4"],
        "context": "It is the ultimate hope for Christians."
      },
      {
        "question_keywords": ["hell", "what is hell"],
        "answer": "Hell is separation from God, often described as a place of suffering for those who reject Him.",
        "references": ["Matthew 25:41", "2 Thessalonians 1:9"],
        "context": "It represents the consequence of rejecting God's grace."
      },
      {
        "question_keywords": ["grace", "what is grace"],
        "answer": "Grace is God's unearned favor given to humanity for salvation and spiritual growth.",
        "references": ["Ephesians 2:8", "2 Corinthians 12:9"],
        "context": "It is central to Christian theology."
      },
      {
        "question_keywords": ["repentance", "what is repentance"],
        "answer": "Repentance means turning away from sin and turning toward God with a sincere heart.",
        "references": ["Acts 3:19", "Luke 15:7"],
        "context": "It is necessary for forgiveness and spiritual renewal."
      }
    ];

    const lowerQ = question.toLowerCase();
    const found = qaData.find(item =>
      item.question_keywords.some(keyword => lowerQ.includes(keyword))
    );

    if (found) {
      return {
        answer: found.answer,
        references: found.references,
        context: found.context
      };
    }

    return null;
  }

  async generateDailyVerse(currentDate, dailyImportance) {
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

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean and parse JSON
        const aiResponse = this.parseJsonResponse(text);
        
        return {
          verse: aiResponse.verse || "I can do all this through him who gives me strength.",
          reference: aiResponse.reference || "Philippians 4:13",
          reflection: aiResponse.reflection || "A divine reflection for today.",
          daily_application: aiResponse.daily_application || "Apply this to your daily actions.",
          prayer: aiResponse.prayer || "Amen."
        };
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return this.getFallbackResponse();
  }

  async getVerseByTopic(topic) {
    if (this.client) {
      try {
        const prompt = `
          As a biblical scholar, provide a Bible verse related to the topic: "${topic}".
          
          Return ONLY JSON:
          {
            "verse": "the verse text",
            "reference": "Book Chapter:Verse",
            "explanation": "a brief explanation of how this verse relates to the topic"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      verse: 'The Lord is near to all who call on him.',
      reference: 'Psalm 145:18',
      explanation: 'We encountered an error while seeking guidance.'
    };
  }

  async askTheologicalQuestion(question) {
    // Mode 1: Check offline dataset first
    const offlineAnswer = this.buildOfflineTheologicalAnswer(question);
    if (offlineAnswer) {
      return offlineAnswer;
    }

    // Mode 2: Call Gemini API if not found in offline dataset
    if (this.client) {
      try {
        const prompt = `
          As a knowledgeable biblical scholar and theologian, answer this theological question: "${question}"
          
          Provide a thoughtful, well-researched answer that:
          1. Addresses the question directly
          2. Provides biblical references
          3. Explains the theological context
          4. Offers practical application
          
          Return ONLY JSON:
          {
            "answer": "detailed theological answer",
            "references": ["reference1", "reference2"],
            "context": "theological context explanation"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    // Fallback if API fails
    return {
      answer: "We couldn't find this answer in our offline database, and experiencing issues reaching our AI servers. Please try again later.",
      references: [],
      context: "Connection error."
    };
  }

  async generatePrayer(intention) {
    const saintRecommendation = this.getSaintRecommendation(intention);

    if (this.client) {
      try {
        const prompt = `
          Generate a Catholic prayer for the following intention: "${intention}"
          
          The prayer should:
          1. Be reverent and spiritually uplifting
          2. Invoke a saint specifically appropriate to this intention, avoiding a generic answer when a clear patron saint fits
          3. Be suitable for personal devotion
          4. End with "Through Christ our Lord. Amen." or similar traditional closing
          
          Preferred saint for this intention: ${saintRecommendation.saint_invoked}
          
          Return ONLY JSON:
          {
            "prayer": "the complete prayer text",
            "saint_invoked": "saint name if applicable, or 'General'",
            "type": "type of prayer (e.g., petition, thanksgiving, intercession)"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return {
          ...aiResponse,
          saint_invoked: aiResponse.saint_invoked && aiResponse.saint_invoked !== 'General'
            ? aiResponse.saint_invoked
            : saintRecommendation.saint_invoked,
          type: aiResponse.type || saintRecommendation.type
        };
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      prayer: `Heavenly Father, we come before you with our intention: ${intention}. We ask for your guidance, strength, and blessing. Through Christ our Lord, Amen.`,
      saint_invoked: saintRecommendation.saint_invoked,
      type: saintRecommendation.type
    };
  }

  async generateQuiz(topic, difficulty = 'medium') {
    if (this.client) {
      try {
        const prompt = `
          Generate a ${difficulty} difficulty Bible quiz on the topic: "${topic}"
          
          Create 5 multiple choice questions. Each question should have:
          - A clear question
          - 4 options (A, B, C, D)
          - The correct answer
          - A brief explanation
          
          Return ONLY JSON:
          {
            "questions": [
              {
                "question": "question text",
                "options": ["A", "B", "C", "D"],
                "answer": "correct option (A, B, C, or D)",
                "explanation": "explanation"
              }
            ]
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      questions: []
    };
  }

  async explainVerse(verse, reference) {
    if (this.client) {
      try {
        const prompt = `
          Explain the following Bible verse in depth:
          Verse: "${verse}"
          Reference: ${reference}
          
          Provide:
          1. Historical and cultural context
          2. Theological meaning
          3. Practical application for today
          
          Return ONLY JSON:
          {
            "context": "historical and cultural context",
            "meaning": "theological meaning",
            "application": "practical application"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      context: 'Unable to load explanation.',
      meaning: 'Please try again later.',
      application: 'Reflect on this verse in prayer.'
    };
  }

  async generateVersePrayer(verse) {
    if (this.client) {
      try {
        const prompt = `
          Generate a prayer based on this Bible verse: "${verse}"
          
          The prayer should:
          1. Reflect on the verse's meaning
          2. Be suitable for personal meditation
          3. Include elements of thanksgiving, petition, or intercession as appropriate
          
          Return ONLY JSON:
          {
            "prayer": "the prayer text"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      prayer: 'Lord, help me to understand and apply this verse to my life. Amen.'
    };
  }

  async askVerseQuestion(question, verse) {
    if (this.client) {
      try {
        const prompt = `
          Answer this question about the Bible verse: "${verse}"
          Question: "${question}"
          
          Provide a thoughtful answer that:
          1. Directly addresses the question
          2. Provides biblical context
          3. Offers spiritual insight
          
          Return ONLY JSON:
          {
            "answer": "detailed answer to the question"
          }
        `;

        const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const aiResponse = this.parseJsonResponse(text);
        
        return aiResponse;
      } catch (error) {
        console.error('Gemini service error:', error.message);
        console.error('Full error:', error);
      }
    }

    return {
      answer: 'We encountered an error. Please try again.'
    };
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

module.exports = GeminiService;
