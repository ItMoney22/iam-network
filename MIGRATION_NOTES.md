# Migration from Replit to Local Development

This document details all changes made to migrate The I AM Network from Replit to local development.

## Summary of Changes

✅ **All Replit AI Integration dependencies removed**
✅ **Zero AI router migrated from Gemini to GPT 5.1**
✅ **Direct API integration for all LLM providers**
✅ **Windows-compatible npm scripts**
✅ **Environment configuration standardized**

---

## 🔄 Modified Files

### 1. LLM Provider Clients

#### `server/llm/gemini-client.ts`
**Before:**
```typescript
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});
```

**After:**
```typescript
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});
```

**Changes:**
- Removed Replit proxy (`AI_INTEGRATIONS_GEMINI_BASE_URL`)
- Uses direct Google Generative AI API
- Updated environment variable to `GOOGLE_GENAI_API_KEY`

---

#### `server/llm/openai-client.ts`
**Before:**
```typescript
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});
```

**After:**
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
```

**Changes:**
- Removed Replit proxy (`AI_INTEGRATIONS_OPENAI_BASE_URL`)
- Uses default OpenAI API endpoint (`https://api.openai.com/v1`)
- Updated environment variable to `OPENAI_API_KEY`

---

#### `server/llm/openrouter-client.ts`
**Before:**
```typescript
const openrouter = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY
});
```

**After:**
```typescript
const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});
```

**Changes:**
- Removed Replit proxy variable
- Hardcoded OpenRouter API endpoint (`https://openrouter.ai/api/v1`)
- Updated environment variable to `OPENROUTER_API_KEY`

---

### 2. Conversation Router (Zero AI)

#### `server/conversation/router.ts`
**Before:**
```typescript
import { Type } from "@google/genai";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL!,
  },
});

// Used Gemini 2.5 Flash for routing
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  // ...
});
```

**After:**
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Now uses GPT 5.1 for routing
const response = await openai.chat.completions.create({
  model: "gpt-5.1",
  // ...
  response_format: { type: "json_object" },
});
```

**Major Changes:**
- **Migrated Zero AI from Gemini to GPT 5.1** (per user request)
- Completely replaced Google GenAI SDK with OpenAI SDK
- Changed from Gemini's `generateContent` to OpenAI's `chat.completions.create`
- Updated JSON schema handling from Gemini's `responseSchema` to OpenAI's `response_format`
- Removed all Replit AI Integration dependencies

**Why GPT 5.1?**
User specifically requested Zero to use GPT 5.1 for improved conversation routing and decision-making.

---

### 3. Pre-show Prep Generator

#### `server/preshow/generator.ts`
**Before:**
```typescript
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY!,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});
```

**After:**
```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
```

**Changes:**
- Removed Replit proxy
- Uses standard OpenAI API
- Still uses `gpt-4o-mini` model

---

### 4. Package Configuration

#### `package.json`
**Before:**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

**After:**
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "db:studio": "drizzle-kit studio"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    // ...
  }
}
```

**Changes:**
- Added `cross-env` for Windows compatibility
- All scripts now work on Windows, Mac, and Linux
- Added `db:studio` script for database exploration

---

## 📋 New Files Created

### `.env.example`
Template file showing all required environment variables:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
GOOGLE_GENAI_API_KEY=your-key
OPENAI_API_KEY=your-key
OPENROUTER_API_KEY=your-key
```

### `README.md`
Comprehensive setup and usage documentation including:
- Quick start guide
- Environment setup instructions
- API key acquisition links
- Database setup
- Troubleshooting guide

### `MIGRATION_NOTES.md`
This file - complete migration documentation.

---

## 🔑 Environment Variable Mapping

| Old (Replit) | New (Local) | Where to Get |
|--------------|-------------|--------------|
| `AI_INTEGRATIONS_GEMINI_API_KEY` | `GOOGLE_GENAI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `AI_INTEGRATIONS_GEMINI_BASE_URL` | ❌ Removed | Direct API |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | ❌ Removed | Default: `https://api.openai.com/v1` |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/keys) |
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` | ❌ Removed | Hardcoded: `https://openrouter.ai/api/v1` |

---

## 🚀 Zero AI Router Migration Details

### Why Migrate from Gemini to GPT 5.1?

1. **User Request**: Explicitly requested by project owner
2. **Routing Quality**: GPT 5.1 provides superior decision-making for conversation flow
3. **Consistency**: Using OpenAI for both routing and many character responses
4. **JSON Mode**: OpenAI's structured output mode is reliable

