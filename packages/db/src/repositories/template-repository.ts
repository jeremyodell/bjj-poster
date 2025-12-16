/**
 * Template Repository
 *
 * Handles all DynamoDB operations for templates.
 * This layer:
 * - Knows about DynamoDB key structure
 * - Converts between DynamoDB items and domain entities
 * - Encapsulates query logic
 *
 * The handler layer should NEVER import DynamoDB directly.
 */

import { QueryCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';
import { TABLE_NAME } from '../config.js';
import type {
  Template,
  TemplateItem,
  TemplateCategory,
  CreateTemplateInput,
} from '../entities/template.js';

export class TemplateRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * List all templates, optionally filtered by category
   */
  async list(category?: TemplateCategory): Promise<Template[]> {
    const params: {
      TableName: string;
      KeyConditionExpression: string;
      ExpressionAttributeValues: Record<string, string>;
    } = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'TEMPLATE',
      },
    };

    // If category provided, filter by SK prefix
    if (category) {
      params.KeyConditionExpression += ' AND begins_with(SK, :skPrefix)';
      params.ExpressionAttributeValues[':skPrefix'] = `${category}#`;
    }

    const result = await this.client.send(new QueryCommand(params));
    const items = (result.Items || []) as TemplateItem[];

    return items.map((item) => this.toEntity(item));
  }

  /**
   * Get a single template by ID
   */
  async getById(
    templateId: string,
    category: TemplateCategory
  ): Promise<Template | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: 'TEMPLATE',
          SK: `${category}#${templateId}`,
        },
      })
    );

    if (!result.Item) {
      return null;
    }

    return this.toEntity(result.Item as TemplateItem);
  }

  /**
   * Create a new template
   */
  async create(input: CreateTemplateInput): Promise<Template> {
    const templateId = uuid();
    const now = new Date().toISOString();

    const item: TemplateItem = {
      PK: 'TEMPLATE',
      SK: `${input.category}#${templateId}`,
      entityType: 'TEMPLATE',
      templateId,
      name: input.name,
      description: input.description,
      category: input.category,
      thumbnailUrl: input.thumbnailUrl,
      isPremium: input.isPremium,
      createdAt: now,
    };

    await this.client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: 'attribute_not_exists(PK)',
      })
    );

    return this.toEntity(item);
  }

  /**
   * Convert DynamoDB item to public entity
   * Strips internal fields (PK, SK, entityType)
   */
  private toEntity(item: TemplateItem): Template {
    return {
      templateId: item.templateId,
      name: item.name,
      description: item.description,
      category: item.category,
      thumbnailUrl: item.thumbnailUrl,
      isPremium: item.isPremium,
      createdAt: item.createdAt,
    };
  }
}
