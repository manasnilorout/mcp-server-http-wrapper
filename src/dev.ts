import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { handler } from './index';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper to convert Express request to API Gateway event
const createEvent = (req: express.Request): APIGatewayProxyEvent => {
  const userAgent = req.get('User-Agent');
  
  // Need to cast to satisfy TypeScript
  return {
    body: JSON.stringify(req.body || {}),
    headers: req.headers as { [name: string]: string },
    multiValueHeaders: {} as any,
    httpMethod: req.method,
    isBase64Encoded: false,
    path: req.path,
    pathParameters: req.params as any,
    queryStringParameters: req.query as { [name: string]: string } | null,
    multiValueQueryStringParameters: {} as any,
    stageVariables: {} as any,
    requestContext: {
      accountId: '123456789012',
      apiId: 'id',
      authorizer: {} as any,
      protocol: 'HTTP/1.1',
      httpMethod: req.method,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: req.ip || '127.0.0.1',
        user: null,
        userAgent: userAgent || '',
        userArn: null,
      },
      path: req.path,
      stage: 'dev',
      requestId: `request-${Date.now()}`,
      requestTimeEpoch: Date.now(),
      resourceId: 'resourceId',
      resourcePath: req.path,
    } as any,
    resource: req.path,
  } as APIGatewayProxyEvent;
};

// Mock context for Lambda
const createContext = (): Context => {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'local',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:local:local:function:local',
    memoryLimitInMB: '256',
    awsRequestId: `request-${Date.now()}`,
    logGroupName: 'local',
    logStreamName: 'local',
    getRemainingTimeInMillis: () => 1000 * 60 * 5, // 5 minutes
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
};

// Handler function to process requests
const processRequest = async (req: any, res: any) => {
  try {
    console.log(`${req.method} ${req.path}`);
    console.log('Request Body:', req.body);
    
    // Convert Express request to API Gateway event
    const event = createEvent(req);
    const context = createContext();
    
    // Call the serverless handler with proper types
    const result = await handler(event, context, () => {}) as APIGatewayProxyResult;
    
    if (!result) {
      return res.status(500).json({ error: 'No result from Lambda handler' });
    }
    
    // Set status code and headers from the Lambda response
    res.status(result.statusCode || 200);
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        if (value) res.setHeader(key, value as string);
      });
    }
    
    // Send the response body
    if (result.body) {
      try {
        return res.send(JSON.parse(result.body));
      } catch (e) {
        return res.send(result.body);
      }
    }
    
    return res.send();
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

// Also add routes for /api and nested paths
app.get('/:serverName', processRequest);
app.post('/:serverName/:toolName', processRequest);

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Local development server running at http://localhost:${PORT}`);
    console.log('Use Postman to send requests to this endpoint');
  });
}
