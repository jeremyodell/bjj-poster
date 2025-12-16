/**
 * Template entity types
 *
 * This file defines the shape of Template data.
 * No database logic here - just pure TypeScript types.
 */

/** Template categories for poster styles */
export type TemplateCategory = 'tournament' | 'promotion' | 'gym' | 'social';

/** Public template data returned to clients */
export interface Template {
  templateId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  isPremium: boolean;
  createdAt: string;
}

/** DynamoDB item shape (includes key structure) */
export interface TemplateItem {
  PK: string; // TEMPLATE
  SK: string; // <category>#<templateId>
  entityType: 'TEMPLATE';
  templateId: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  isPremium: boolean;
  createdAt: string;
}

/** Input for creating a new template */
export interface CreateTemplateInput {
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnailUrl: string;
  isPremium: boolean;
}
