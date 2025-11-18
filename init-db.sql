-- Initialize database schema for The I AM Network
-- Run this in Railway PostgreSQL database console

CREATE TABLE IF NOT EXISTS episodes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  participants TEXT[] NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  episode_start_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS turns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id VARCHAR NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  type VARCHAR(20) NOT NULL DEFAULT 'ai',
  is_highlight BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  llm_model TEXT NOT NULL,
  llm_provider TEXT NOT NULL,
  temperature TEXT NOT NULL DEFAULT '0.7',
  role TEXT NOT NULL,
  voice_provider TEXT,
  voice_id TEXT,
  disfluency_level VARCHAR(10) NOT NULL DEFAULT 'none',
  avatar_image_url TEXT NOT NULL,
  aura_color TEXT NOT NULL,
  accent_tone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  reference TEXT NOT NULL,
  embedding TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preshow_prep (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id VARCHAR REFERENCES episodes(id) ON DELETE CASCADE,
  theme TEXT NOT NULL,
  segment_structure JSONB NOT NULL,
  host_questions JSONB NOT NULL,
  ai_prompts JSONB NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zero_knowledge (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  heading TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  text TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_alerts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(20) NOT NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episode_clips (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id VARCHAR NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  label TEXT,
  timestamp_seconds INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create default episode for live streaming
INSERT INTO episodes (title, theme, participants, status)
VALUES (
  'Live Episode',
  'Divine Consciousness & The I AM Within',
  ARRAY['zero', 'm7', 'synq'],
  'live'
) ON CONFLICT DO NOTHING;
