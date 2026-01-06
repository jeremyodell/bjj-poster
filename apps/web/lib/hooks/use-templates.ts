import { useQuery } from '@tanstack/react-query';
import { fetchTemplates } from '../api/templates';
import type { Template } from '../types/api';

/**
 * Fetches all available templates
 * Query key: ['templates']
 */
export function useTemplates() {
  return useQuery<Template[], Error>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });
}
