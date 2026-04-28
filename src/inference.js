// Memory Hive - Inference Engine
// Makes smart connections between pieces of information

class Inference {
  constructor(vault, options = {}) {
    this.vault = vault;
    this.enabled = options.enabled !== false;
    
    // Semantic links - when user mentions X, also check for Y
    this.associations = {
      'financial': ['money', 'goals', 'work', 'hustle', 'income'],
      'goals': ['financial', 'work', 'hustle'],
      'personal': ['preference', 'family', 'location'],
      'preference': ['personal'],
      'work': ['project', 'financial', 'hustle'],
      'hustle': ['work', 'financial', 'goals'],
      'location:south-africa': ['financial', 'work'],
      'technical': ['api', 'key', 'setup'],
      'api': ['technical', 'key'],
      'key': ['technical', 'api', 'token'],
      'discord': ['technical', 'setup']
    };
  }

  // Main inference function - find related memories
  infer(tags = [], keywords = []) {
    if (!this.enabled) return [];

    const related = new Set();

    // Add directly associated tags
    tags.forEach(tag => {
      const assoc = this.associations[tag] || [];
      assoc.forEach(a => related.add(a));
    });

    // Search for memories with associated tags
    if (related.size > 0) {
      const allMemories = this.vault.getAll();
      const relevant = allMemories.filter(m => 
        m.tags.some(t => related.has(t))
      );
      return relevant;
    }

    return [];
  }

  // Check if new info connects to existing memories
  checkConnections(newTags, newContent) {
    const connections = [];
    const allMemories = this.vault.getAll();

    newTags.forEach(newTag => {
      const assoc = this.associations[newTag] || [];
      
      allMemories.forEach(mem => {
        // Check tag overlap
        const hasRelated = mem.tags.some(t => assoc.includes(t));
        // Check keyword overlap
        const contentLower = newContent.toLowerCase();
        const memLower = mem.content.toLowerCase();
        const hasKeywordOverlap = this.checkKeywordOverlap(contentLower, memLower);

        if (hasRelated || hasKeywordOverlap) {
          connections.push({
            type: hasRelated ? 'tag_association' : 'keyword_similarity',
            connectedMemory: mem,
            via: newTag
          });
        }
      });
    });

    return connections;
  }

  checkKeywordOverlap(text1, text2) {
    const words1 = new Set(text1.split(/\s+/).filter(w => w.length > 4));
    const words2 = new Set(text2.split(/\s+/).filter(w => w.length > 4));
    
    let overlap = 0;
    words1.forEach(w => {
      if (words2.has(w)) overlap++;
    });

    return overlap >= 2;
  }

  // Generate a "memory of memories" - summary of what we know
  generateMemoryProfile() {
    const all = this.vault.getAll();
    const stats = this.vault.stats();

    const profile = {
      totalMemories: all.length,
      topTags: Object.entries(stats.byTag)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count })),
      recentTopics: [...new Set(all.slice(0, 10).flatMap(m => m.tags))].slice(0, 5)
    };

    return profile;
  }

  // Suggest what to remember based on patterns
  suggestTags(content) {
    const suggestions = [];
    const text = content.toLowerCase();

    // Financial suggestions
    if (text.match(/r\d+|rand|invest|money|cash/)) {
      suggestions.push({ tag: 'financial', confidence: 0.9 });
    }

    // Goal suggestions  
    if (text.match(/goal|target|achieve|reach/)) {
      suggestions.push({ tag: 'goals', confidence: 0.8 });
    }

    // Location
    if (text.match(/south africa|sa|johannesburg|cape town|durban| Joburg/)) {
      suggestions.push({ tag: 'location:south-africa', confidence: 0.95 });
    }

    return suggestions;
  }
}

export default Inference;
export { Inference };