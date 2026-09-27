import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { connectMongo, getMongoDatabase } from './mongo.js';

const DEFAULT_AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#E2E8F0"/><circle cx="50" cy="36" r="18" fill="#64748B"/><path d="M18 88c3-20 16-30 32-30s29 10 32 30" fill="#64748B"/></svg>')}`;

export function createEmptyUserData(user) {
  const firstName = user.firstName || (user.name ? user.name.split(' ')[0] : '');
  const lastName = user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '');
  const age = parseInt(user.age, 10) || 28;
  const gender = user.gender || 'Prefer not to say';
  const phone = user.mobile || user.phone || '';
  const fullName = user.name || `${firstName} ${lastName}`.trim() || 'Traveler';
  const category = age >= 60 ? 'Elderly' : age < 18 ? 'Child' : 'Adult';

  return {
    user: {
      id: user.id,
      firstName,
      lastName,
      name: fullName,
      email: user.email,
      phone,
      mobile: phone,
      age,
      gender,
      avatar: user.avatar || DEFAULT_AVATAR,
      alternatePhone: user.alternatePhone || '',
      role: 'Head Traveller'
    },
    trip: { id: `trip_${Date.now()}`, title: '', origin: '', destination: '', startDate: '', endDate: '', travelType: 'Flight', travellersCount: 1, notes: '', status: 'Active', destinations: [] },
    destinations: [],
    travellers: [{ id: `trav_${user.id}`, name: fullName, age, gender, phone, relationship: 'Self', category, isHead: true, safetyStatus: 'SAFE', specialNeeds: [] }],
    emergencyContacts: [],
    smsLogs: [],
    itinerary: [],
    advisories: [],
    notifications: [],
    sosState: { isActive: false, activatedAt: null, lastUpdate: null, location: null, contactsNotified: false }
  };
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, password, ...safeUser } = user;
  return safeUser;
}

function tokenForUser(userId) {
  const encoded = Buffer.from(`${userId}.${Date.now()}`).toString('base64url');
  const secret = process.env.JWT_SECRET || 'safevoyage_local_secret';
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `safevoyage_jwt_${encoded}.${signature}`;
}

function userIdFromToken(token) {
  if (!token || !token.startsWith('safevoyage_jwt_')) return null;
  const [encoded, signature] = token.slice('safevoyage_jwt_'.length).split('.');
  if (!encoded || !signature) return null;
  const secret = process.env.JWT_SECRET || 'safevoyage_local_secret';
  const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = Buffer.from(encoded, 'base64url').toString('utf8');
    return payload.slice(0, payload.lastIndexOf('.')) || null;
  } catch {
    return null;
  }
}

class Store {
  async initialize() {
    await connectMongo();
  }

  users() {
    return getMongoDatabase().collection('users');
  }

  resolveUserId(req) {
    const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
    if (authHeader?.startsWith('Bearer ')) return userIdFromToken(authHeader.slice('Bearer '.length));
    return req?.headers?.['x-user-id'] || req?.headers?.['x-userid'] || null;
  }

  async registerUser({ firstName, lastName, name, email, phone, mobile, password, age, gender }) {
    const normalizedEmail = email.toLowerCase().trim();
    if (await this.users().findOne({ email: normalizedEmail })) return { success: false, error: 'An account with this email already exists.' };
    const fName = (firstName || '').trim();
    const lName = (lastName || '').trim();
    const fullName = (name || `${fName} ${lName}`).trim() || 'Traveler';
    const cleanPhone = (phone || mobile || '').trim();
    const user = { id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, firstName: fName, lastName: lName, name: fullName, email: normalizedEmail, phone: cleanPhone, mobile: cleanPhone, age: parseInt(age, 10) || 28, gender: (gender || 'Prefer not to say').trim(), avatar: DEFAULT_AVATAR, role: 'Head Traveller' };
    const data = createEmptyUserData(user);
    const passwordHash = await bcrypt.hash(password.trim(), 12);
    try {
      await this.users().insertOne({ id: user.id, email: normalizedEmail, passwordHash, data, createdAt: new Date() });
    } catch (error) {
      if (error.code === 11000) return { success: false, error: 'An account with this email already exists.' };
      throw error;
    }
    return { success: true, user: publicUser(user) };
  }

  async authenticateUser(email, password) {
    const userDoc = await this.users().findOne({ email: email.toLowerCase().trim() });
    if (!userDoc) return { success: false, error: 'Account not found. Please register before logging in.' };
    if (!(await bcrypt.compare(password.trim(), userDoc.passwordHash || ''))) return { success: false, error: 'Incorrect password.' };
    return { success: true, token: tokenForUser(userDoc.id), user: publicUser(userDoc.data?.user) };
  }

  async getUserData(userId) {
    const userDoc = await this.users().findOne({ id: userId });
    return userDoc?.data || null;
  }

  async loadUserData(userId) {
    return this.getUserData(userId);
  }

  async saveUserData(userId, data) {
    if (userId && data) await this.users().updateOne({ id: userId }, { $set: { data, updatedAt: new Date() } });
  }

  async updateUserProfile(userId, updates = {}) {
    const userDoc = await this.users().findOne({ id: userId });
    if (!userDoc) return { success: false, error: 'User not found' };
    const current = userDoc.data?.user || {};
    const updated = {
      ...current,
      ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
      ...(updates.email !== undefined ? { email: updates.email.trim().toLowerCase() } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone, mobile: updates.phone } : {}),
      ...(updates.mobile !== undefined ? { phone: updates.mobile, mobile: updates.mobile } : {}),
      ...(updates.avatar !== undefined ? { avatar: updates.avatar || DEFAULT_AVATAR } : {}),
      ...(updates.alternatePhone !== undefined ? { alternatePhone: updates.alternatePhone } : {}),
      ...(updates.firstName !== undefined ? { firstName: updates.firstName } : {}),
      ...(updates.lastName !== undefined ? { lastName: updates.lastName } : {}),
      ...(updates.age !== undefined ? { age: parseInt(updates.age, 10) } : {}),
      ...(updates.gender !== undefined ? { gender: updates.gender } : {})
    };
    const data = { ...userDoc.data, user: updated };
    await this.users().updateOne({ id: userId }, { $set: { email: updated.email || userDoc.email, data, updatedAt: new Date() } });
    return { success: true, user: publicUser(updated) };
  }
}

const storeInstance = new Store();

export const getDB = (req) => req?.db || null;
export const getGlobalStore = () => storeInstance;
export const resetDB = () => ({ success: false, error: 'MongoDB-backed data cannot be reset through the demo endpoint.' });
