import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/db';
import { AppError } from '../../core/errors';
import { AuthenticatedRequest } from '../../middlewares/auth';
import { sendOTPEmail } from '../../utils/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'codeforge_super_secure_secret_token_12345';

/**
 * Controller handles standard credential-based signup, login, and user profile queries.
 */
export async function signup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Validation failed: Missing email, password, or name', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Validation failed: Password must be at least 6 characters long', 400));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(new AppError('Signup failed: Email is already in use', 409));
    }

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Write to database
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
      },
    });

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (err) {
    return next(err);
  }
}

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Validation failed: Missing email or password', 400));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Login failed: Invalid credentials provided', 401));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Login failed: Invalid credentials provided', 401));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (err) {
    return next(err);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized: Access profile denied', 401));
    }

    const user = await prisma.user.findUnique({
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
      return next(new AppError('User profile not found', 404));
    }

    return res.status(200).json({ user });
  } catch (err) {
    return next(err);
  }
}

export async function forgotPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Missing email', 400));
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    
    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry }
    });

    await sendOTPEmail(email, otp);

    return res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
  } catch (err) {
    return next(err);
  }
}

export async function verifyOtp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError('Missing email or otp', 400));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    return res.status(200).json({ message: 'OTP verified successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return next(new AppError('Missing required fields', 400));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return next(new AppError('Invalid or expired OTP', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null
      }
    });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function updatePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return next(new AppError('Validation failed: Missing current or new password', 400));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Incorrect current password', 401));
    }

    if (newPassword.length < 6) {
      return next(new AppError('Validation failed: Password must be at least 6 characters long', 400));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    return res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    return next(err);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    if (!name) {
      return next(new AppError('Validation failed: Name is required', 400));
    }

    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await prisma.user.update({
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
  } catch (err) {
    return next(err);
  }
}
