import { Router } from 'express';
import { signup, login, getProfile, forgotPassword, verifyOtp, resetPassword, updatePassword, updateProfile } from './auth.controller';
import { authenticate } from '../../middlewares/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate as any, getProfile as any);
router.put('/me', authenticate as any, updateProfile as any);
router.put('/password', authenticate as any, updatePassword as any);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
