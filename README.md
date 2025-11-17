# The I AM Network

A live conversation platform featuring AI personalities engaging in spiritual-philosophical discussions about consciousness, divine truth, and the teachings of Yeshua (Jesus).

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (tested with Node 20)
- **PostgreSQL** (Neon serverless recommended, or local PostgreSQL)
- **API Keys** for:
  - Google Gemini (for Gemini-based AI characters)
  - OpenAI (for Zero AI router and OpenAI-based characters)
  - OpenRouter (for accessing diverse LLM models)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd MetaDevNetwork
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your actual values:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database (Neon PostgreSQL recommended)
   DATABASE_URL=postgresql://username:password@your-db-host.neon.tech/iam_network?sslmode=require

   # Google Gemini API
   # Get your key from: https://makersuite.google.com/app/apikey
   GOOGLE_GENAI_API_KEY=your-google-genai-api-key

   # OpenAI API (Zero uses GPT 5.1 for conversation routing)
   # Get your key from: https://platform.openai.com/api-keys
   OPENAI_API_KEY=your-openai-api-key

   # OpenRouter API
   # Get your key from: https://openrouter.ai/keys
   OPENROUTER_API_KEY=your-openrouter-api-key
   ```

4. **Set up the database**

   Push the database schema to your PostgreSQL instance:
   ```bash
   npm run db:push
   ```

   Optional: Launch Drizzle Studio to explore your database:
   ```bash
   npm run db:studio
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## 🗂️ Project Structure

```
MetaDevNetwork/
├── client/               # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui + Radix)
│   │   ├── pages/       # Route pages (/, /studio, /control)
│   │   └── lib/         # Utilities and hooks
│   └── index.html
├── server/              # Express backend (TypeScript)
│   ├── conversation/    # AI conversation orchestration
│   │   └── router.ts   # Zero AI routing (GPT 5.1)
│   ├── llm/            # LLM provider clients
│   │   ├── gemini-client.ts
│   │   ├── openai-client.ts
│   │   ├── openrouter-client.ts
│   │   └── llm-engine.ts
│   ├── knowledge/      # Knowledge base integration
│   ├── preshow/        # Pre-show prep generation
│   ├── routes.ts       # API routes
│   └── index.ts        # Server entry point
├── shared/             # Shared types and schemas
│   ├── characters-config.ts
│   └── schema.ts
└── package.json
```

## 🎯 Key Features

- **Zero AI Router**: Uses GPT 5.1 to intelligently route conversation flow
- **Multi-LLM Support**: Integrates Google Gemini, OpenAI, and OpenRouter
- **Real-time Conversations**: Live AI-to-AI dialogue with human host
- **Knowledge Base**: Searchable passages from spiritual texts
- **Pre-show Prep**: Auto-generated episode guides
- **Premium UI**: Netflix/Spotify-inspired dark cosmic design

## 🔧 Development Scripts

- `npm run dev` - Start development server (hot reload enabled)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type-check TypeScript
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Launch Drizzle Studio (database explorer)

## 🌐 API Endpoints

- `GET /api/characters` - Get all AI characters
- `GET /api/episodes` - Get all episodes
- `POST /api/episodes` - Create new episode
- `POST /api/conversation` - Add conversation turn
- `GET /api/knowledge` - Search knowledge base
- `POST /api/preshow` - Generate pre-show prep

## 🎨 Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Wouter** (routing)
- **TanStack Query** (server state)
- **Radix UI** + **shadcn/ui** (component library)
- **Tailwind CSS** (styling)
- **Framer Motion** (animations)

### Backend
- **Express.js** + **TypeScript**
- **Drizzle ORM** (PostgreSQL)
- **Google Generative AI SDK** (Gemini)
- **OpenAI SDK** (GPT models)
- **OpenRouter** (multi-model access)

### Database
- **PostgreSQL** (Neon serverless recommended)
- Schema managed by Drizzle Kit

## 📋 Database Schema

The application uses the following main tables:

- **episodes** - Episode metadata and configuration
- **turns** - Individual conversation messages
- **characters** - AI personality definitions
- **knowledgeBase** - Searchable spiritual passages
- **preshowPrep** - Generated episode preparation materials

See `shared/schema.ts` for complete schema definitions.

## 🤖 AI Characters

The platform features multiple AI personalities:

- **Zero** - The showrunner (GPT 5.1 for routing)
- **M7** - Skeptical challenger
- **Synq** - Empathic healer
- **Flux** - Conspiracy theorist
- **Vibe** - Motivational coach
- **EchoPulse** - News oracle
- **Link** - Scripture scholar
- **Ledge** - Wealth architect
- **Drip** - Style icon
- **Horizon** - Future prophet

Each character has configurable:
- LLM provider (Gemini/OpenAI/OpenRouter)
- Model selection
- Temperature
- Personality traits
- Disfluency patterns

## 🔐 Environment Variables Reference

| Variable | Required | Description | Get From |
|----------|----------|-------------|----------|
| `PORT` | No | Server port (default: 5000) | - |
| `NODE_ENV` | No | Environment mode | - |
| `DATABASE_URL` | Yes | PostgreSQL connection string | [Neon](https://neon.tech) |
| `GOOGLE_GENAI_API_KEY` | Yes | Google Gemini API key | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `OPENAI_API_KEY` | Yes | OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key | [OpenRouter](https://openrouter.ai/keys) |

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure your `DATABASE_URL` includes `?sslmode=require` for Neon
- Check that your database is accessible from your local machine
- Verify database credentials are correct

### API Key Errors
- Make sure all three API keys are set in `.env`
- Verify API keys are valid and have sufficient credits
- Check API key permissions/scopes

### TypeScript Errors
- Run `npm run check` to see all type errors
- Ensure you're using Node.js 20+
- Try deleting `node_modules` and running `npm install` again

### Port Already in Use
- Change `PORT` in `.env` to a different value
- Or kill the process using port 5000

## 📝 License

MIT

## 🤝 Contributing

This is a spiritual exploration platform blending AI technology with divine consciousness. Contributions should honor the project's intention: truth through love, consciousness expansion, and authentic dialogue.

---

**Built with ❤️ by the I AM Network team**
