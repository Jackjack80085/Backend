"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_config_1 = require("../config/swagger.config");
const logger_middleware_1 = __importDefault(require("../middlewares/logger.middleware"));
const routes_1 = __importDefault(require("./routes"));
const notFound_1 = __importDefault(require("../middlewares/notFound"));
const errorHandler_1 = __importDefault(require("../middlewares/errorHandler"));
const app = (0, express_1.default)();
// Parse JSON and capture raw body for later use (via verify)
app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf && buf.toString('utf8');
    },
}));
// Allow requests from frontend and local test pages
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://frontend-production-39ad.up.railway.app',
];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        }
        else {
            callback(new Error(`CORS blocked: ${origin}`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
// CORS middleware handles preflight requests automatically
app.use((0, cors_1.default)(corsOptions));
app.use(logger_middleware_1.default);
// Swagger docs
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec));
// Serve the payment test page (test-integration.html + any QR image) at /pay
// Place qr-code.png in the project root alongside test-integration.html
const projectRoot = process.cwd();
app.get('/pay', (_req, res) => {
    res.sendFile(path_1.default.join(projectRoot, 'test-integration.html'));
});
// Serve static assets (qr-code.png etc.) from the project root at /pay-assets
app.use('/pay-assets', express_1.default.static(projectRoot));
app.use('/', routes_1.default);
app.use(notFound_1.default);
app.use(errorHandler_1.default);
exports.default = app;
