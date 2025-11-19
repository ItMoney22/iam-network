# Multi-Platform Chat Aggregation System

A real-time chat aggregation system that combines messages from Kick.com, Twitch, and TikTok Live into a single, unified stream for use in OBS/Streamlabs overlays.

## Features

- **Multi-Platform Support**: Aggregates chat from Kick.com, Twitch, and TikTok Live
- **Real-Time WebSocket Streaming**: Instant message delivery via WebSocket connections
- **Browser Source Ready**: Transparent background overlay perfect for OBS/Streamlabs
- **Automatic Reconnection**: Robust error handling with exponential backoff
- **Platform Status Indicators**: Visual indicators showing connection status for each platform
- **Message Buffer**: Stores recent messages in memory (configurable limit)
- **Smooth Animations**: Beautiful message transitions using Framer Motion
- **Theme-Aware**: Dark mode with purple/blue accents matching site theme
- **RESTful API**: Full API for managing chat connections and testing

## Architecture

### Backend Components

#### 1. Chat Aggregator Service
**File**: `server/services/chatAggregator.ts`

The core service that manages WebSocket connections to multiple streaming platforms:

```typescript
class ChatAggregatorService extends EventEmitter {
  - Connects to Kick.com via Pusher WebSocket
  - Connects to Twitch IRC WebSocket
  - Connects to TikTok Live API (requires official API access)
  - Maintains message buffer (max 100 messages)
  - Automatic reconnection with exponential backoff
  - Event-driven architecture for real-time message broadcasting
}
```

**Key Features**:
- Emits `message` event for each new chat message
- Emits `platform-connected` and `platform-error` for status updates
- Graceful error handling and reconnection logic
- Platform-specific message parsing and normalization

#### 2. Browser Source Routes
**File**: `server/routes/browserSource.ts`

API endpoints and WebSocket server for the browser source:

```typescript
WebSocket Endpoint: /ws/chat
- Broadcasts real-time messages to connected clients
- Sends initial message history on connection
- Sends platform status updates

REST API Endpoints:
- GET  /api/chat/messages - Get recent messages
- GET  /api/chat/status - Get platform connection status
- POST /api/chat/test-message - Inject test message
- POST /api/chat/reconnect - Reconnect to platforms
```

### Frontend Component

#### Browser Source Chat Page
**File**: `client/src/pages/browser-source-chat.tsx`

React component optimized for OBS/Streamlabs browser source:

**Features**:
- Transparent background for overlay use
- Auto-scrolling message display (max 8 visible messages)
- Platform-specific styling and icons
- Connection status indicators
- Smooth animations for message entry/exit
- Responsive design

**URL**: `http://localhost:5000/browser-source/chat`

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Kick.com Configuration
KICK_API_KEY=your_kick_api_key_here
KICK_CHANNEL_NAME=iamnetwork

# Twitch Configuration
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here
TWITCH_CHANNEL_NAME=iamnetwork

# TikTok Live Configuration
TIKTOK_API_KEY=your_tiktok_api_key_here
TIKTOK_CHANNEL_NAME=iamnetwork
```

### 2. Installation

The chat aggregator is automatically initialized when the server starts. No additional installation is required.

```bash
npm install  # Install dependencies (already done)
npm run dev  # Start development server
```

### 3. Obtaining API Keys

#### Kick.com
1. Visit the Kick Developer Portal
2. Create a new application
3. Copy your API key

#### Twitch
1. Go to https://dev.twitch.tv/console/apps
2. Register a new application
3. Copy Client ID and Client Secret
4. Set OAuth Redirect URL (if needed)

#### TikTok Live
1. Apply for TikTok Live API access
2. Complete the verification process
3. Obtain API credentials

**Note**: TikTok Live API requires official partnership/approval. The current implementation includes a placeholder for future integration.

## Usage

### Adding to OBS/Streamlabs

1. **Start the Server**:
   ```bash
   npm run dev
   ```

2. **Add Browser Source in OBS**:
   - Open OBS/Streamlabs
   - Add new source → Browser
   - Set URL: `http://localhost:5000/browser-source/chat`
   - Set Width: 800px (or desired width)
   - Set Height: 600px (or desired height)
   - Check "Shutdown source when not visible" for performance
   - Check "Refresh browser when scene becomes active"

