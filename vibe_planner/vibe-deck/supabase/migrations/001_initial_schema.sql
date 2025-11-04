-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_user_id UUID NULL,
    invite_token TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('active', 'matched', 'expired')) DEFAULT 'active',
    location_lat NUMERIC NULL,
    location_lng NUMERIC NULL,
    group_size_hint INT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '48 hours'
);

-- Create participants table
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    display_name TEXT NULL,
    device_fingerprint TEXT NULL,
    is_host BOOLEAN DEFAULT FALSE,
    state TEXT CHECK (state IN ('joined', 'swiping', 'completed')) DEFAULT 'joined',
    top_vibes JSONB NULL,
    raw_swipes JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vibes table
CREATE TABLE vibes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    emoji TEXT NOT NULL,
    tags JSONB NOT NULL
);

-- Create recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vibe_combo_key TEXT NOT NULL,
    items JSONB NOT NULL
);

-- Create matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    group_vibe JSONB NOT NULL,
    suggestions JSONB NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_sessions_invite_token ON sessions(invite_token);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_participants_session_id ON participants(session_id);
CREATE INDEX idx_participants_device_fingerprint ON participants(device_fingerprint);
CREATE INDEX idx_participants_state ON participants(state);
CREATE INDEX idx_vibes_tags ON vibes USING GIN(tags);
CREATE INDEX idx_recommendations_vibe_combo_key ON recommendations(vibe_combo_key);
CREATE INDEX idx_matches_session_id ON matches(session_id);
CREATE INDEX idx_matches_computed_at ON matches(computed_at);

-- Disable Row Level Security for development
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE vibes DISABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;

-- Insert seed vibes data
INSERT INTO vibes (id, title, emoji, tags) VALUES
('cozy-creative', 'Cozy Creative', '🎨', '["energy:low", "setting:home", "category:creative"]'),
('chill-social', 'Chill Social', '☕', '["energy:medium", "setting:home", "category:social"]'),
('lowkey-game', 'Lowkey Game', '🎮', '["energy:low", "setting:home", "category:gaming"]'),
('mini-adventure', 'Mini Adventure', '🗺️', '["energy:high", "setting:outdoor", "category:adventure"]'),
('talk-taste', 'Talk & Taste', '🍷', '["energy:medium", "setting:outdoor", "category:social"]'),
('music-mingle', 'Music Mingle', '🎵', '["energy:high", "setting:outdoor", "category:social"]'),
('active-outdoor', 'Active Outdoor', '🏃', '["energy:high", "setting:outdoor", "category:active"]'),
('focused-build', 'Focused Build', '🔨', '["energy:medium", "setting:home", "category:creative"]'),
('culture-hop', 'Culture Hop', '🏛️', '["energy:medium", "setting:outdoor", "category:cultural"]'),
('late-night', 'Late Night', '🌙', '["energy:low", "setting:home", "category:social"]');

-- Insert seed recommendations data
INSERT INTO recommendations (vibe_combo_key, items) VALUES
('cozy-creative|talk-taste', '[
    {"title": "Paint & Sip Night", "desc": "Grab some canvases and wine, create art while chatting", "url": null},
    {"title": "Craft Cocktail Workshop", "desc": "Learn to make fancy drinks at home with friends", "url": null},
    {"title": "Indie Film Screening", "desc": "Watch thought-provoking films and discuss over snacks", "url": null},
    {"title": "DIY Terrarium Building", "desc": "Create mini ecosystems while sharing stories", "url": null}
]'),

('chill-social|lowkey-game', '[
    {"title": "Board Game Cafe", "desc": "Cozy spot with coffee and strategy games", "url": null},
    {"title": "Video Game Tournament", "desc": "Friendly competition with snacks and drinks", "url": null},
    {"title": "Puzzle Night", "desc": "Work together on jigsaw puzzles and brain teasers", "url": null},
    {"title": "Trivia Night", "desc": "Test your knowledge over drinks and appetizers", "url": null}
]'),

('mini-adventure|active-outdoor', '[
    {"title": "Hiking Trail Discovery", "desc": "Explore new trails and scenic viewpoints", "url": null},
    {"title": "Beach Volleyball & BBQ", "desc": "Active games followed by beachside grilling", "url": null},
    {"title": "Bike Tour & Food Trucks", "desc": "Cycle to different food truck locations", "url": null},
    {"title": "Rock Climbing & Brewery", "desc": "Indoor climbing followed by craft beer tasting", "url": null}
]'),

('music-mingle|culture-hop', '[
    {"title": "Live Music Venue Crawl", "desc": "Hit 2-3 venues with different music styles", "url": null},
    {"title": "Museum After Dark", "desc": "Evening museum visit with live music and drinks", "url": null},
    {"title": "Street Art Walking Tour", "desc": "Discover murals and graffiti with local music", "url": null},
    {"title": "Jazz Club & Gallery", "desc": "Intimate music venue with rotating art exhibits", "url": null}
]'),

('focused-build|late-night', '[
    {"title": "Midnight Coding Session", "desc": "Collaborative programming project with snacks", "url": null},
    {"title": "DIY Electronics Workshop", "desc": "Build something cool together late into the night", "url": null},
    {"title": "3D Printing & Design", "desc": "Create and print custom objects while chatting", "url": null},
    {"title": "Game Development Jam", "desc": "Build a simple game together over coffee", "url": null}
]'),

('talk-taste|culture-hop', '[
    {"title": "Wine Tasting & Art Gallery", "desc": "Sip wines while discussing contemporary art", "url": null},
    {"title": "Food Tour & History Walk", "desc": "Sample local cuisine while learning city history", "url": null},
    {"title": "Cooking Class & Market Tour", "desc": "Shop for ingredients then cook together", "url": null},
    {"title": "Craft Beer & Local History", "desc": "Brewery tour with historical neighborhood walk", "url": null}
]');
