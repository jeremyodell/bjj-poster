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

// Re-export repository classes (for testing/DI)
export { TemplateRepository } from './repositories/template-repository.js';

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

export const db = {
  templates: new TemplateRepository(dynamoClient),
  // Add more repositories as they're implemented:
  // users: new UserRepository(dynamoClient),
  // posters: new PosterRepository(dynamoClient),
};
