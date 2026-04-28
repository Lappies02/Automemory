// Memory Hive - Auto Recall
// Pulls relevant context at session start

import { Vault } from './vault.js';

class AutoRecall {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.limit = options.limit || 5;
    this.relevanceWeights = {
      recent: 0.4,
      important: 0.3,
      related: 0.3
    };
  }

  // Main recall function - call at session start
  recall(context = {}) {
    const memories = this.vault.getAll({ minImportance: 0.3 });
    
    if (memories.length === 0) {
      return { memories: [], context: 'No previous memories found.' };
    }

    // Score and sort memories
    const scored = memories.map(m => ({
      ...m,
      score: this.scoreMemory(m, context)
    }));

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, this.limit);
    const contextText = this.buildContextText(top);

    return {
      memories: top,
      context: contextText,
      stats: {
        totalAvailable: memories.length,
        returned: top.length
      }
    };
  }

  // Score a memory based on relevance to current context
  scoreMemory(memory, context) {
    let score = 0;

    // Recency weight (simulated - in full version would use timestamps)
    score += this.relevanceWeights.recent * memory.importance;

    // Importance weight
    score += this.relevanceWeights.important * memory.importance;

    // Tag relevance - does it share tags with current context?
    if (context.tags?.length && memory.tags?.length) {
      const overlap = memory.tags.filter(t => context.tags.includes(t));
      score += (overlap.length / Math.max(context.tags.length, 1)) * 0.3;
    }

    // Keyword relevance
    if (context.keywords?.length) {
      const text = memory.content.toLowerCase();
      const matches = context.keywords.filter(k => text.includes(k.toLowerCase()));
      score += (matches.length / context.keywords.length) * 0.2;
    }

    return score;
  }

  // Build a readable context string for the agent
  buildContextText(memories) {
    if (memories.length === 0) return '';

    const lines = ['📚 Relevant memories from previous sessions:', ''];
    
    memories.forEach(m => {
      const date = new Date(m.timestamp).toLocaleDateString();
      lines.push(`- [${date}] ${m.content.slice(0, 150)}${m.content.length > 150 ? '...' : ''}`);
      if (m.tags.length) lines.push(`  Tags: ${m.tags.join(', ')}`);
    });

    return lines.join('\n');
  }

  // Search for specific topic
  searchTopic(topic) {
    const results = this.vault.search(topic);
    return results.slice(0, this.limit);
  }

  // Get memories by tags
  getByTags(tags) {
    return this.vault.getAll({ tags });
  }

  // Build session context from recent chat (if available)
  buildFromRecentChat(recentMessages) {
    if (!recentMessages || recentMessages.length === 0) {
      return this.recall();
    }

    // Extract tags/keywords from recent messages
    const allText = recentMessages.map(m => m.content || '').join(' ');
    const keywords = this.extractKeywords(allText);
    const tags = this.extractTags(allText);

    return this.recall({ keywords, tags });
  }

  extractKeywords(text) {
    // Simple keyword extraction
    const words = text.toLowerCase().split(/\s+/);
    const important = words.filter(w => w.length > 5).slice(0, 10);
    return important;
  }

  extractTags(text) {
    const tags = [];
    const patterns = {
      financial: /money|rand|price|cost|invest/,
      personal: /my|i am|i'm|name/,
      project: /project|work|task|hustle/,
      technical: /api|key|code|setup|discord/
    };

    Object.entries(patterns).forEach(([tag, regex]) => {
      if (regex.test(text)) tags.push(tag);
    });

    return tags;
  }
}

export default AutoRecall;
export { AutoRecall };