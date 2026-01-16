/**
 * Poster Repository
 *
 * Handles all DynamoDB operations for posters.
 */

import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { TABLE_NAME } from '../config.js';
import type { Poster, PosterItem, CreatePosterInput } from '../entities/poster.js';

export class PosterRepository {
  constructor(private readonly client: DynamoDBDocumentClient) {}

  /**
   * Create a new poster
   */
  async create(input: CreatePosterInput): Promise<Poster> {
    const now = new Date().toISOString();
    const posterId = `pstr_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    const item: PosterItem = {
      PK: `USER#${input.userId}`,
      SK: `POSTER#${now}#${posterId}`,
      entityType: 'POSTER',
      posterId,
      userId: input.userId,
      templateId: input.templateId,
      status: 'completed',
      athleteName: input.athleteName,
      teamName: input.teamName,
      beltRank: input.beltRank,
      tournamentName: input.tournamentName,
      tournamentDate: input.tournamentDate,
      tournamentLocation: input.tournamentLocation,
      achievement: input.achievement,
      imageKey: input.imageKey,
      thumbnailKey: input.thumbnailKey,
      uploadKey: input.uploadKey,
      createdAt: now,
      updatedAt: now,
    };

    await this.client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return this.toEntity(item);
  }

  /**
   * Get all posters for a user (newest first)
   */
  async getByUserId(userId: string, limit = 50): Promise<Poster[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'POSTER#',
        },
        ScanIndexForward: false, // Newest first
        Limit: limit,
      })
    );

    return (result.Items || []).map((item) => this.toEntity(item as PosterItem));
  }

  /**
   * Count posters for a user in the current month
   */
  async countForCurrentMonth(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const result = await this.client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND SK >= :sk',
        FilterExpression: 'entityType = :entityType',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `POSTER#${startOfMonth.toISOString()}`,
          ':entityType': 'POSTER',
        },
        Select: 'COUNT',
      })
    );

    return result.Count || 0;
  }

  private toEntity(item: PosterItem): Poster {
    return {
      posterId: item.posterId,
      userId: item.userId,
      templateId: item.templateId,
      status: item.status,
      athleteName: item.athleteName,
      teamName: item.teamName,
      beltRank: item.beltRank,
      tournamentName: item.tournamentName,
      tournamentDate: item.tournamentDate,
      tournamentLocation: item.tournamentLocation,
      achievement: item.achievement,
      imageKey: item.imageKey,
      thumbnailKey: item.thumbnailKey,
      uploadKey: item.uploadKey,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
