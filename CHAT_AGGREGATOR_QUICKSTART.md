# Chat Aggregator Quick Start Guide

Get your multi-platform chat aggregation up and running in 5 minutes!

## Step 1: Configure Environment Variables

Add these to your `.env` file:

```bash
# Kick.com (required for Kick chat)
KICK_API_KEY=your_kick_api_key_here
KICK_CHANNEL_NAME=iamnetwork

# Twitch (required for Twitch chat)
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
TWITCH_CHANNEL_NAME=iamnetwork

# TikTok (optional - requires API access)
TIKTOK_API_KEY=your_tiktok_api_key_here
TIKTOK_CHANNEL_NAME=iamnetwork
```

**Note**: You can start with just one platform. The service will work with whichever platforms have valid credentials.

## Step 2: Start the Server

```bash
cd "e:\Projects for MetaSphere\IAMNetwork\MetaDevNetwork"
npm run dev
```

Look for these messages in the console:
```
[ChatAggregator] Initializing chat aggregation service...
[Kick] Connecting to Kick.com chat...
[Twitch] Connecting to Twitch chat...
[BrowserSource] Routes registered successfully
```

## Step 3: Test the Connection

### Option A: Browser Test
Open in your browser:
```
http://localhost:5000/browser-source/chat
```

You should see:
- Connection status indicator (green = connected)
- Platform icons showing connection status
- "Waiting for messages..." if no chat yet

### Option B: API Test
```bash
# Check platform status
curl http://localhost:5000/api/chat/status

# Send a test message
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"TestUser","message":"Hello World!"}'
```

### Option C: WebSocket Test
```bash
node test-chat-aggregator.js
```

## Step 4: Add to OBS/Streamlabs

### OBS Studio
1. Click the **+** button in Sources
2. Select **Browser**
3. Name it "Live Chat"
4. Configure:
   - **URL**: `http://localhost:5000/browser-source/chat`
   - **Width**: 800
   - **Height**: 600
   - **FPS**: 30
   - Check: "Shutdown source when not visible"
   - Check: "Refresh browser when scene becomes active"
5. Click **OK**
6. Position and resize on your stream layout

### Streamlabs OBS
1. Click **+** in Sources
2. Select **Browser Source**
3. Name it "Live Chat"
4. Configure:
   - **URL**: `http://localhost:5000/browser-source/chat`
   - **Width**: 800
   - **Height**: 600
5. Click **Done**
6. Position on your stream

## Step 5: Go Live!

Start streaming on your platforms. Chat messages will automatically appear in the overlay!

## Quick Commands

### Send Test Messages
```bash
# Twitch test
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"TwitchViewer","message":"Love this stream!"}'

# Kick test
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"kick","username":"KickFan","message":"Amazing content!"}'

# TikTok test
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"tiktok","username":"TikTokUser","message":"This is fire!"}'
```

### Check Connection Status
```bash
curl http://localhost:5000/api/chat/status
```

### View Recent Messages
```bash
curl http://localhost:5000/api/chat/messages?limit=10
```

### Reconnect All Platforms
```bash
curl -X POST http://localhost:5000/api/chat/reconnect
```

## Troubleshooting

### No Messages Appearing

**Check 1**: Verify platforms are connected
```bash
curl http://localhost:5000/api/chat/status
```

Should show `"connected"` for enabled platforms.

**Check 2**: Check server logs
Look for connection messages:
```
[Kick] WebSocket connection established
[Twitch] WebSocket connection established
```

**Check 3**: Send a test message
```bash
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{"platform":"twitch","username":"Test","message":"Testing!"}'
```

### Platform Shows "Disconnected"

**Kick**:
- Verify `KICK_API_KEY` is correct
- Check `KICK_CHANNEL_NAME` matches your channel
- Look for error messages in server logs

**Twitch**:
- Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`
- Check `TWITCH_CHANNEL_NAME` matches your channel
- Ensure channel name is lowercase

**TikTok**:
- TikTok requires official API access
- Currently shows as placeholder until API credentials are obtained

### OBS Shows Blank Screen

**Check 1**: Verify URL is correct
```
http://localhost:5000/browser-source/chat
```

**Check 2**: Check browser console in OBS
- Right-click browser source → Interact
- Press F12 to open developer tools
- Look for errors in Console tab

**Check 3**: Test in regular browser first
- Open `http://localhost:5000/browser-source/chat` in Chrome
- Verify it works before adding to OBS

### Messages Not Scrolling

- Refresh the browser source in OBS
- Check if you have many messages (auto-scroll may be disabled)
- Verify Framer Motion is working (check browser console)

## Advanced Tips

### Customize Message Count
Edit `client/src/pages/browser-source-chat.tsx`:
```typescript
const maxMessages = 8;  // Change to 5, 10, or any number
```

### Change Colors
Edit platform colors in the same file:
```typescript
const platformColors = {
  kick: 'border-l-green-500',    // Change to any Tailwind color
  twitch: 'border-l-purple-500',
  tiktok: 'border-l-pink-500'
};
```

### Adjust Width/Height in OBS
- Default: 800x600
- Narrower: 600x800 (sidebar style)
- Wider: 1200x400 (bottom ticker)
- Experiment to find what works for your layout

## Production Deployment

For production streaming:

1. **Use HTTPS/WSS**:
   - Update URL to: `https://yourdomain.com/browser-source/chat`
   - Ensure SSL certificate is valid

2. **Set Production Environment Variables**:
   - Use production API keys
   - Set `NODE_ENV=production`

3. **Monitor Performance**:
   - Check CPU usage during stream
   - Monitor memory usage
   - Watch for connection errors

## Getting Help

1. **Check Documentation**:
   - `CHAT_AGGREGATOR_README.md` - Full documentation
   - `CHAT_AGGREGATOR_IMPLEMENTATION.md` - Technical details

2. **Check Server Logs**:
   - Look for `[ChatAggregator]`, `[Kick]`, `[Twitch]` prefixes
   - Error messages will show connection issues

3. **Test API Endpoints**:
   - Use curl commands above to diagnose issues
   - Check `/api/chat/status` first

## Next Steps

Once basic setup is working:

1. Customize the visual design
2. Adjust message count and timing
3. Add custom moderation rules (future feature)
4. Integrate with other streaming tools

## Platform-Specific Notes

### Kick.com
- Uses Pusher WebSocket protocol
- Real-time message delivery
- Supports badges and colors
- Channel name case-sensitive

### Twitch
- Uses IRC WebSocket protocol
- Very reliable connection
- Rich metadata (badges, colors, emotes)
- Channel name must be lowercase

### TikTok
- Requires official API partnership
- Currently placeholder implementation
- Will be enabled when API access is obtained
- Contact TikTok for API access

## Success!

If you see chat messages appearing in your OBS overlay, you're all set! Your multi-platform chat aggregation is now live.

Happy streaming!
