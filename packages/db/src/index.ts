/**
 * @bjj-poster/db - Database access layer
 *
 * This package provides:
 * - Entity types (Template, User, Poster, etc.)
 * - Repositories for data access
 * - Pre-configured `db` facade for easy access
 *
 * Usage in handlers:
 *   import { db } from '@bjj-poster/db';
 *   const templates = await db.templates.list();
 */

// Re-export entity types
export type {
  Template,
  TemplateItem,
  TemplateCategory,
  CreateTemplateInput,
} from './entities/template.js';

export type {
  User,
  UserItem,
  SubscriptionTier,
  UpdateSubscriptionInput,
} from './entities/user.js';

export type {
  WebhookEvent,
  WebhookEventItem,
} from './entities/webhook-event.js';

export type {
  Poster,
  PosterItem,
  BeltRank,
  PosterStatus,
  CreatePosterInput,
} from './entities/poster.js';

// Re-export repository classes (for testing/DI)
export { TemplateRepository } from './repositories/template-repository.js';
export { UserRepository } from './repositories/user-repository.js';
export { WebhookEventRepository } from './repositories/webhook-event-repository.js';
export { RateLimitRepository } from './repositories/rate-limit-repository.js';
export { PosterRepository } from './repositories/poster-repository.js';

// Re-export client and config
export { dynamoClient } from './client.js';
export { TABLE_NAME, GSI_NAMES } from './config.js';

// -----------------------------------------------------
// DB Facade - Pre-instantiated repositories
// -----------------------------------------------------
// This is the primary way handlers should access the database.
// It provides a clean API without needing to manage instantiation.

import { dynamoClient } from './client.js';
import { TemplateRepository } from './repositories/template-repository.js';
import { UserRepository } from './repositories/user-repository.js';
import { WebhookEventRepository } from './repositories/webhook-event-repository.js';
import { RateLimitRepository } from './repositories/rate-limit-repository.js';
import { PosterRepository } from './repositories/poster-repository.js';

export const db = {
  templates: new TemplateRepository(dynamoClient),
  users: new UserRepository(dynamoClient),
  webhookEvents: new WebhookEventRepository(dynamoClient),
  rateLimits: new RateLimitRepository(dynamoClient),
  posters: new PosterRepository(dynamoClient),
};
