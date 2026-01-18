import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * PLACEHOLDER: Get User Profile Handler
 * 
 * This is a temporary placeholder until ODE-197 is implemented.
 * Returns 501 Not Implemented.
 */
export const handler = async (
  _event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 501,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      error: 'Not Implemented',
      message: 'Get User Profile endpoint is not yet implemented. See ODE-197.'
    })
  };
};
