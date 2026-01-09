/**
 * Template entity from the API
 */
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
}

/**
 * Poster entity from the API
 */
export interface Poster {
  id: string;
  templateId: string;
  createdAt: string;
  thumbnailUrl: string;
  athleteName: string;
  tournament: string;
  beltRank: string;
  status: 'draft' | 'completed';
}
