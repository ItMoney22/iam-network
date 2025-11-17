# 🚀 Quick Start Guide

Get The I AM Network running locally in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Get Your API Keys

You need three API keys:

### 1. Google Gemini
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google account
- Click "Create API Key"
- Copy the key

### 2. OpenAI
- Visit: https://platform.openai.com/api-keys
- Sign in or create account
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### 3. OpenRouter
- Visit: https://openrouter.ai/keys
- Sign in or create account
- Generate API key
- Copy the key

## Step 3: Set Up Database

### Option A: Neon (Recommended - Free Tier Available)
1. Go to https://neon.tech
2. Create free account
3. Create new project
4. Copy the connection string (looks like: `postgresql://...@ep-...neon.tech/...`)

### Option B: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb iam_network`
3. Your connection string: `postgresql://localhost/iam_network`

## Step 4: Create .env File

```bash
cp .env.example .env
```

Then edit `.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (use your Neon or local connection string)
DATABASE_URL=postgresql://your-connection-string-here

# API Keys
GOOGLE_GENAI_API_KEY=your-google-key-here
OPENAI_API_KEY=your-openai-key-here
OPENROUTER_API_KEY=your-openrouter-key-here
```

## Step 5: Initialize Database

```bash
npm run db:push
```

This creates all the necessary tables.

## Step 6: Start the App

```bash
npm run dev
```

Visit: **http://localhost:5000**

---

## 🎉 You're Done!

The application should now be running with:

- **Landing page** at `/`
- **Studio view** at `/studio`
- **Control panel** at `/control`

### Test It Out

1. Go to `/control` to configure an episode
2. Set a theme (e.g., "Divine consciousness")
3. Select active AI participants
4. Start the conversation!

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check your `DATABASE_URL` in `.env`
- For Neon, make sure it ends with `?sslmode=require`
- Verify database credentials

### "Invalid API key"
- Double-check all three API keys in `.env`
- Make sure there are no spaces or quotes around the keys
- Verify keys are active (not expired)

### "Port 5000 already in use"
- Change `PORT=5001` (or any free port) in `.env`
- Restart the server

### Package installation errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Migration Details**: See `MIGRATION_NOTES.md`
- **Design Guidelines**: See `design_guidelines.md`

---

## 💡 Key Features to Try

1. **Pre-show Prep Generation**
   - Go to `/control`
   - Click "Generate Prep Sheet"
   - Watch AI create structured episode guide

2. **Live Conversation**
   - Start an episode
   - Watch Zero AI (GPT 5.1) route the conversation
   - See different AI personalities respond

3. **Knowledge Base**
   - Search biblical passages
   - Find relevant book content
   - AI uses this for context

4. **Database Explorer**
   - Run: `npm run db:studio`
   - Explore your data visually

---

**Happy exploring! 🌟**