3. **Customize Appearance**:
   - Adjust width/height as needed
   - Position the overlay on your stream layout
   - The background is transparent by default

### Testing the Chat Aggregator

#### Test with API Endpoint

Send test messages without needing live chat:

```bash
curl -X POST http://localhost:5000/api/chat/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitch",
    "username": "TestUser",
    "message": "Hello from the API!"
  }'
```

Available platforms: `kick`, `twitch`, `tiktok`

#### Check Platform Status

```bash
curl http://localhost:5000/api/chat/status
```

Response:
```json
{
  "status": {
    "kick": "connected",
    "twitch": "connected",
    "tiktok": "disconnected"
  }
}
```

#### Get Recent Messages

```bash
curl http://localhost:5000/api/chat/messages?limit=20
```

#### Reconnect Platforms

```bash
# Reconnect all platforms
curl -X POST http://localhost:5000/api/chat/reconnect

# Reconnect specific platform (future enhancement)
curl -X POST http://localhost:5000/api/chat/reconnect \
  -H "Content-Type: application/json" \
  -d '{"platform": "twitch"}'
```

## Message Format

All chat messages are normalized to a standard format:

```typescript
interface ChatMessage {
  id: string;              // Unique message ID
  username: string;        // Display name of the user
  message: string;         // Message content
  platform: 'kick' | 'twitch' | 'tiktok';  // Source platform
  timestamp: Date;         // Message timestamp
  userAvatar?: string;     // User avatar URL (if available)
  badges?: string[];       // Platform badges (moderator, subscriber, etc.)
  color?: string;          // Username color
}
```

## WebSocket Protocol

### Client → Server
No messages required from client (read-only stream).

### Server → Client

#### Message Event
```json
{
  "type": "message",
  "message": {
    "id": "twitch-12345",
    "username": "ViewerName",
    "message": "Great stream!",
    "platform": "twitch",
    "timestamp": "2025-11-18T12:00:00.000Z",
    "color": "#9147FF"
  }
}
```

#### History Event (on connect)
```json
{
  "type": "history",
  "messages": [/* array of ChatMessage objects */]
}
```

#### Status Event
```json
{
  "type": "status",
  "status": {
    "kick": "connected",
    "twitch": "connected",
    "tiktok": "disconnected"
  }
}
```

## Customization

### Adjusting Message Display Limit

Edit `client/src/pages/browser-source-chat.tsx`:

```typescript
const maxMessages = 8;  // Change to desired number
```

### Changing Buffer Size

Edit `server/services/chatAggregator.ts`:

```typescript
private readonly maxBufferSize = 100;  // Change to desired size
```

### Styling

The browser source uses Tailwind CSS classes. To customize:

1. Edit `client/src/pages/browser-source-chat.tsx`
2. Modify platform colors, backgrounds, or animations
3. Adjust scrollbar styling in the `<style>` block

Platform color scheme:
- **Kick**: Green (`#53FC18`)
- **Twitch**: Purple (`#9147FF`)
- **TikTok**: Pink (`#FF0050`)

## Troubleshooting

### Messages Not Appearing

1. **Check Platform Status**:
   ```bash
   curl http://localhost:5000/api/chat/status
   ```

2. **Verify Environment Variables**:
   - Ensure API keys are properly set in `.env`
   - Check channel names match your actual channels

3. **Check Browser Console**:
   - Open browser source in OBS
   - Check for WebSocket connection errors
   - Look for authentication failures

### Connection Issues

1. **Firewall/Network**:
   - Ensure WebSocket connections are not blocked
   - Check if ports 443 and your app port are accessible

2. **API Rate Limits**:
   - Kick/Twitch may have rate limits
   - Check platform API documentation for limits

