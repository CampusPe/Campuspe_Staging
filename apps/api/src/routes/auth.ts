import express from 'express';
import { register, login, sendOTP, verifyOTPController, forgotPassword, checkEmail, checkPhone, validateEmail } from '../controllers/auth';

const router = express.Router();

// Authentication routes
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/check-email', validateEmail, checkEmail);
router.post('/check-phone', checkPhone);

// OTP verification routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPController);

export default router;
