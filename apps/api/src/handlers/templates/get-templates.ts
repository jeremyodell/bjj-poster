import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * PLACEHOLDER: Get Templates Handler
 * 
 * This is a temporary placeholder until ODE-195 is implemented.
 * Returns 501 Not Implemented.
 * 
 * Note: list-templates.ts exists but this follows the naming in the CDK plan.
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
      message: 'Get Templates endpoint is not yet implemented. See ODE-195.'
    })
  };
};
