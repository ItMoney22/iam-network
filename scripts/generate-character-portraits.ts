/**
 * Generate realistic character portraits using Replicate FLUX-1.1-Pro
 * Run with: tsx scripts/generate-character-portraits.ts
 */

import Replicate from 'replicate';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

interface CharacterPrompt {
  id: string;
  name: string;
  filename: string;
  prompt: string;
}

const characterPrompts: CharacterPrompt[] = [
  {
    id: 'marcus',
    name: 'Marcus Chen',
    filename: 'Marcus_wise_director_portrait',
    prompt: 'Professional headshot portrait of an Asian American man in his mid-40s, warm and thoughtful expression, gentle smile. Short dark hair with subtle grey touches at temples, clean-shaven, wearing a charcoal grey blazer over navy blue shirt. Calm, intelligent eyes that convey wisdom and attentiveness. Studio lighting with soft shadows, neutral grey background slightly out of focus. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, editorial quality. Natural skin tones, professional headshot photography style.',
  },
  {
    id: 'elena',
    name: 'Elena Rodriguez',
    filename: 'Elena_skeptic_portrait',
    prompt: 'Professional headshot portrait of a Latina woman in her early 30s, confident and direct expression, slight knowing smirk. Dark wavy hair pulled back, sharp intelligent eyes, wearing a black leather jacket over white t-shirt. Strong eyebrows, natural makeup emphasizing eyes. Direct gaze that challenges the viewer. Studio lighting with dramatic shadows, urban grey background. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, editorial quality. Warm skin tones, professional headshot photography with edge.',
  },
  {
    id: 'sophia',
    name: 'Sophia Williams',
    filename: 'Sophia_healer_portrait',
    prompt: 'Professional headshot portrait of an African American woman in her late 30s, warm compassionate smile, gentle caring eyes. Natural curly hair in a professional style, wearing a soft sage green blouse. Nurturing expression that makes people feel safe and heard. Subtle jewelry, natural makeup highlighting warm brown skin tones. Soft studio lighting creating gentle shadows, warm beige background. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, therapeutic professional quality. Approachable and calming presence.',
  },
  {
    id: 'james',
    name: 'James Park',
    filename: 'James_conspiracy_hunter_portrait',
    prompt: 'Professional headshot portrait of a Korean American man in his early 30s, curious and analytical expression, slight excited smile as if just made a connection. Black-framed glasses, stylish short black hair, clean-shaven, wearing a deep blue button-down shirt. Eyes that seem to be constantly processing information. Modern studio lighting, tech-inspired cool grey background with subtle geometric patterns. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, contemporary professional quality. Natural skin tones, intellectual and approachable.',
  },
  {
    id: 'destiny',
    name: 'Destiny Johnson',
    filename: 'Destiny_motivation_portrait',
    prompt: 'Professional headshot portrait of a Black woman in her late 20s, bright energetic smile showing genuine joy, powerful confident presence. Natural hair in beautiful braids styled professionally, wearing a vibrant purple blazer. Radiant expression that uplifts, eyes full of encouragement and strength. Bold but professional makeup, glowing rich dark skin. Dynamic studio lighting with warm highlights, energetic warm orange background gradient. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, inspirational quality. Powerful positive energy.',
  },
  {
    id: 'nathan',
    name: 'Nathan Brooks',
    filename: 'Nathan_news_oracle_portrait',
    prompt: 'Professional headshot portrait of a white man in his mid-40s, thoughtful analytical expression, slight academic smile. Salt-and-pepper hair neatly styled, beard with grey streaks, wearing wire-rimmed glasses and a tweed blazer over white oxford shirt. Intelligent eyes that convey both knowledge and accessibility. Classic studio lighting, sophisticated library-inspired background with subtle book spines out of focus. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, academic professional quality. Distinguished but approachable presence.',
  },
  {
    id: 'rachel',
    name: 'Rachel Goldman',
    filename: 'Rachel_scripture_monk_portrait',
    prompt: 'Professional headshot portrait of a Jewish woman in her early 40s, warm scholarly smile, eyes that convey both wisdom and warmth. Dark brown hair with subtle auburn highlights, wearing a deep burgundy blouse with elegant Star of David necklace. Gentle lines around eyes showing years of study and compassion. Scholarly yet approachable demeanor. Soft warm studio lighting, warm amber background suggesting ancient texts. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, scholarly professional quality. Reverent and welcoming presence.',
  },
  {
    id: 'victor',
    name: 'Victor Okafor',
    filename: 'Victor_wealth_architect_portrait',
    prompt: 'Professional headshot portrait of a Nigerian man in his late 30s, confident strategic smile, eyes that see opportunities. Clean-shaven head, well-groomed short beard, wearing an impeccably tailored navy suit with gold tie. Sophisticated and strategic expression, radiating abundance mindset. Rich dark skin with professional lighting highlighting facial structure. Luxurious studio lighting with subtle golden highlights, deep emerald green background suggesting prosperity. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, executive professional quality. Strategic and generous presence.',
  },
  {
    id: 'maya',
    name: 'Maya Patel',
    filename: 'Maya_style_icon_portrait',
    prompt: 'Professional headshot portrait of an Indian American woman in her late 20s, creative confident expression, bold artistic smile. Long dark hair with subtle purple highlights, wearing a unique hand-designed geometric patterned top in vibrant colors. Expressive eyes with creative makeup featuring subtle traditional and modern elements. Nose piercing, statement earrings. Dynamic studio lighting with colorful gels creating artistic shadows, creative magenta and teal gradient background. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, fashion editorial quality. Bold creative energy.',
  },
  {
    id: 'isaac',
    name: 'Isaac Morrison',
    filename: 'Isaac_future_prophet_portrait',
    prompt: 'Professional headshot portrait of a white man in his early 40s, contemplative visionary expression, eyes looking slightly upward as if seeing future possibilities. Light brown hair slightly longer and thoughtfully tousled, clean-shaven, wearing minimalist black turtleneck. Thoughtful expression that sees beyond current limitations. Modern minimalist studio lighting with cool tones, silver-grey gradient background suggesting future horizons. Shot with 85mm lens, shallow depth of field. Photorealistic, high resolution, contemporary thought leader quality. Visionary and contemplative presence.',
  },
];

