"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
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
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
