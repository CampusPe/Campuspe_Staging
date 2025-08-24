import express from 'express';
import { register, login, sendOTP, verifyOTPController, forgotPassword, checkEmail, checkPhone, validateEmail, testLogin, verifyOTPAndLogin, googleSignup, verifyGoogleSignupPhone } from '../controllers/auth';

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
router.post('/verify-otp-login', verifyOTPAndLogin);

// Google authentication routes
router.post('/google-signup', googleSignup);
router.post('/verify-google-phone', verifyGoogleSignupPhone);

// Test login endpoint (development only)
router.post('/test-login', testLogin);

export default router;