async function generatePortrait(character: CharacterPrompt): Promise<string> {
  console.log(`\n🎨 Generating portrait for ${character.name}...`);

  try {
    const output = await replicate.run(
      "black-forest-labs/flux-1.1-pro" as any,
      {
        input: {
          prompt: character.prompt,
          aspect_ratio: "3:4",
          output_format: "png",
          output_quality: 90,
          safety_tolerance: 2,
          prompt_upsampling: true,
        },
      }
    );

    // Output is a URL to the generated image
    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log(`✅ Generated: ${imageUrl}`);

    return imageUrl as string;
  } catch (error) {
    console.error(`❌ Failed to generate ${character.name}:`, error);
    throw error;
  }
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  console.log(`⬇️  Downloading to ${filepath}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  writeFileSync(filepath, Buffer.from(buffer));
  console.log(`✅ Saved successfully`);
}

async function generateAllPortraits() {
  if (!process.env.REPLICATE_API_KEY) {
    console.error('❌ REPLICATE_API_KEY environment variable is not set');
    console.error('   Get your API key from: https://replicate.com/account/api-tokens');
    process.exit(1);
  }

  console.log('🚀 Starting character portrait generation...');
  console.log(`   Generating ${characterPrompts.length} portraits using FLUX-1.1-Pro\n`);

  // Create output directory
  const outputDir = join(process.cwd(), 'client', 'src', 'assets', 'generated_images');
  mkdirSync(outputDir, { recursive: true });
  console.log(`📁 Output directory: ${outputDir}\n`);

  const results: Array<{ character: string; url: string; filename: string }> = [];
  let successCount = 0;
  let failCount = 0;

  for (const character of characterPrompts) {
    try {
      // Generate image
      const imageUrl = await generatePortrait(character);

      // Generate unique hash for filename
      const hash = Math.random().toString(36).substring(2, 10);
      const filename = `${character.filename}_${hash}.png`;
      const filepath = join(outputDir, filename);

      // Download and save
      await downloadImage(imageUrl, filepath);

      results.push({
        character: character.name,
        url: imageUrl,
        filename,
      });

      successCount++;

      // Rate limiting: wait 2 seconds between requests
      if (character !== characterPrompts[characterPrompts.length - 1]) {
        console.log('⏳ Waiting 2 seconds before next generation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`❌ Failed for ${character.name}`);
      failCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Portrait generation complete!');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${successCount}/${characterPrompts.length}`);
  console.log(`❌ Failed: ${failCount}/${characterPrompts.length}`);

  if (results.length > 0) {
    console.log('\n📸 Generated portraits:');
    results.forEach(r => {
      console.log(`   ${r.character}: ${r.filename}`);
    });

    console.log('\n📝 Next steps:');
    console.log('   1. Review generated images in client/src/assets/generated_images/');
    console.log('   2. Update avatar imports in studio-live.tsx if filenames changed');
    console.log('   3. Commit and push the new character portraits');
    console.log('   4. Deploy to Railway');
  }

  if (failCount > 0) {
    console.log('\n⚠️  Some portraits failed to generate. Re-run this script to retry.');
    process.exit(1);
  }
}

generateAllPortraits();
