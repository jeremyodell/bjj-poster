/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Type-safe fetch wrapper with error handling
 */
export async function apiFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }
  return response.json();
}
