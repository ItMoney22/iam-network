# The I AM Network - Deployment Guide

Complete guide to deploying The I AM Network with Zero AI to production.

## 🎯 Tech Stack

- **Hosting**: Railway (auto-deploy from Git)
- **Database**: Supabase PostgreSQL
- **Media Storage**: Google Cloud Storage
- **API**: Node.js + Express + TypeScript
- **Frontend**: React + Vite
- **AI**: OpenAI (Zero), OpenRouter, Gemini, Replicate

---

## 📋 Prerequisites

1. **GitHub Account** - For Git repository
2. **Railway Account** - Sign up at [railway.app](https://railway.app)
3. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
4. **Google Cloud Account** - For GCS media storage
5. **OpenAI API Key** - From [platform.openai.com](https://platform.openai.com)

---

## 🚀 Step-by-Step Deployment

### 1. Set Up Git Repository

```bash
cd MetaDevNetwork

# If not already initialized
git init
git add .
git commit -m "Initial commit - The I AM Network with Zero AI"

# Create GitHub repo and push
# Go to github.com and create a new repository
git remote add origin https://github.com/YOUR_USERNAME/iam-network.git
git branch -M main
git push -u origin main
```

### 2. Set Up Supabase Database

#### A. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: "IAM Network"
4. Database Password: (save this!)
5. Region: Choose closest to your users
6. Click "Create new project"

#### B. Get Database URL

1. In Supabase dashboard → Settings → Database
2. Copy "Connection string" (URI format)
3. Replace `[YOUR-PASSWORD]` with your database password
4. Save this - you'll need it for Railway

Example:
```
postgresql://postgres.xxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

#### C. Run Database Migrations

```bash
# Install Drizzle CLI if not already
npm install -g drizzle-kit

# Set your DATABASE_URL
export DATABASE_URL="your-supabase-connection-string"

# Run migrations
npm run db:push
```

### 3. Set Up Google Cloud Storage

#### A. Create GCS Bucket

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "IAM Network"
3. Enable Cloud Storage API
4. Go to Cloud Storage → Buckets
5. Click "Create Bucket"
   - Name: `iam-network-media`
   - Region: `us-central1` (or your preferred region)
   - Storage class: Standard
   - Access control: Fine-grained
6. Click "Create"

#### B. Create Service Account

1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
   - Name: "iam-network-storage"
   - Role: "Storage Object Admin"
3. Click "Create Key" → JSON
4. Download the JSON file
5. **Save this file** - you'll upload it to Railway

#### C. Make Bucket Public (for media serving)

```bash
# Install gsutil (comes with gcloud SDK)
gsutil iam ch allUsers:objectViewer gs://iam-network-media
```

### 4. Deploy to Railway

#### A. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your IAM Network repository
6. Railway will auto-detect Node.js and start deploying

#### B. Configure Environment Variables

In Railway dashboard → Variables, add:

```bash
# Database
DATABASE_URL=your-supabase-connection-string

# OpenAI (Zero)
OPENAI_API_KEY=sk-proj-your-key

# OpenRouter
OPENROUTER_API_KEY=your-key

# Google Gemini
GOOGLE_GENAI_API_KEY=your-key

# Replicate
REPLICATE_API_KEY=your-key

# GCS
GCS_BUCKET_NAME=iam-network-media
GCS_PROJECT_ID=your-gcp-project-id

# Server
NODE_ENV=production
PORT=5000

# Session
SESSION_SECRET=generate-a-random-secret-key-here
```

#### C. Upload GCS Service Account

1. In Railway → Settings → Files
2. Upload your `gcp-service-account.json`
3. Set path to `/app/gcp-service-account.json`
4. Add environment variable:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-service-account.json
   ```

#### D. Verify Deployment

1. Railway will build and deploy automatically
2. Check logs for any errors
3. Once deployed, Railway gives you a URL: `your-app.railway.app`
4. Test: `https://your-app.railway.app/zero`

### 5. Custom Domain (Optional)

#### In Railway:

1. Go to Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `zero.iamnetwork.com`
4. Add the provided CNAME record to your DNS

#### Example DNS (Cloudflare/Namecheap):

```
Type: CNAME
Name: zero
Value: your-app.railway.app
TTL: Auto
```

---

## 🔧 Post-Deployment

### Test Zero AI

1. Visit `https://your-app.railway.app/zero`
2. Click and hold microphone
3. Say: "Yo Zero, you alive?"
4. Release and wait for response
5. Zero should respond with voice!

### Check API Status

```bash
curl https://your-app.railway.app/api/zero/status
```

Should return:
```json
{
  "status": "active",
  "hasSystemPrompt": true,
  "hasDavidProfile": true,
  "openaiConfigured": true
}
```

### Test GCS Upload

```bash
# From your local machine
curl -X POST https://your-app.railway.app/api/episodes \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Episode", "description": "Testing GCS"}'
```

---

## 📁 Media Storage Structure

### Google Cloud Storage Layout:

```
iam-network-media/
├── episodes/
│   ├── episode-1/
│   │   ├── full.mp4
│   │   ├── thumbnail.jpg
│   │   └── metadata.json
│   └── episode-2/
├── shorts/
│   ├── short-1.mp4
│   ├── short-2.mp4
│   └── ...
├── recordings/
│   ├── 2025-01-15/
│   │   ├── session-1.mp3
│   │   └── session-2.mp3
│   └── ...
└── avatars/
    ├── zero.png
    ├── m7.png
    └── ...
```

### Upload Example (Node.js):

```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

async function uploadEpisode(file: Buffer, episodeId: string) {
  const fileName = `episodes/${episodeId}/full.mp4`;
  const blob = bucket.file(fileName);

  await blob.save(file, {
    metadata: {
      contentType: 'video/mp4',
    },
  });

  // Get public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  return publicUrl;
}
```

---

## 🔄 Continuous Deployment

Railway automatically deploys when you push to main:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Railway automatically:
# 1. Detects push
# 2. Builds app
# 3. Runs tests
# 4. Deploys if successful
# 5. Rolls back if it fails
```

---

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection locally
export DATABASE_URL="your-supabase-url"
npm run db:studio

# Check Railway logs
railway logs
```

### Zero Not Responding

1. Check Railway logs for OpenAI errors
2. Verify `OPENAI_API_KEY` is set
3. Test locally:
   ```bash
   node test-zero.js
   ```
4. Check Zero status endpoint:
   ```bash
   curl https://your-app.railway.app/api/zero/status
   ```

### GCS Upload Fails

1. Verify service account has "Storage Object Admin" role
2. Check bucket name matches `GCS_BUCKET_NAME`
3. Ensure service account JSON is uploaded to Railway
4. Test permissions:
   ```bash
   gsutil ls gs://iam-network-media
   ```

### Build Fails on Railway

1. Check `package.json` has build script:
   ```json
   "scripts": {
     "build": "tsc && vite build"
   }
   ```
2. Verify all dependencies are in `package.json`
3. Check Railway build logs for specific errors

---

## 💰 Cost Estimates

### Free Tier (Getting Started):

- **Railway**: $5/month credit (free hobby plan)
- **Supabase**: 500MB database, 1GB file storage (free)
- **GCS**: 5GB storage, 1GB network egress/month (free tier)
- **OpenAI**: Pay-as-you-go (estimate $10-50/month depending on usage)

### Production (1000 active users):

- **Railway**: ~$20/month
- **Supabase**: ~$25/month (Pro plan)
- **GCS**: ~$20/month (storage + bandwidth)
- **OpenAI**: ~$100-300/month
- **Total**: ~$165-365/month

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use Railway's secret management** - Environment variables are encrypted
3. **Rotate API keys** - Every 90 days
4. **Enable Supabase RLS** - Row-level security for database
5. **Set up CORS** - Only allow your domain
6. **Use HTTPS** - Railway provides this automatically
7. **Monitor logs** - Watch for unusual API usage

---

## 📊 Monitoring

### Railway Dashboard:

- CPU/Memory usage
- Request metrics
- Error logs
- Deployment history

### Supabase Dashboard:

- Database size
- Query performance
- Connection pool stats

### GCS Console:

- Storage usage
- Bandwidth usage
- Access logs

---

## 🎉 You're Live!

Once deployed, your stack looks like this:

```
User Browser
    ↓
Railway (your-app.railway.app)
    ├→ React Frontend (/zero, /studio, /control)
    ├→ Express API (/api/*)
    ├→ Zero AI Service (voice + chat)
    ↓
┌───┴────┬────────┬──────────┐
↓        ↓        ↓          ↓
Supabase  GCS    OpenAI   Gemini
(DB)    (Media)  (Zero)   (Characters)
```

**Zero is now live and ready to talk to the world!** 🔥

---

*Last Updated: 2025-11-17*
*Maintained by MetaDev & Zero*
