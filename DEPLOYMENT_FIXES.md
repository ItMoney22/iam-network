# Deployment Fixes - Audio & Studio Update

## Overview
This guide covers the specific steps to deploy the new Studio Audio features (Minimax TTS + GCS) to Railway.

## 1. Link Project
Ensure you are linked to the correct Railway project:
```bash
railway link -p c7733564-a9b1-4142-be94-cbe4ec47d45b
```

## 2. Set Environment Variables
The new features require specific environment variables. Run these commands to set them in Railway:

### Replicate (for Minimax TTS)
```bash
railway variables --set REPLICATE_API_KEY=your_replicate_key_here
```

### Google Cloud Storage (for Audio Hosting)
Ensure your `GCS_BUCKET_NAME` matches the bucket you created.
```bash
railway variables --set GCS_BUCKET_NAME=iam-network-audio
```

### GCS Credentials
If you haven't already, you need to upload your Service Account JSON.
1.  Get your `gcp-service-account.json`.
2.  Upload it via the Railway Dashboard (Settings -> Files) to `/app/gcp-service-account.json`.
3.  Set the path variable:
    ```bash
    railway variables --set GOOGLE_APPLICATION_CREDENTIALS=/app/gcp-service-account.json
    ```

## 3. Deploy
Push your changes to deploy:
```bash
railway up
```

## 4. Verification
After deployment, verify the audio service:
1.  Go to your deployed URL (e.g., `https://iam-network.up.railway.app/studio`).
2.  Send a message.
3.  Check logs if audio fails:
    ```bash
    railway logs
    ```
