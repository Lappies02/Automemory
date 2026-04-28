// Memory Hive - Main Entry Point
// Universal memory system for Heyron agents

import { Vault } from './vault.js';
import { AutoSave } from './auto_save.js';
import { AutoRecall } from './auto_recall.js';
import { Inference } from './inference.js';
import { OnDemandRecall } from './ondemand_recall.js';

class MemoryHive {
  constructor(options = {}) {
    this.options = options;
    
    // Initialize components
    this.vault = new Vault(options.vaultPath);
    this.autoSave = new AutoSave(this.vault, options.autoSave);
    this.autoRecall = new AutoRecall(this.vault, options.recall);
    this.inference = new Inference(this.vault, options.inference);
    this.onDemand = new OnDemandRecall(this.vault, options.onDemand);
    
    this.initialized = true;
  }

  // === PUBLIC API ===

  // Call at session start - returns context to inject
  async onSessionStart(context = {}) {
    const recallResult = this.autoRecall.recall(context);
    
    // Also get inferred connections
    const related = this.inference.infer(context.tags || [], context.keywords || []);
    
    return {
      contextText: recallResult.context,
      memories: recallResult.memories,
      relatedMemories: related.slice(0, 3),
      stats: recallResult.stats
    };
  }

  // Call for each user message - with ON-DEMAND recall
  onUserMessage(message, metadata = {}) {
    // 1. First, get relevant context for THIS specific message
    const relevantContext = this.onDemand.recallForMessage(message);
    
    // 2. Auto-save if important
    const result = this.autoSave.process(message, {
      sessionId: metadata.sessionId,
      source: 'user'
    });

    // 3. Check for connections
    if (result.saved) {
      const connections = this.inference.checkConnections(result.tags, message);
      return { 
        ...result, 
        connections,
        relevantContext: relevantContext // ← NEW: inject relevant memories
      };
    }

    return { 
      ...result,
      relevantContext // ← NEW: even if not saved, check context
    };
  }

  // Call for each AI response
  onAiResponse(message, metadata = {}) {
    return this.autoSave.processAiResponse(message, {
      sessionId: metadata.sessionId,
      source: 'ai'
    });
  }

  // Call at session end
  async onSessionEnd(metadata = {}) {
    const profile = this.inference.generateMemoryProfile();
    
    // Save session summary if there were significant memories
    const recent = this.vault.getRecent(3);
    if (recent.length > 0) {
      this.vault.save(`Session generated ${recent.length} memories`, {
        importance: 0.2,
        tags: ['session', 'meta'],
        sessionId: metadata.sessionId,
        source: 'session_end'
      });
    }

    return {
      memoriesCreated: recent.length,
      profile
    };
  }

  // Manual search
  search(query) {
    return this.vault.search(query);
  }

  // Get stats
  getStats() {
    return {
      vault: this.vault.stats(),
      autoSave: this.autoSave.stats(),
      inference: this.inference.generateMemoryProfile()
    };
  }

  // Force save a memory
  remember(content, options = {}) {
    return this.vault.save(content, {
      importance: options.importance || 0.8,
      tags: options.tags || [],
      source: 'manual'
    });
  }

  // Forget (delete) a memory
  forget(memoryId) {
    // This would need a delete method in Vault
    // For now, could mark as forgotten
    return { success: false, message: 'Not implemented yet' };
  }
}

// Export for use as Heyron skill
export default MemoryHive;
export { MemoryHive, Vault, AutoSave, AutoRecall, Inference };