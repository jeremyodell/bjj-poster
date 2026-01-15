/**
 * Template entity from the API
 */
export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnailUrl: string;
  /** Subscription tier required to use this template. Defaults to 'free' if not specified. */
  tier?: 'free' | 'pro' | 'premium';
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
