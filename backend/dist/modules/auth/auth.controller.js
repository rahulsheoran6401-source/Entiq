"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getProfile = getProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../core/db");
const errors_1 = require("../../core/errors");
const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secure_secret_token_12345';
/**
 * Controller handles standard credential-based signup, login, and user profile queries.
 */
async function signup(req, res, next) {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return next(new errors_1.AppError('Validation failed: Missing email, password, or name', 400));
        }
        if (password.length < 6) {
            return next(new errors_1.AppError('Validation failed: Password must be at least 6 characters long', 400));
        }
        const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return next(new errors_1.AppError('Signup failed: Email is already in use', 409));
        }
        // Encrypt password
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Write to database
        const user = await db_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
            },
        });
        // Create JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new errors_1.AppError('Validation failed: Missing email or password', 400));
        }
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return next(new errors_1.AppError('Login failed: Invalid credentials provided', 401));
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return next(new errors_1.AppError('Login failed: Invalid credentials provided', 401));
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        });
    }
    catch (err) {
        return next(err);
    }
}
async function getProfile(req, res, next) {
    try {
        if (!req.user) {
            return next(new errors_1.AppError('Unauthorized: Access profile denied', 401));
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            return next(new errors_1.AppError('User profile not found', 404));
        }
        return res.status(200).json({ user });
    }
    catch (err) {
        return next(err);
    }
}
