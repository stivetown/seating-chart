#!/usr/bin/env node

/**
 * Seed script for Vibe Deck database
 * Run with: node scripts/seed-data.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedVibes() {
  console.log('🌱 Seeding vibes...');

  const vibes = [
    {
      id: 'cozy-creative',
      title: 'Cozy Creative',
      emoji: '🎨',
      tags: ['energy:low', 'setting:home', 'category:creative'],
    },
    {
      id: 'chill-social',
      title: 'Chill Social',
      emoji: '☕',
      tags: ['energy:medium', 'setting:home', 'category:social'],
    },
    {
      id: 'lowkey-game',
      title: 'Lowkey Game',
      emoji: '🎮',
      tags: ['energy:low', 'setting:home', 'category:gaming'],
    },
    {
      id: 'mini-adventure',
      title: 'Mini Adventure',
      emoji: '🗺️',
      tags: ['energy:high', 'setting:outdoor', 'category:adventure'],
    },
    {
      id: 'talk-taste',
      title: 'Talk & Taste',
      emoji: '🍷',
      tags: ['energy:medium', 'setting:outdoor', 'category:social'],
    },
    {
      id: 'music-mingle',
      title: 'Music Mingle',
      emoji: '🎵',
      tags: ['energy:high', 'setting:outdoor', 'category:social'],
    },
    {
      id: 'active-outdoor',
      title: 'Active Outdoor',
      emoji: '🏃',
      tags: ['energy:high', 'setting:outdoor', 'category:active'],
    },
    {
      id: 'focused-build',
      title: 'Focused Build',
      emoji: '🔨',
      tags: ['energy:medium', 'setting:home', 'category:creative'],
    },
    {
      id: 'culture-hop',
      title: 'Culture Hop',
      emoji: '🏛️',
      tags: ['energy:medium', 'setting:outdoor', 'category:cultural'],
    },
    {
      id: 'late-night',
      title: 'Late Night',
      emoji: '🌙',
      tags: ['energy:low', 'setting:home', 'category:social'],
    },
  ];

  const { error } = await supabase.from('vibes').upsert(vibes);

  if (error) {
    console.error('❌ Error seeding vibes:', error);
    return false;
  }

  console.log('✅ Vibes seeded successfully');
  return true;
}

async function seedRecommendations() {
  console.log('🌱 Seeding recommendations...');

  const recommendations = [
    {
      vibe_combo_key: 'cozy-creative|talk-taste',
      items: [
        {
          title: 'Paint & Sip Night',
          desc: 'Grab some canvases and wine, create art while chatting',
        },
        {
          title: 'Craft Cocktail Workshop',
          desc: 'Learn to make fancy drinks at home with friends',
        },
        {
          title: 'Indie Film Screening',
          desc: 'Watch thought-provoking films and discuss over snacks',
        },
        {
          title: 'DIY Terrarium Building',
          desc: 'Create mini ecosystems while sharing stories',
        },
      ],
    },
    {
      vibe_combo_key: 'chill-social|lowkey-game',
      items: [
        {
          title: 'Board Game Cafe',
          desc: 'Cozy spot with coffee and strategy games',
        },
        {
          title: 'Video Game Tournament',
          desc: 'Friendly competition with snacks and drinks',
        },
        {
          title: 'Puzzle Night',
          desc: 'Work together on jigsaw puzzles and brain teasers',
        },
        {
          title: 'Trivia Night',
          desc: 'Test your knowledge over drinks and appetizers',
        },
      ],
    },
    {
      vibe_combo_key: 'mini-adventure|active-outdoor',
      items: [
        {
          title: 'Hiking Trail Discovery',
          desc: 'Explore new trails and scenic viewpoints',
        },
        {
          title: 'Beach Volleyball & BBQ',
          desc: 'Active games followed by beachside grilling',
        },
        {
          title: 'Bike Tour & Food Trucks',
          desc: 'Cycle to different food truck locations',
        },
        {
          title: 'Rock Climbing & Brewery',
          desc: 'Indoor climbing followed by craft beer tasting',
        },
      ],
    },
    {
      vibe_combo_key: 'music-mingle|culture-hop',
      items: [
        {
          title: 'Live Music Venue Crawl',
          desc: 'Hit 2-3 venues with different music styles',
        },
        {
          title: 'Museum After Dark',
          desc: 'Evening museum visit with live music and drinks',
        },
        {
          title: 'Street Art Walking Tour',
          desc: 'Discover murals and graffiti with local music',
        },
        {
          title: 'Jazz Club & Gallery',
          desc: 'Intimate music venue with rotating art exhibits',
        },
      ],
    },
    {
      vibe_combo_key: 'focused-build|late-night',
      items: [
        {
          title: 'Midnight Coding Session',
          desc: 'Collaborative programming project with snacks',
        },
        {
          title: 'DIY Electronics Workshop',
          desc: 'Build something cool together late into the night',
        },
        {
          title: '3D Printing & Design',
          desc: 'Create and print custom objects while chatting',
        },
        {
          title: 'Game Development Jam',
          desc: 'Build a simple game together over coffee',
        },
      ],
    },
    {
      vibe_combo_key: 'talk-taste|culture-hop',
      items: [
        {
          title: 'Wine Tasting & Art Gallery',
          desc: 'Sip wines while discussing contemporary art',
        },
        {
          title: 'Food Tour & History Walk',
          desc: 'Sample local cuisine while learning city history',
        },
        {
          title: 'Cooking Class & Market Tour',
          desc: 'Shop for ingredients then cook together',
        },
        {
          title: 'Craft Beer & Local History',
          desc: 'Brewery tour with historical neighborhood walk',
        },
      ],
    },
  ];

  const { error } = await supabase
    .from('recommendations')
    .upsert(recommendations);

  if (error) {
    console.error('❌ Error seeding recommendations:', error);
    return false;
  }

  console.log('✅ Recommendations seeded successfully');
  return true;
}

async function main() {
  console.log('🚀 Starting Vibe Deck database seeding...\n');

  try {
    const vibesSuccess = await seedVibes();
    const recommendationsSuccess = await seedRecommendations();

    if (vibesSuccess && recommendationsSuccess) {
      console.log('\n🎉 Database seeding completed successfully!');
    } else {
      console.log('\n❌ Database seeding failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
