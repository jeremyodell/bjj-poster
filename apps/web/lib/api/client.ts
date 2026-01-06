/**
 * Custom error class for API errors with status code
 * Includes optional cause for error chaining and debugging
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    options?: { cause?: unknown }
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

/**
 * Type-safe fetch wrapper with error handling
 * Wraps both HTTP errors and network failures in ApiError for consistent error handling
 */
export async function apiFetch<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    // Network errors (CORS, timeout, no internet)
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { cause: error }
    );
  }

  // HTTP errors (4xx, 5xx)
  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }

  return response.json();
}
