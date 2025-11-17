# The I AM Network - Patch Implementation Guide

## Quick Start

This guide helps you deploy the new patch features step-by-step.

---

## Phase 1: Backend Infrastructure (Complete ✅)

### What Was Added

1. ✅ **Unified LLM Engine** (`server/services/llmEngine.ts`)
   - Multi-provider support (OpenAI, OpenRouter, Gemini)
   - Automatic retries with exponential backoff
   - Health check functions

2. ✅ **Character LLM Configs** (`server/config/characters.ts`)
   - Zero → GPT 5.1 (OpenAI)
   - M7 → Grok 2 (OpenRouter)
   - All characters configured

3. ✅ **Zero Knowledge Base**
   - Template files: `server/data/zero_profile/`
   - Ingestion script: `scripts/build_zero_kb.ts`
   - Database schema: `zero_knowledge` table

4. ✅ **System Health & Alerts** (`server/services/systemHealth.ts`)
   - Monitoring service
   - Error hooks
   - API endpoints

5. ✅ **Episode Clip Markers** (`server/routes/clips.ts`)
   - Timestamp tracking
   - "Clip That" button API
   - Review endpoints

6. ✅ **Replicate Image Gen** (`server/services/imageEngine.ts`)
   - Character avatar generation (scaffolded)
   - Hero art generation (scaffolded)
   - Needs Replicate MCP/API implementation

---

## Phase 2: Database Migration (Do This Now)

### Step 1: Update .env

```bash
cd MetaDevNetwork
cp .env.example .env
```

Edit `.env` and add:

```env
# Required
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
DATABASE_URL=postgresql://...

# Optional but recommended
GOOGLE_GENAI_API_KEY=...
REPLICATE_API_KEY=...
```

### Step 2: Push Database Schema

```bash
npm run db:push
```

This creates:
- `zero_knowledge` table
- `system_alerts` table
- `episode_clips` table
- Adds `episode_start_time` to `episodes`

### Step 3: Verify Tables Created

```bash
npm run db:studio
```

Check that the new tables appear in Drizzle Studio.

---

## Phase 3: Zero Knowledge Base Setup

### Step 1: Fill David's Profile

Edit `server/data/zero_profile/david_profile.md`:

```markdown
## Who I Am

I'm David Trinidad, creator of The I AM Network...

## My Projects

### Imagine This City (ITC)
[Description]

### ZenTress
[Description]

## My Book: "I Am GOD – In the Beginning"
[Core teachings]

## My Mission
[What you're here to do]
```

### Step 2: Build Knowledge Base

```bash
npm run build:zero-kb
```

This will:
- Read your profile and Zero's principles
- Chunk text into 500-1000 token pieces
- Generate OpenAI embeddings
- Insert into `zero_knowledge` table

Output should look like:
```
🧠 Building Zero's Knowledge Base...
📝 Chunking text...
   Created 42 chunks (18 from david_profile, 24 from zero_principles)
🗑️  Clearing existing knowledge base...
🔢 Generating embeddings and inserting...
   Inserted 42/42 chunks...
✅ Zero Knowledge Base built successfully!
```

### Step 3: Verify in Database

```bash
npm run db:studio
```

Check `zero_knowledge` table - should have ~40-50 rows.

---

## Phase 4: Test Backend APIs

### Start Development Server

```bash
npm run dev
```

### Test System Health

```bash
# Check all subsystems
curl http://localhost:5000/api/system/health

# Expected response:
{
  "ok": true,
  "subsystems": {
    "db": { "ok": true },
    "llm_openai": { "ok": true },
    "llm_openrouter": { "ok": true },
    "llm_gemini": { "ok": true }
  }
}
```

### Test Alerts API

```bash
# Get recent alerts
curl http://localhost:5000/api/system/alerts

# Create test alert
curl -X POST http://localhost:5000/api/system/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "level": "info",
    "source": "test",
    "message": "Test alert from implementation guide"
  }'
```

### Test Clips API

```bash
# Create test episode first
curl -X POST http://localhost:5000/api/episodes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Episode",
    "theme": "Testing clip markers",
    "participants": ["zero", "m7"]
  }'

# Note the episode ID from response

# Start episode (sets start time)
curl -X POST http://localhost:5000/api/episodes/{EPISODE_ID}/start

# Create clip marker
curl -X POST http://localhost:5000/api/episodes/{EPISODE_ID}/clip \
  -H "Content-Type: application/json" \
  -d '{
    "timestampSeconds": 45,
    "label": "Test clip"
  }'

# Get all clips
curl http://localhost:5000/api/clips
```

