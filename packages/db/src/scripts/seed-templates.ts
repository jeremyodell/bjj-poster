/**
 * Seed Templates Script
 *
 * Populates DynamoDB with sample templates for development and testing.
 * Idempotent - checks if templates exist before inserting.
 *
 * Usage:
 *   USE_LOCALSTACK=true pnpm seed:templates
 */

import { dynamoClient } from '../client.js';
import { TemplateRepository } from '../repositories/template-repository.js';
import type { CreateTemplateInput } from '../entities/template.js';

const templateRepository = new TemplateRepository(dynamoClient);

const sampleTemplates: CreateTemplateInput[] = [
  // Tournament templates
  {
    name: 'Tournament Classic',
    description: 'Clean, professional design for tournament announcements',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/tournament-classic.jpg',
    isPremium: false,
  },
  {
    name: 'Tournament Bold',
    description: 'High-impact design with bold typography',
    category: 'tournament',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/tournament-bold.jpg',
    isPremium: true,
  },
  // Promotion templates
  {
    name: 'Belt Promotion',
    description: 'Celebrate belt promotions with style',
    category: 'promotion',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/belt-promotion.jpg',
    isPremium: false,
  },
  {
    name: 'Stripe Ceremony',
    description: 'Mark stripe achievements',
    category: 'promotion',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/stripe-ceremony.jpg',
    isPremium: false,
  },
  // Gym templates
  {
    name: 'Gym Spotlight',
    description: 'Feature your gym and athletes',
    category: 'gym',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/gym-spotlight.jpg',
    isPremium: false,
  },
  {
    name: 'Academy Premium',
    description: 'Premium design for academy promotions',
    category: 'gym',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/academy-premium.jpg',
    isPremium: true,
  },
  // Social templates
  {
    name: 'Social Share',
    description: 'Optimized for social media sharing',
    category: 'social',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/social-share.jpg',
    isPremium: false,
  },
  {
    name: 'Instagram Story',
    description: 'Vertical format for Instagram stories',
    category: 'social',
    thumbnailUrl: 'https://cdn.bjjposter.app/templates/instagram-story.jpg',
    isPremium: true,
  },
];

async function seedTemplates(): Promise<void> {
  console.log('Seeding templates...\n');

  // Check existing templates
  const existingTemplates = await templateRepository.list();
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  let created = 0;
  let skipped = 0;

  for (const template of sampleTemplates) {
    if (existingNames.has(template.name)) {
      console.log(`  SKIP: ${template.name} (already exists)`);
      skipped++;
      continue;
    }

    await templateRepository.create(template);
    console.log(`  CREATE: ${template.name}`);
    created++;
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
}

seedTemplates().catch((error) => {
  console.error('Failed to seed templates:', error);
  process.exit(1);
});
