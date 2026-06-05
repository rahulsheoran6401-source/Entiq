"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before any other module imports
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_router_1 = __importDefault(require("./modules/auth/auth.router"));
const projects_router_1 = __importDefault(require("./modules/projects/projects.router"));
const entities_router_1 = __importDefault(require("./modules/entities/entities.router"));
const generator_router_1 = __importDefault(require("./modules/generator/generator.router"));
const errors_1 = require("./core/errors");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable CORS with support for local development clients
app.use((0, cors_1.default)({
    origin: '*', // In production, replace with structured configurations
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Bind modular REST route hooks
app.use('/api/v1/auth', auth_router_1.default);
app.use('/api/v1/projects', projects_router_1.default);
app.use('/api/v1/projects/:projectId/entities', entities_router_1.default);
app.use('/api/v1/projects/:projectId/resources/:entitySlug', generator_router_1.default);
// Base sanity check hook
app.get('/api/v1/health', (req, res) => {
    return res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// Fallback catch for unregistered API routes
app.use('*', (req, res, next) => {
    next(new errors_1.AppError(`Endpoint '${req.originalUrl}' not found on this system`, 404));
});
// Register Global Error Handler Middleware
app.use(errors_1.errorHandler);
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` 🚀 CodeForge Dynamic Backend Engine    `);
    console.log(` ⚡ Running on http://localhost:${PORT} `);
    console.log(`========================================`);
});
