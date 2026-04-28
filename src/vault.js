// Memory Hive - Vault (Storage Layer)
// Simple file-based memory storage with indexing

import fs from 'fs';
import path from 'path';

const DEFAULT_VAULT_PATH = './memory-hive-vault';

class Vault {
  constructor(vaultPath = DEFAULT_VAULT_PATH) {
    this.vaultPath = vaultPath;
    this.ensureVault();
  }

  ensureVault() {
    const dirs = ['memories', 'index', 'sessions'];
    dirs.forEach(dir => {
      const fullPath = path.join(this.vaultPath, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Save a memory with timestamp and tags
  save(memory, metadata = {}) {
    const id = this.generateId();
    const entry = {
      id,
      content: memory,
      timestamp: new Date().toISOString(),
      tags: metadata.tags || [],
      importance: metadata.importance || 0.5,
      sessionId: metadata.sessionId || null,
      source: metadata.source || 'unknown'
    };

    const filePath = path.join(this.vaultPath, 'memories', `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    
    this.updateIndex(entry);
    return id;
  }

  // Get all memories, optionally filtered
  getAll(filters = {}) {
    const memoriesDir = path.join(this.vaultPath, 'memories');
    const files = fs.readdirSync(memoriesDir).filter(f => f.endsWith('.json'));
    
    let memories = files.map(f => {
      const content = fs.readFileSync(path.join(memoriesDir, f), 'utf-8');
      return JSON.parse(content);
    });

    // Apply filters
    if (filters.tags?.length) {
      memories = memories.filter(m => 
        filters.tags.some(tag => m.tags.includes(tag))
      );
    }
    if (filters.minImportance) {
      memories = memories.filter(m => m.importance >= filters.minImportance);
    }
    if (filters.since) {
      memories = memories.filter(m => new Date(m.timestamp) > new Date(filters.since));
    }

    return memories.sort((a, b) => b.importance - a.importance);
  }

  // Search memories by content keyword
  search(query) {
    const all = this.getAll();
    const q = query.toLowerCase();
    return all.filter(m => 
      m.content.toLowerCase().includes(q) ||
      m.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Get recent memories (for recall)
  getRecent(limit = 5) {
    const all = this.getAll();
    return all.slice(0, limit);
  }

  // Simple text-based index for fast lookup
  updateIndex(entry) {
    const indexPath = path.join(this.vaultPath, 'index', 'by-tag.json');
    let index = {};
    
    if (fs.existsSync(indexPath)) {
      index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    }

    entry.tags.forEach(tag => {
      if (!index[tag]) index[tag] = [];
      index[tag].push(entry.id);
    });

    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get vault stats
  stats() {
    const all = this.getAll();
    return {
      total: all.length,
      byTag: all.flatMap(m => m.tags).reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {}),
      avgImportance: all.reduce((sum, m) => sum + m.importance, 0) / (all.length || 1)
    };
  }

  // Clean up old memories (keep most important + most recent)
  cleanup(maxMemories = 1000) {
    const all = this.getAll();
    if (all.length <= maxMemories) return { removed: 0 };

    // Sort by importance desc, then by date desc
    all.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    const toKeep = all.slice(0, maxMemories);
    const toRemove = all.slice(maxMemories);

    toRemove.forEach(m => {
      const filePath = path.join(this.vaultPath, 'memories', `${m.id}.json`);
      fs.unlinkSync(filePath);
    });

    return { removed: toRemove.length, kept: toKeep.length };
  }
}

export default Vault;
export { Vault };