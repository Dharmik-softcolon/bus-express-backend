import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { USER_ROLES } from '../constants/index.js';

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
export const generateToken = (payload: any): string => {
  const secret = config.jwt.SECRET_KEY || 'fallback-secret';
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.EXPIRY || '7d',
  } as jwt.SignOptions);
};

// Generate refresh token
export const generateRefreshToken = (payload: any): string => {
  const secret = config.jwt.REFRESH_SECRET || 'fallback-refresh-secret';
  return jwt.sign(payload, secret, {
    expiresIn: config.jwt.REFRESH_EXPIRE || '30d',
  } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, config.jwt.SECRET_KEY || 'fallback-secret');
};

// Verify refresh token
export const verifyRefreshToken = (token: string): any => {
  return jwt.verify(token, config.jwt.REFRESH_SECRET || 'fallback-refresh-secret');
};

// Generate random password
export const generateRandomPassword = (length: number = 8): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Generate OTP
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Check if user has required role
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

// Check if user is admin
export const isAdmin = (userRole: string): boolean => {
  return userRole === USER_ROLES.ADMIN;
};

// Check if user is operator
export const isOperator = (userRole: string): boolean => {
  return userRole === USER_ROLES.OPERATOR;
};

// Check if user is customer
export const isCustomer = (userRole: string): boolean => {
  return userRole === USER_ROLES.CUSTOMER;
};

// Format phone number
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if not present
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  return `+${cleaned}`;
};

// Validate email
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Sanitize input
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Generate booking reference
export const generateBookingReference = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BE${timestamp}${random}`.toUpperCase();
};

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};
