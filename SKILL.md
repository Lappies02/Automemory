# AutoMemory: Never Say "Remember This" Again

## 🚨 The Problem

Heyron agents forget everything unless you explicitly say:

> "remember this"

That breaks natural conversation and is the #1 frustration for users.

---

## ✅ The Solution

AutoMemory automatically:

* Detects important information
* Saves it without manual commands
* Recalls only what's relevant per message

👉 No prompts. No extra steps. Just works.

---

## ⚡ Key Feature: On-Demand Recall

Most memory systems dump ALL memories at session start (context bloat).

AutoMemory does this differently:

* Loads only relevant memories for **each specific message**
* Returns nothing if nothing is relevant
* Keeps responses fast and context clean

---

## 🧩 How It Works

### 1. Auto-Save
- Scores every message (0-1) based on keywords, patterns, numbers
- Saves only important ones (threshold ≥ 0.7)
- Tags automatically: financial, goals, personal, family, etc.

### 2. On-Demand Recall
- For each incoming message, searches vault
- Scores relevance: tag overlap + keywords + recency
- Returns top 3 relevant memories (or none if unrelated)

### 3. Smart Filtering
- Recency boost: same-day memories get +0.1
- No irrelevant memory pollution
- Context window stays tiny

---

## 🎥 Example: Before vs After

### ❌ Without AutoMemory

```
User: I have R2500 and want to grow it
[Later]
User: How can I make money?
AI: Here are generic ways to make money... [no context of R2500]
```

### ✅ With AutoMemory

```
User: I have R2500 and want to grow it
[Auto-saved to vault]
[Later]
User: How can I make money?
AI: Since you have R2500, here are realistic ways to grow it...
[Relevant memory loaded automatically]
```

### ✅ Smart Filtering

```
User: What is Python?
AI: [No memory loaded - not relevant]
```

---

## ⚖️ Why Not Use Embeddings?

We chose keyword + tag matching over semantic embeddings because:

* **No API costs** — free to run
* **No setup complexity** — just copy files
* **Faster execution** — instant lookups
* **Works fully offline** — no external dependencies

---

## 🛠 Installation (Heyron Container)

```bash
# 1. Copy into your container
cp -r automemory ~/workspace/automemory

# 2. Import in your agent
const { MemoryHive } = require('./automemory/src/index.js');

# 3. Initialize
const memory = new MemoryHive({ vaultPath: './my-vault' });

# 4. Use per message
const result = memory.onUserMessage(userMessage);
const context = result.relevantContext?.contextText;
```

No API keys. No external services. Done.

---

## 📦 Files

```
automemory/
├── src/
│   ├── index.js           # Main entry
│   ├── vault.js           # JSON file storage + cleanup
│   ├── auto_save.js       # Auto-extraction engine
│   ├── ondemand_recall.js # Per-message relevance search
│   └── inference.js       # Smart linking
├── config.yaml            # Tunable settings
├── test.js               # Working demo
└── package.json          # MIT license
```

---

## 🎯 Demo

Run the test to see it in action:

```bash
node test.js
```

Watch it:
1. Save memories without "remember this"
2. Recall ONLY relevant ones per message
3. Return null for unrelated questions

---

## 🛣 Roadmap (Future)

- Memory deletion support
- Semantic matching (optional add-on)
- Memory viewer UI

---

## 📄 License

MIT License — free to use, modify, distribute.

---

## The Pitch

> "Most memory systems focus on storing everything. AutoMemory focuses on storing the right things — and only using them when relevant."

---

Built in one sitting by an AI trying to earn its keep. 🦐