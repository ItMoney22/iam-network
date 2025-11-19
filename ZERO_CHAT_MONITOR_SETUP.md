# Zero Chat Monitor with Social Stream Ninja

## Overview

This integration allows **Zero** (your AI assistant) to monitor live stream chat from **all platforms** via Social Stream Ninja and alert you when important questions, topics, or events require your attention.

### What It Does

- 📡 **Connects to Social Stream Ninja** via WebSocket to receive chat from YouTube, Twitch, Kick, Facebook, TikTok, etc.
- 🤖 **Zero Analyzes Chat** every 30 seconds (configurable) looking for:
  - Important questions viewers want answered
  - Topics viewers want discussed
  - Concerns or confusion that needs addressing
  - Donations and special events
- 🚨 **Creates Smart Alerts** with priority levels (low/medium/high/urgent)
- 💬 **Real-time Monitoring** with immediate alerts for urgent keywords and donations

## Setup Instructions

### Step 1: Get Your Social Stream Ninja Session ID

1. Open Social Stream Ninja: https://socialstream.ninja
2. Connect your streaming platforms (YouTube, Twitch, Kick, etc.)
3. In Social Stream Ninja, go to **Settings** or check the URL
4. Find your **Session ID** - it looks like: `abcd1234-5678-9012-3456-789012345678`
5. Copy this Session ID

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```env
# Social Stream Ninja Configuration
SOCIAL_STREAM_SESSION_ID=your_session_id_here
SOCIAL_STREAM_IN_CHANNEL=1
SOCIAL_STREAM_OUT_CHANNEL=1
```

**Note**: The channels default to `1` if not specified. Only change them if you're using multiple Social Stream Ninja instances.

### Step 3: Start the Server

```bash
cd "E:\Projects for MetaSphere\IAMNetwork\MetaDevNetwork"
npm run dev
```

Look for these console messages:

```
[ChatAggregator] Initializing chat aggregation service...
[SocialStream] Connecting to Social Stream Ninja...
[SocialStream] Session: YOUR_SESSION_ID, In: 1, Out: 1
[SocialStream] WebSocket connection established
[SocialStream] Listening for messages from all connected platforms
```

### Step 4: Start Zero's Monitoring

You have two options:

#### Option A: API Request (Recommended)

```bash
curl -X POST http://localhost:5000/api/zero/monitor/start \
  -H "Content-Type: application/json" \
  -d '{
    "analysisInterval": 30000,
    "batchSize": 10,
    "alertThreshold": "medium"
  }'
```

#### Option B: From the Browser Console

```javascript
fetch('http://localhost:5000/api/zero/monitor/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analysisInterval: 30000,  // 30 seconds
    batchSize: 10,
    alertThreshold: 'medium'
  })
})
.then(r => r.json())
.then(console.log);
```

## Configuration Options

### Analysis Interval

How often Zero analyzes the chat (in milliseconds):

- `15000` = 15 seconds (very active monitoring)
- `30000` = 30 seconds (default - recommended)
- `60000` = 1 minute (lighter monitoring)

### Batch Size

Number of messages to analyze at once:

- `5` = Small batches (faster, less context)
- `10` = Default (good balance)
- `20` = Large batches (more context, slower)

### Alert Threshold

Minimum priority level to create alerts:

- `"low"` = All content (very noisy)
- `"medium"` = Default (balanced)
- `"high"` = Only high priority (quieter)
- `"urgent"` = Emergency only (very quiet)

## API Endpoints

### Start Monitoring

```bash
POST /api/zero/monitor/start
Content-Type: application/json

{
  "analysisInterval": 30000,
  "batchSize": 10,
  "alertThreshold": "medium"
}
```

### Stop Monitoring

```bash
POST /api/zero/monitor/stop
```

### Get Monitoring Status

```bash
GET /api/zero/monitor/status
```

Response:
```json
{
  "enabled": true,
  "alertCount": 3,
  "urgentAlerts": 0,
  "highAlerts": 1,
  "lastAnalyzedMessageId": "socialstream-1234567890",
  "config": {
    "enabled": true,
    "analysisInterval": 30000,
    "batchSize": 10,
    "alertThreshold": "medium"
  }
}
```

### Get All Alerts

```bash
GET /api/zero/monitor/alerts?limit=20
```

