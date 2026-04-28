// Memory Hive - Auto Save
// Watches conversation, extracts important info, saves to vault

import { Vault } from './vault.js';

class AutoSave {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.threshold = options.threshold || 0.7;
    this.conversationBuffer = [];
    this.importanceKeywords = {
      high: ['remember', 'important', 'never forget', 'save', 'goal', 'money', 'financial', 
             'phone', 'address', 'name', 'password', 'key', 'api', 'token', 'birthday', 
             'anniversary', 'appointment', 'deadline', ' promise', 'swore'],
      medium: ['prefer', 'like', 'hate', 'usually', 'always', 'never', 'work', 'project',
               'family', 'friend', 'pet', 'hobby', 'interest'],
      low: ['maybe', 'perhaps', 'consider', 'might', 'could']
    };
  }

  // Process incoming message - call this for each user message
  process(message, metadata = {}) {
    const importance = this.assessImportance(message);
    const tags = this.extractTags(message);
    const summary = this.summarize(message);

    if (importance >= this.threshold || tags.length > 0) {
      this.vault.save(summary, {
        importance,
        tags,
        sessionId: metadata.sessionId,
        source: metadata.source || 'user_message'
      });
    }

    return { importance, tags, saved: importance >= this.threshold };
  }

  // Assess how important a message is (0-1)
  assessImportance(message) {
    const text = message.toLowerCase();
    let score = 0.4; // base score - raised for more sensitivity

    // Check high-importance keywords
    this.importanceKeywords.high.forEach(kw => {
      if (text.includes(kw)) score += 0.25;
    });

    // Check medium-importance keywords
    this.importanceKeywords.medium.forEach(kw => {
      if (text.includes(kw)) score += 0.1;
    });

    // Check for patterns
    if (text.includes('?')) score += 0.05; // questions often indicate important needs
    if (text.length > 100) score += 0.1; // longer messages often more detailed
    if (text.match(/\d+/)) score += 0.15; // numbers often important (prices, dates, etc)
    if (text.match(/r\d+|rand|zac|cash|invest|savings/)) score += 0.2; // money patterns

    return Math.min(score, 1.0);
  }

  // Extract relevant tags from message
  extractTags(message) {
    const text = message.toLowerCase();
    const tags = [];

    // Financial tags
    if (text.match(/r\d+|rand|rand|price|cost|payment|money|cash|invest/)) {
      tags.push('financial', 'money');
    }

    // Personal tags
    if (text.match(/i am|i'm|my name|i have|i want|i need/)) {
      tags.push('personal');
    }

    // Preference tags
    if (text.match(/like|prefer|hate|love|want|don'?t like/)) {
      tags.push('preference');
    }

    // Project/work tags
    if (text.match(/project|work|task|hustle|job|side/)) {
      tags.push('work');
    }

    // Technical tags
    if (text.match(/api|key|token|code|discord|telegram|setup|config/)) {
      tags.push('technical');
    }

    // Goal tags
    if (text.match(/goal|target|aim|achieve|reach|grow|increase/)) {
      tags.push('goals');
    }

    // Location tags
    if (text.match(/south africa|sa|johannesburg|cape town|durban|joburg|live in|located in|based in/i)) {
      tags.push('location');
    }

    // Family tags
    if (text.match(/wife|husband|husband|son|daughter|child|kids|family|married|spouse|parent/i)) {
      tags.push('family', 'personal');
    }

    return [...new Set(tags)]; // dedupe
  }

  // Generate a concise summary of the message
  summarize(message) {
    // Simple extraction - just clean up the message
    // In a fuller version, could use actual summarization
    const cleaned = message
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length <= 200) return cleaned;
    return cleaned.slice(0, 197) + '...';
  }

  // Process AI responses too (for context)
  processAiResponse(message, metadata = {}) {
    const tags = this.extractTags(message);
    if (tags.length > 0 && message.length > 50) {
      this.vault.save(this.summarize(message), {
        importance: 0.4,
        tags: ['ai_response', ...tags],
        sessionId: metadata.sessionId,
        source: 'ai_message'
      });
    }
  }

  // Get save statistics
  stats() {
    return {
      threshold: this.threshold,
      processed: this.conversationBuffer.length
    };
  }
}

export default AutoSave;
export { AutoSave };