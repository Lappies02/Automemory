// Memory Hive - Quick Test / Demo
// Run with: node test.js

import { MemoryHive } from './src/index.js';

const hive = new MemoryHive({
  vaultPath: './test-vault'
});

console.log('🧪 Memory Hive Demo\n');

// Test 1: Session start with no memory
console.log('1️⃣ Session start (cold):');
const coldStart = await hive.onSessionStart();
console.log(coldStart.contextText || 'No previous memories');
console.log();

// Test 2: Process some user messages
console.log('2️⃣ Processing user messages:');

const msg1 = "I have R2500 and I want to grow it to R25000 so I can afford this AI assistant";
const result1 = hive.onUserMessage(msg1);
console.log(`Message: "${msg1.slice(0, 50)}..."`);
console.log(`Importance: ${result1.importance}, Tags: ${result1.tags.join(', ')}, Saved: ${result1.saved}`);
console.log();

const msg2 = "I'm based in South Africa, Johannesburg";
const result2 = hive.onUserMessage(msg2);
console.log(`Message: "${msg2}"`);
console.log(`Importance: ${result2.importance}, Tags: ${result2.tags.join(', ')}, Saved: ${result2.saved}`);
console.log();

const msg3 = "What's the weather like?";
const result3 = hive.onUserMessage(msg3);
console.log(`Message: "${msg3}"`);
console.log(`Importance: ${result3.importance}, Saved: ${result3.saved} (below threshold, not saved)`);
console.log();

// Test 3: Session start with warm memory
console.log('3️⃣ Session start (warm - should recall previous):');
const warmStart = await hive.onSessionStart({ tags: ['financial', 'goals'] });
console.log(warmStart.contextText);
console.log();

//Test 4: Manual remember (explicit)
console.log('4️⃣ Manual remember:');
const manualId = hive.remember("The user's name is Test User", { 
  importance: 0.9, 
  tags: ['personal', 'manual'] 
});
console.log(`Saved with ID: ${manualId}`);
console.log();

// Test 5: Stats
console.log('5️⃣ System stats:');
const stats = hive.getStats();
console.log(`Total memories: ${stats.vault.total}`);
console.log(`Top tags: ${JSON.stringify(stats.vault.byTag)}`);
console.log();

// Test 6: Search
console.log('6️⃣ Search for "money":');
const searchResults = hive.search('money');
searchResults.forEach(m => console.log(`- ${m.content.slice(0, 80)}...`));

console.log('\n✅ Demo complete!');