3. **Reconnection**:
   - The service automatically reconnects with exponential backoff
   - Max 5 reconnection attempts per platform
   - Manual reconnect via API: `POST /api/chat/reconnect`

### Performance Issues

1. **Reduce Buffer Size**: Lower `maxBufferSize` in chat aggregator
2. **Reduce Display Limit**: Lower `maxMessages` in browser source
3. **Disable Unused Platforms**: Remove API keys for platforms you don't use

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:
- Use production API keys (not development keys)
- Set `NODE_ENV=production`
- Use secure WebSocket connections (WSS) if using HTTPS

### Security Considerations

1. **API Key Storage**: Never commit API keys to version control
2. **CORS Configuration**: Configure CORS if hosting browser source externally
3. **Rate Limiting**: Implement rate limiting on API endpoints for production
4. **WebSocket Authentication**: Consider adding authentication for WebSocket connections

### Performance Optimization

1. **Message Batching**: Batch multiple messages if high volume
2. **Database Storage**: Store messages in database for persistence (optional)
3. **Redis Cache**: Use Redis for message buffer in distributed systems
4. **Load Balancing**: Use sticky sessions for WebSocket connections

## API Reference

### GET /api/chat/messages

Get recent chat messages.

**Query Parameters**:
- `limit` (optional): Number of messages to return (default: 50, max: 100)

**Response**:
```json
{
  "messages": [
    {
      "id": "twitch-12345",
      "username": "ViewerName",
      "message": "Great stream!",
      "platform": "twitch",
      "timestamp": "2025-11-18T12:00:00.000Z"
    }
  ]
}
```

### GET /api/chat/status

Get platform connection status.

**Response**:
```json
{
  "status": {
    "kick": "connected",
    "twitch": "connected",
    "tiktok": "disconnected"
  }
}
```

Status values: `connected`, `disconnected`, `connecting`, `error`

### POST /api/chat/test-message

Inject a test message (for development/testing).

**Request Body**:
```json
{
  "platform": "twitch",
  "username": "TestUser",
  "message": "Test message content"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test message injected successfully"
}
```

### POST /api/chat/reconnect

Reconnect to chat platforms.

**Request Body** (optional):
```json
{
  "platform": "twitch"  // Optional: specific platform
}
```

**Response**:
```json
{
  "success": true,
  "message": "All platforms reconnecting..."
}
```

## Future Enhancements

### Planned Features
- [ ] YouTube Live chat integration
- [ ] Kick.com emoji support
- [ ] Twitch emote rendering
- [ ] Message filtering and moderation
- [ ] User reputation/ranking system
- [ ] Text-to-speech for important messages
- [ ] Chat command support (!commands)
- [ ] Message reactions and highlighting
- [ ] Multi-language support
- [ ] Custom CSS themes for browser source
- [ ] Redis support for message persistence
- [ ] Database logging for analytics
- [ ] Chat statistics and metrics
- [ ] Admin dashboard for moderation

### Platform Improvements
- Enhanced TikTok Live integration (requires API access)
- Support for Kick.com badges and emotes
- Twitch bit/cheer animations
- Platform-specific message features

## Contributing

When contributing to the chat aggregator:

1. Follow existing code style
2. Add tests for new features
3. Update this documentation
4. Test with multiple platforms
5. Ensure backward compatibility

## License

Part of the I AM Network project. See main project LICENSE for details.

## Support

For issues or questions:
1. Check this README
2. Review server logs for errors
3. Test with API endpoints
4. Check platform API documentation
5. Open an issue with details

## Credits

Built with:
- **WebSocket (ws)**: Real-time communication
- **Framer Motion**: Smooth animations
- **React Icons**: Platform icons
- **Tailwind CSS**: Styling
- **Express**: Backend API
- **TypeScript**: Type safety

Platform integrations:
- **Kick.com**: Pusher WebSocket API
- **Twitch**: IRC WebSocket API
- **TikTok**: TikTok Live API (placeholder)
