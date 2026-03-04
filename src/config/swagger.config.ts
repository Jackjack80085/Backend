import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Paycher Payment API',
      version: '1.0.0',
      description: 'B2B Payment Aggregation Platform API',
      contact: {
        name: 'API Support',
        email: 'support@paycher.com',
      },
    },
    servers: [
      {
        url: process.env.APP_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'Partner API Key',
        },
        SignatureAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Signature',
          description: 'HMAC-SHA256 signature of request body',
        },
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Admin JWT token',
            },
      },
    },
    security: [{ ApiKeyAuth: [], SignatureAuth: [] }],
  },
  apis: [
    './src/app/routes/*.ts',
    './src/app/webhooks/*.ts',
  ],
}

export const swaggerSpec = swaggerJsdoc(options)