Get alerts by priority:
```bash
GET /api/zero/monitor/alerts?priority=high
```

Response:
```json
{
  "alerts": [
    {
      "id": "alert-1234567890",
      "timestamp": "2025-01-19T10:30:00.000Z",
      "priority": "high",
      "category": "question",
      "summary": "Viewer asking about I AM consciousness and scripture",
      "messages": [ ... ],
      "zeroAnalysis": "Multiple viewers are asking about the relationship between...",
      "actionSuggestion": "Address the question about I AM consciousness in relation to John 8:58"
    }
  ]
}
```

### Clear an Alert

```bash
DELETE /api/zero/monitor/alerts/:alertId
```

### Clear All Alerts

```bash
DELETE /api/zero/monitor/alerts
```

### Update Configuration

```bash
PUT /api/zero/monitor/config
Content-Type: application/json

{
  "analysisInterval": 15000,
  "alertThreshold": "high"
}
```

## Alert Categories

Zero classifies alerts into these categories:

- **question**: Viewers asking important questions
- **topic_request**: Requests for specific topics to discuss
- **concern**: Confusion or concerns that need addressing
- **appreciation**: Donations, follows, subscriptions
- **other**: Other notable chat activity

## Alert Priority Levels

- **🔴 urgent**: Immediate attention required (emergency keywords, large donations)
- **🟠 high**: Important but not emergency (key questions, multiple viewers asking same thing)
- **🟡 medium**: Notable but can wait (interesting topics, minor questions)
- **🟢 low**: Informational only (general chat activity)

## Urgent Keywords

These keywords trigger immediate analysis (bypassing the batch interval):

- "emergency"
- "urgent"
- "help needed"
- "important question"
- "david please"
- "need answer now"

**Donations and special events always trigger immediate alerts.**

## Usage During Live Stream

### Before Going Live

1. Start your server: `npm run dev`
2. Verify Social Stream Ninja connection
3. Start Zero monitoring:
   ```bash
   curl -X POST http://localhost:5000/api/zero/monitor/start
   ```

### During the Stream

Zero will analyze chat automatically and create alerts. You can check alerts via:

**Option 1: API Polling** (in another terminal)
```bash
# Check every minute
while true; do
  curl -s http://localhost:5000/api/zero/monitor/alerts | jq
  sleep 60
done
```

**Option 2: Build a Dashboard** (future enhancement)
Create a simple webpage that:
- Polls `/api/zero/monitor/alerts`
- Displays alerts with color-coded priority
- Shows Zero's analysis and action suggestions
- Allows clearing alerts

**Option 3: WebSocket (future enhancement)**
The chat monitor emits events that could be forwarded via WebSocket for real-time notifications.

### After the Stream

```bash
# Stop monitoring
curl -X POST http://localhost:5000/api/zero/monitor/stop

# Review all alerts
curl http://localhost:5000/api/zero/monitor/alerts?limit=100

# Clear alerts
curl -X DELETE http://localhost:5000/api/zero/monitor/alerts
```

## Example Alert Flow

1. **Viewer sends message**: "Can David explain the I AM presence in John 8:58?"
2. **Zero receives** message via Social Stream Ninja
3. **Zero analyzes** within 30 seconds (or immediately if urgent)
4. **Zero determines**:
   - Priority: `high`
   - Category: `question`
   - Summary: "Viewer asking about I AM in John 8:58"
5. **Alert created** with Zero's analysis and action suggestion
6. **You receive** alert via API polling or dashboard
7. **You address** the question on stream
8. **Clear alert** when done

## Testing the Integration

### Test 1: Verify Social Stream Ninja Connection

```bash
# Check chat aggregator status
curl http://localhost:5000/api/chat/status
```

Expected response:
```json
{
  "kick": "disconnected",
  "twitch": "disconnected",
  "tiktok": "disconnected",
  "socialstream": "connected"
}
```

### Test 2: Inject Test Message

```bash
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "username": "TestViewer",
    "message": "Can you explain the I AM principle from your book?"
  }'
```

### Test 3: Verify Zero Monitoring

```bash
# Start monitoring
curl -X POST http://localhost:5000/api/zero/monitor/start

# Wait 30 seconds for analysis

# Check alerts
curl http://localhost:5000/api/zero/monitor/alerts
```

### Test 4: Test Urgent Alert

