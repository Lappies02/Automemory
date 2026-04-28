// Memory Hive - On-Demand Recall
// Searches memory vault for each incoming message, returns only relevant context

import { Vault } from './vault.js';

class OnDemandRecall {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.enabled = options.enabled !== false;
    this.maxRecall = options.maxRecall || 3; // Max memories to inject per message
    this.relevanceThreshold = options.relevanceThreshold || 0.3;
  }

  // Call this for EACH incoming message - returns relevant memories on the fly
  recallForMessage(message, options = {}) {
    if (!this.enabled) return null;

    const allMemories = this.vault.getAll();
    if (allMemories.length === 0) return null;

    // Score each memory by relevance to this specific message
    const scored = allMemories.map(m => ({
      ...m,
      relevanceScore: this.scoreRelevance(m, message)
    }));

    // Filter and sort
    const relevant = scored
      .filter(m => m.relevanceScore >= this.relevanceThreshold)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, options.maxRecall || this.maxRecall);

    if (relevant.length === 0) return null;

    return {
      memories: relevant,
      contextText: this.buildContextText(relevant),
      count: relevant.length
    };
  }

  // Score how relevant a memory is to a specific message
  scoreRelevance(memory, message) {
    const memText = memory.content.toLowerCase();
    const msgText = message.toLowerCase();
    let score = 0;

    // 1. Tag overlap - does the memory share tags with detected message tags?
    const msgTags = this.detectMessageTags(message);
    if (msgTags.length > 0 && memory.tags.length > 0) {
      const overlap = memory.tags.filter(t => msgTags.includes(t));
      score += (overlap.length / msgTags.length) * 0.4;
    }

    // 2. Keyword matching - shared words?
    const msgWords = this.extractKeywords(msgText);
    const memWords = this.extractKeywords(memText);
    const sharedWords = msgWords.filter(w => memWords.includes(w));
    if (sharedWords.length > 0) {
      score += Math.min(sharedWords.length * 0.15, 0.4);
    }

    // 3. Exact phrase match (substring)
    const keyPhrases = this.extractKeyPhrases(msgText);
    keyPhrases.forEach(phrase => {
      if (memText.includes(phrase)) score += 0.2;
    });

    // 4. Recent boost - favor newer memories slightly
    const hoursOld = (Date.now() - new Date(memory.timestamp).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 0.1; // Boost for same-day memories

    return Math.min(score, 1.0);
  }

  // Detect tags in the incoming message
  detectMessageTags(text) {
    const tags = [];
    const patterns = {
      financial: /money|rand|invest|price|cost|cash|financial|rich|poor|budget/,
      personal: /my|i am|i'm|name|i have|i want|i need|family|children|son|daughter/,
      goals: /goal|target|aim|achieve|reach|grow|increase|want to/,
      work: /project|work|task|hustle|job|career|business/,
      technical: /api|key|code|discord|setup|config|computer|software/,
      location: /south africa|joburg|johannesburg|cape town|durban|location/,
      children: /son|daughter|kid|child|boy|girl|baby|lourens|grobler/,
      preferences: /like|prefer|hate|love|want|don't like|usually|always|never/
    };

    Object.entries(patterns).forEach(([tag, regex]) => {
      if (regex.test(text)) tags.push(tag);
    });

    return tags;
  }

  // Extract meaningful keywords from text
  extractKeywords(text) {
    const words = text.split(/\s+/);
    return words
      .filter(w => w.length > 4)
      .map(w => w.replace(/[^a-z0-9]/g, ''))
      .slice(0, 15);
  }

  // Extract key phrases (2-4 word combos)
  extractKeyPhrases(text) {
    const phrases = [];
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words[i] + ' ' + words[i + 1]);
    }
    return phrases.slice(0, 10);
  }

  // Build readable context string
  buildContextText(memories) {
    if (!memories || memories.length === 0) return '';
    
    const lines = ['💾 Relevant memories:', ''];
    memories.forEach(m => {
      lines.push(`• ${m.content.slice(0, 120)}${m.content.length > 120 ? '...' : ''}`);
    });
    return lines.join('\n');
  }
}

export default OnDemandRecall;
export { OnDemandRecall };