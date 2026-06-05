"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.getProfile = getProfile;
exports.forgotPassword = forgotPassword;
exports.verifyOtp = verifyOtp;
exports.resetPassword = resetPassword;
exports.updatePassword = updatePassword;
exports.updateProfile = updateProfile;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../core/db");
const errors_1 = require("../../core/errors");
const mailer_1 = require("../../utils/mailer");
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
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email)
            return next(new errors_1.AppError('Missing email', 400));
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpiry }
        });
        await (0, mailer_1.sendOTPEmail)(email, otp);
        return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }
    catch (err) {
        return next(err);
    }
}
async function verifyOtp(req, res, next) {
    try {
        const { email, otp } = req.body;
        if (!email || !otp)
            return next(new errors_1.AppError('Missing email or otp', 400));
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return next(new errors_1.AppError('Invalid or expired OTP', 400));
        }
        return res.status(200).json({ message: 'OTP verified successfully' });
    }
    catch (err) {
        return next(err);
    }
}
async function resetPassword(req, res, next) {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return next(new errors_1.AppError('Missing required fields', 400));
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return next(new errors_1.AppError('Invalid or expired OTP', 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                otp: null,
                otpExpiry: null
            }
        });
        return res.status(200).json({ message: 'Password reset successfully' });
    }
    catch (err) {
        return next(err);
    }
}
async function updatePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return next(new errors_1.AppError('Validation failed: Missing current or new password', 400));
        }
        if (!req.user) {
            return next(new errors_1.AppError('Unauthorized', 401));
        }
        const user = await db_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return next(new errors_1.AppError('User not found', 404));
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return next(new errors_1.AppError('Incorrect current password', 401));
        }
        if (newPassword.length < 6) {
            return next(new errors_1.AppError('Validation failed: Password must be at least 6 characters long', 400));
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(newPassword, salt);
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash }
        });
        return res.status(200).json({ message: 'Password updated successfully' });
    }
    catch (err) {
        return next(err);
    }
}
async function updateProfile(req, res, next) {
    try {
        const { name } = req.body;
        if (!name) {
            return next(new errors_1.AppError('Validation failed: Name is required', 400));
        }
        if (!req.user) {
            return next(new errors_1.AppError('Unauthorized', 401));
        }
        const user = await db_1.prisma.user.update({
            where: { id: req.user.id },
            data: { name },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });
        return res.status(200).json({ message: 'Profile updated successfully', user });
    }
    catch (err) {
        return next(err);
    }
}