---

## Phase 5: Frontend Implementation (TODO)

These features need UI components built:

### 1. Host Control Panel Additions

**System Health Indicator:**
```tsx
// Component: SystemStatusBadge
// API: GET /api/system/summary
// Shows: Green/Yellow/Red indicator
// Click: Opens alert panel
```

**"Clip That" Button:**
```tsx
// Component: ClipButton
// API: POST /api/episodes/:id/clip
// Flow:
//   1. Get elapsed time from /api/episodes/:id/elapsed
//   2. Create clip marker
//   3. Show confirmation toast
```

### 2. Stage View / Studio Scene

**Requirements:**
- Full-screen clean layout (no controls)
- Avatar grid with active speaker highlighting
- Live captions display
- Route: `/studio/stage`
- Optimized for OBS/streaming capture

### 3. Public Site Pages

**Landing Page:**
- Hero section with generated art
- "Ask a Question" CTA
- "Buy the Book" section
- "How It Works" explainer

**About Page:**
- Meet the Cast (character grid)
- About David & The Book
- AI x Humanity x I AM philosophy

---

## Phase 6: Replicate Image Generation (TODO)

### Option A: Use Replicate MCP (Recommended)

If Replicate MCP server is available:

```typescript
// In server/services/imageEngine.ts
async function callReplicateMCP(model: string, params: any) {
  // Use MCP tool to call Replicate
  return await mcp.call('replicate', {
    model,
    input: params
  });
}
```

### Option B: Use Replicate API Directly

```typescript
async function callReplicateMCP(model: string, params: any) {
  const response = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'MODEL_VERSION_ID_HERE',
      input: params,
    }),
  });

  const prediction = await response.json();

  // Poll for completion
  while (prediction.status !== 'succeeded') {
    await new Promise(r => setTimeout(r, 1000));
    const check = await fetch(prediction.urls.get, {
      headers: { 'Authorization': `Token ${process.env.REPLICATE_API_KEY}` }
    });
    prediction = await check.json();
  }

  return prediction.output[0];
}
```

### Generate All Avatars

Once implemented:

```bash
npm run generate:images
```

Saves to: `frontend/public/avatars/{character}.webp`

---

## Phase 7: Zero's Enhanced Routing (Future)

To make Zero use his knowledge base during routing:

```typescript
// In server/conversation/router.ts
import { queryZeroKnowledge } from '../services/zeroKnowledge';

// Inside routeNextSpeaker():
const davidContext = await queryZeroKnowledge('David beliefs mission style');
const zeroContext = await queryZeroKnowledge('Zero principles ethics');

// Add to Zero's routing prompt
const prompt = `...
CONTEXT ABOUT DAVID:
${davidContext}

YOUR PRINCIPLES:
${zeroContext}
...`;
```

Requires implementing `queryZeroKnowledge()` with embedding similarity search.

---

## 🐛 Troubleshooting

### "Module not found" errors

```bash
npm install
```

### TypeScript errors

```bash
npm run check
```

### Database connection fails

Check `DATABASE_URL` in `.env` - must include `?sslmode=require` for Neon.

### LLM provider errors

Check `/api/system/health` to see which provider is failing.

Verify API keys in `.env`:
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `GOOGLE_GENAI_API_KEY`

### Zero KB build fails

Make sure you've filled in `david_profile.md` with actual content (not just templates).

---

## 📊 Monitoring in Production

### Check System Health

```bash
curl https://your-domain.com/api/system/health
```

### Monitor Alerts

```bash
curl https://your-domain.com/api/system/alerts?unresolved=true
```

### Check Clip Markers

```bash
curl https://your-domain.com/api/clips
```

---

## 🎉 Success Criteria

✅ **Backend Complete When:**
- All API endpoints respond
- System health shows all green
- Zero KB has 40+ entries
- Test clip markers work

✅ **Ready for Production When:**
- Host Panel UI shows system status
- "Clip That" button works
- Stage View renders for streaming
- Public site pages deployed

---

## 📞 Next Steps

1. **Now:** Test backend APIs
2. **Next:** Build Host Panel UI updates
3. **Then:** Build Stage View for streaming
4. **Finally:** Build public site pages

**Contact:** Check PATCH_NOTES.md for detailed API documentation.