### Technical Changes in Router

**Gemini Approach:**
```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.6,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        nextSpeaker: { type: Type.STRING },
        intent: { type: Type.STRING },
        reasoning: { type: Type.STRING },
      },
      required: ["nextSpeaker", "intent", "reasoning"],
    },
  },
});
```

**GPT 5.1 Approach:**
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-5.1",
  messages: [
    {
      role: "system",
      content: "You are Zero, the divine director of The I AM Network. You always respond with valid JSON..."
    },
    { role: "user", content: prompt }
  ],
  temperature: 0.6,
  response_format: { type: "json_object" },
});
```

**Key Differences:**
- Gemini uses `responseSchema` with typed definitions
- OpenAI uses `response_format: { type: "json_object" }` with system prompt guidance
- Gemini has `role: "user"` with `parts` array
- OpenAI has standard `role/content` message format
- Both return JSON, but parsing is slightly different

---

## ✅ Testing Checklist

After migration, verify:

- [ ] Install completes without errors: `npm install`
- [ ] Database connection works: `npm run db:push`
- [ ] Dev server starts: `npm run dev`
- [ ] All API endpoints respond correctly
- [ ] Zero AI routing works with GPT 5.1
- [ ] Character responses generate correctly
- [ ] Knowledge base searches work
- [ ] Pre-show prep generation works
- [ ] Frontend loads and displays correctly

---

## 🔧 Database Setup

The database schema remains unchanged. To set up:

1. **Get PostgreSQL instance** (Neon recommended):
   - Create account at [Neon](https://neon.tech)
   - Create new project
   - Copy connection string

2. **Add to .env**:
   ```env
   DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
   ```

3. **Push schema**:
   ```bash
   npm run db:push
   ```

4. **Verify** (optional):
   ```bash
   npm run db:studio
   ```

---

## 🐛 Known Issues & Solutions

### Issue: "Cannot find module @google/genai"
**Solution:** Run `npm install` - all dependencies should install automatically

### Issue: "Invalid API key"
**Solution:**
- Verify all three API keys are set in `.env`
- Check keys are valid and have credits
- Ensure no extra spaces or quotes around keys

### Issue: "Database connection failed"
**Solution:**
- Verify `DATABASE_URL` includes `?sslmode=require` for Neon
- Check database credentials
- Ensure database accepts connections from your IP

### Issue: GPT 5.1 not available
**Solution:**
- If GPT 5.1 is not available in your OpenAI account, you can change the model in `server/conversation/router.ts` line 58
- Alternative models: `gpt-4.1`, `gpt-4o`, `gpt-4-turbo`
- Update the model string to match your available models

---

## 📊 Cost Implications

### Before (Replit AI Integrations)
- Managed through Replit subscription
- Proxy overhead included
- Limited control over usage

### After (Direct APIs)
- Pay-per-use for each service
- No proxy overhead
- Full usage visibility
- **Estimated costs** (varies by usage):
  - Google Gemini: ~$0.075 per 1M tokens (Gemini 1.5 Flash)
  - OpenAI: ~$3-15 per 1M tokens (GPT 4.1/5.1)
  - OpenRouter: Varies by model selected

**Recommendation:** Monitor API usage dashboards closely during initial deployment.

---

## 🎯 Next Steps

1. **Get API Keys**:
   - [Google AI Studio](https://makersuite.google.com/app/apikey) - Gemini
   - [OpenAI Platform](https://platform.openai.com/api-keys) - GPT models
   - [OpenRouter](https://openrouter.ai/keys) - Multi-model access

2. **Set up Database**:
   - Create Neon PostgreSQL instance (free tier available)
   - Or use local PostgreSQL

3. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Fill in all API keys and database URL

4. **Run Application**:
   ```bash
   npm install
   npm run db:push
   npm run dev
   ```

5. **Verify Everything Works**:
   - Visit `http://localhost:5000`
   - Test conversation routing
   - Create test episode
   - Verify AI responses

---

## 📞 Support

If you encounter issues:
1. Check this migration document
2. Review `README.md` troubleshooting section
3. Verify all environment variables are set correctly
4. Check API key permissions and credits
5. Ensure database is accessible

---

**Migration completed successfully! 🎉**

The I AM Network is now ready for local development with:
- Direct API integration (no Replit dependencies)
- GPT 5.1 powering Zero's conversation routing
- Windows/Mac/Linux compatibility
- Full control over AI providers and costs