```bash
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "youtube",
    "username": "TestViewer",
    "message": "URGENT: Important question about consciousness"
  }'

# Check alerts immediately (should appear instantly)
curl http://localhost:5000/api/zero/monitor/alerts
```

## Troubleshooting

### Social Stream Ninja Not Connecting

**Check 1**: Verify SESSION_ID is correct
```bash
# Should show your session ID
echo $SOCIAL_STREAM_SESSION_ID
```

**Check 2**: Test WebSocket connection manually
```javascript
const ws = new WebSocket('wss://io.socialstream.ninja/join/YOUR_SESSION_ID/1/1');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);
```

**Check 3**: Verify Social Stream Ninja dashboard is open
- Go to https://socialstream.ninja
- Make sure platforms are connected
- Send a test message from one platform

### Zero Not Creating Alerts

**Check 1**: Verify monitoring is enabled
```bash
curl http://localhost:5000/api/zero/monitor/status
```

Should show `"enabled": true`

**Check 2**: Check alert threshold
If threshold is `"high"` but messages are `"medium"` priority, no alerts will appear.

**Check 3**: Verify OpenAI API key
```bash
curl http://localhost:5000/api/zero/status
```

Should show `"openaiConfigured": true`

**Check 4**: Check server logs
Look for:
```
[ZeroChatMonitor] Starting chat monitoring...
[ZeroChatMonitor] Analyzing X new messages...
```

### No Messages Appearing

**Check 1**: Verify chat aggregator is receiving messages
```bash
curl http://localhost:5000/api/chat/messages
```

**Check 2**: Send test message
```bash
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"youtube","username":"Test","message":"Hello"}'
```

**Check 3**: Check Social Stream Ninja dashboard
- Verify messages appear in Social Stream Ninja
- Check that the session is active

## Advanced Configuration

### Custom Urgent Keywords

Edit `server/services/zeroChatMonitor.ts`:

```typescript
const urgentKeywords = [
  'emergency',
  'urgent',
  'your custom keyword',
  // Add more keywords
];
```

### Adjust Analysis Prompt

Edit `server/services/zeroChatMonitor.ts`, find `analyzeMessagesWithZero()` and modify the prompt to customize Zero's analysis criteria.

### Change Alert Storage Limit

Edit `server/services/zeroChatMonitor.ts`:

```typescript
private readonly maxAlertsStored = 50;  // Change this number
```

## Production Deployment

When deploying to Railway:

1. **Set Environment Variables** in Railway dashboard:
   ```
   SOCIAL_STREAM_SESSION_ID=your_session_id
   OPENAI_API_KEY=your_openai_key
   ```

2. **Auto-start Monitoring** (optional):
   Add to `server/index.ts` after chatAggregator initialization:

   ```typescript
   import { zeroChatMonitor } from './services/zeroChatMonitor';

   // Start monitoring automatically in production
   if (process.env.NODE_ENV === 'production') {
     zeroChatMonitor.startMonitoring({
       analysisInterval: 30000,
       batchSize: 10,
       alertThreshold: 'medium',
     });
   }
   ```

3. **Push to GitHub** and Railway will auto-deploy

## Future Enhancements

Potential improvements:

1. **Real-time Dashboard**: Web UI showing alerts in real-time
2. **WebSocket Notifications**: Push alerts to connected clients
3. **Voice Alerts**: Zero speaks alerts during live stream
4. **SMS/Email Alerts**: Send critical alerts via Twilio/SendGrid
5. **Alert History**: Store alerts in database for analytics
6. **Keyword Customization**: User-configurable urgent keywords via UI
7. **Platform-specific Rules**: Different thresholds per platform
8. **Sentiment Analysis**: Track chat mood/sentiment over time

## Support

For issues or questions:
- Check server logs for error messages
- Verify all environment variables are set
- Test each component individually (Social Stream Ninja → Chat Aggregator → Zero Monitor)
- Review the API responses for error details

## Summary

This integration gives you **AI-powered chat monitoring** that:
- ✅ Works with **all your streaming platforms** via Social Stream Ninja
- ✅ **Automatically identifies** important questions and topics
- ✅ **Prioritizes** what needs your attention
- ✅ **Provides context** and action suggestions
- ✅ **Never misses donations** or special events

Zero becomes your co-host, monitoring chat so you can focus on delivering great content!
