import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const api = axios.create({ baseURL: 'http://localhost:5000/api/v1' });

async function runTest() {
  const email = 'test_user_' + Date.now() + '@example.com';
  const password = 'OldPassword123!';
  const newPassword = 'NewPassword456!';

  console.log('1. Signup...');
  await api.post('/auth/signup', { name: 'Test', email, password });

  console.log('2. Forgot Password...');
  await api.post('/auth/forgot-password', { email });

  console.log('3. Extracting OTP from DB...');
  const user = await prisma.user.findUnique({ where: { email } });
  const otp = user!.otp;
  console.log('Got OTP:', otp);

  console.log('4. Verify OTP...');
  const verifyRes = await api.post('/auth/verify-otp', { email, otp });
  const resetToken = verifyRes.data.resetToken;

  console.log('5. Reset Password...');
  await api.post('/auth/reset-password', { email, otp, newPassword });

  console.log('6. Login with new password...');
  const loginRes = await api.post('/auth/login', { email, password: newPassword });
  console.log('Login success! Token received.');
  
  console.log('All tests passed.');
}

runTest().catch(err => {
  console.error('Test failed:', err.response?.data || err.message);
  process.exit(1);
});
