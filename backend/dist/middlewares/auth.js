"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../core/errors");
const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secure_secret_token_12345';
/**
 * Express Middleware protecting private routes with JWT.
 * Decodes the Bearer token and binds user information to the request scope.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new errors_1.AppError('Authentication failed: Missing or invalid token format', 401));
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
        };
        return next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new errors_1.AppError('Authentication failed: Token has expired', 401));
        }
        return next(new errors_1.AppError('Authentication failed: Invalid token signatures', 401));
    }
}
