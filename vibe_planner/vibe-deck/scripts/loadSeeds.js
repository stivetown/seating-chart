#!/usr/bin/env node

const { readFileSync } = require('fs');
const { join } = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in environment');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function loadSeeds() {
  console.log('🌱 Loading seed data into Supabase...\n');

  // Check if service key is available
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.warn('⚠️  SUPABASE_SERVICE_KEY not set. Skipping seed data load.');
    console.log('   Set SUPABASE_SERVICE_KEY in your .env.local to load seed data.');
    process.exit(0);
  }

  try {
    // Read JSON files
    console.log('📖 Reading seed files...');
    const vibesPath = join(__dirname, '../data/vibes.json');
    const recommendationsPath = join(__dirname, '../data/recommendations.json');
    
    const vibesData = JSON.parse(readFileSync(vibesPath, 'utf8'));
    const recommendationsData = JSON.parse(readFileSync(recommendationsPath, 'utf8'));
    
    console.log(`   Found ${vibesData.length} vibes`);
    console.log(`   Found ${recommendationsData.length} recommendation combinations\n`);

    // Load vibes
    console.log('🎨 Upserting vibes...');
    const { error: vibesError } = await supabaseAdmin
      .from('vibes')
      .upsert(
        vibesData.map(vibe => ({
          id: vibe.id,
          title: vibe.title,
          emoji: vibe.emoji,
          tags: vibe.tags,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: 'id',
        }
      );

    if (vibesError) {
      console.error('❌ Error upserting vibes:', vibesError);
      process.exit(1);
    }
    console.log(`   ✅ Upserted ${vibesData.length} vibes`);

    // Load recommendations
    console.log('💡 Upserting recommendations...');
    const { error: recommendationsError } = await supabaseAdmin
      .from('recommendations')
      .upsert(
        recommendationsData.map(rec => ({
          vibe_combo_key: rec.vibe_combo_key,
          items: rec.items,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        {
          onConflict: 'vibe_combo_key',
        }
      );

    if (recommendationsError) {
      console.error('❌ Error upserting recommendations:', recommendationsError);
      process.exit(1);
    }
    console.log(`   ✅ Upserted ${recommendationsData.length} recommendation combinations`);

    // Count total items
    const totalItems = recommendationsData.reduce((sum, rec) => sum + rec.items.length, 0);
    console.log(`   📊 Total recommendation items: ${totalItems}\n`);

    console.log('🎉 Seed data loaded successfully!');
    console.log(`   • ${vibesData.length} vibes`);
    console.log(`   • ${recommendationsData.length} recommendation combinations`);
    console.log(`   • ${totalItems} total recommendation items`);

  } catch (error) {
    console.error('❌ Error loading seed data:', error);
    process.exit(1);
  }
}

// Run the loader
loadSeeds().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
