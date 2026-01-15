import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * PLACEHOLDER: Generate Poster Handler
 * 
 * This is a temporary placeholder until ODE-194 is implemented.
 * Returns 501 Not Implemented.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 501,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: 'Not Implemented',
      message: 'Generate Poster endpoint is not yet implemented. See ODE-194.'
    })
  };
};
