import express from 'express';
import { getGlobalStore } from '../data/store.js';

const router = express.Router();

// User Registration: Does NOT automatically log the user in
router.post('/register', async (req, res, next) => {
  const firstName = (req.body.firstName || (req.body.name ? req.body.name.split(' ')[0] : '')).trim();
  const lastName = (req.body.lastName || (req.body.name ? req.body.name.split(' ').slice(1).join(' ') : '')).trim();
  const email = (req.body.email || '').trim();
  const password = (req.body.password || '').trim();
  const confirmPassword = (req.body.confirmPassword || '').trim();
  const rawAge = req.body.age;
  const age = rawAge !== undefined && rawAge !== '' ? parseInt(rawAge, 10) : null;
  const gender = (req.body.gender || '').trim();
  const mobile = (req.body.mobile || req.body.phone || '').trim();

  if (!firstName) {
    return res.status(400).json({ success: false, error: 'Please enter your first name.', message: 'Please enter your first name.' });
  }
  if (!lastName && !req.body.name) {
    return res.status(400).json({ success: false, error: 'Please enter your last name.', message: 'Please enter your last name.' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.', message: 'Please enter a valid email address.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, error: 'Please enter a password.', message: 'Please enter a password.' });
  }
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Passwords do not match.', message: 'Passwords do not match.' });
  }
  if (age === null || isNaN(age) || age < 1 || age > 120) {
    return res.status(400).json({ success: false, error: 'Please enter a valid age.', message: 'Please enter a valid age.' });
  }
  if (!gender || !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
    return res.status(400).json({ success: false, error: 'Please select your gender.', message: 'Please select your gender.' });
  }
  const phoneClean = mobile.replace(/[^0-9+]/g, '');
  if (!mobile || phoneClean.length < 8) {
    return res.status(400).json({ success: false, error: 'Please enter a valid mobile number.', message: 'Please enter a valid mobile number.' });
  }

  const store = getGlobalStore();
  const regResult = await store.registerUser({
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email,
    phone: mobile,
    mobile,
    password,
    age,
    gender
  });

  if (!regResult.success) {
    return res.status(400).json({
      success: false,
      error: regResult.error || 'Registration failed.',
      message: regResult.error || 'Registration failed.'
    });
  }

  // Requirement 1: DO NOT automatically log the user into the dashboard.
  // Instead show: "Registration successful. Please log in to continue." Then redirect to Login.
  return res.status(201).json({
    success: true,
    message: 'Registration successful. Please log in to continue.'
  });
});

// User Login: Strict authentication
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, error: 'Email address is required.' });
  }
  if (!password || !password.trim()) {
    return res.status(400).json({ success: false, error: 'Password is required.' });
  }

  const store = getGlobalStore();
  const authResult = await store.authenticateUser(email, password);

  if (!authResult.success) {
    const isNotFound = authResult.error?.includes('not found') || authResult.error?.includes('register');
    const statusCode = isNotFound ? 404 : 401;
    return res.status(statusCode).json({
      success: false,
      error: authResult.error,
      message: authResult.error
    });
  }

  return res.json({
    success: true,
    token: authResult.token,
    user: authResult.user,
    message: 'Login successful'
  });
});

// Get current user profile
router.get('/profile', async (req, res) => {
  const store = getGlobalStore();
  const userId = store.resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const userData = await store.getUserData(userId);
  return res.json({
    success: true,
    user: userData?.user || null
  });
});

// Update user personal information (Requirement 7)
router.put('/profile', async (req, res) => {
  const store = getGlobalStore();
  const userId = store.resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { firstName, lastName, age, gender, mobile, phone, avatar } = req.body;

  if (avatar !== undefined && avatar !== null && typeof avatar !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid profile picture.' });
  }

  if (firstName !== undefined && !firstName.trim()) {
    return res.status(400).json({ success: false, error: 'Please enter your first name.', message: 'Please enter your first name.' });
  }
  if (lastName !== undefined && !lastName.trim()) {
    return res.status(400).json({ success: false, error: 'Please enter your last name.', message: 'Please enter your last name.' });
  }
  if (age !== undefined && age !== '') {
    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 1 || numAge > 120) {
      return res.status(400).json({ success: false, error: 'Please enter a valid age.', message: 'Please enter a valid age.' });
    }
  }
  if (gender !== undefined && gender !== '') {
    if (!['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
      return res.status(400).json({ success: false, error: 'Please select your gender.', message: 'Please select your gender.' });
    }
  }
  const cleanPhone = (mobile || phone || '').replace(/[^0-9+]/g, '');
  if ((mobile !== undefined || phone !== undefined) && cleanPhone.length > 0 && cleanPhone.length < 8) {
    return res.status(400).json({ success: false, error: 'Please enter a valid mobile number.', message: 'Please enter a valid mobile number.' });
  }

  const result = await store.updateUserProfile(userId, req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error || 'Failed to update profile' });
  }

  // Keep the request snapshot in sync with the direct profile update so the
  // persistence middleware cannot overwrite the newly saved profile fields.
  if (req.db) req.db.user = result.user;

  return res.json({
    success: true,
    user: result.user,
    message: 'Profile updated successfully.'
  });
});

export default router;
