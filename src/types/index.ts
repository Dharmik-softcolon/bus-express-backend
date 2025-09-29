// Centralized type definitions for the Bus Express application

// JWT Payload interface
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

// User interfaces
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  profileImage?: string;
  address?: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  timestamp: string;
}

export interface PaginationData {
  users?: any[];
  buses?: any[];
  routes?: any[];
  bookings?: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Bus interfaces
export interface BusFilters {
  type?: string;
  status?: string;
  operator?: string;
  amenities?: string[];
  search?: string;
}

export interface BusFeatures {
  wifi: boolean;
  charging: boolean;
  blankets: boolean;
  water: boolean;
  snacks: boolean;
}

// Route interfaces
export interface RouteFilters {
  from?: string;
  to?: string;
  isActive?: boolean;
  search?: string;
}

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteStop {
  name: string;
  city: string;
  coordinates: Coordinate;
  arrivalTime?: string;
  departureTime?: string;
}

export interface RouteEndpoints {
  city: string;
  state: string;
  coordinates: Coordinate;
}

// Booking interfaces
export interface BookingFilters {
  user?: string;
  bus?: string;
  route?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  journeyDateFrom?: Date;
  journeyDateTo?: Date;
  search?: string;
}

export interface Passenger {
  seatNumber: number;
  passengerName: string;
  passengerAge: number;
  passengerGender: 'Male' | 'Female' | 'Other';
  passengerPhone: string;
}

// Payment interfaces
export interface PaymentData {
  bookingId: string;
  amount: number;
  paymentMethod: 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking' | 'Wallet' | 'Cash';
  paymentGateway?: string;
  paymentId?: string;
}

// File upload interfaces (using Multer's built-in Express.Multer.File type)

// Validation error interface
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Service response interfaces
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Email interfaces
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  variables?: { [key: string]: any };
}

// Search interfaces
export interface SearchCriteria {
  query?: string;
  filters?: any;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

// Health check interfaces
export interface HealthCheck {
  status: 'healthy' | 'warning' | 'unhealthy';
  details: any;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'unhealthy';
  timestamp: string;
  uptime: string;
  version: string;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
    environment: HealthCheck;
  };
  system: {
    platform: string;
    nodeVersion: string;
    pid: number;
  };
}

// Database interfaces
export interface DatabaseConfig {
  url: string;
  options?: any;
}

// Environment interfaces
export interface EnvironmentConfig {
  PORT: string;
  NODE_ENV: string;
}

// JWT interfaces
export interface JWTConfig {
  SECRET_KEY: string;
  EXPIRY: string;
  REFRESH_SECRET: string;
  REFRESH_EXPIRE: string;
}

// Email configuration interfaces
export interface EmailConfig {
  FROM_EMAIL: string;
  FROM_NAME: string;
  HOST: string;
  PORT: string;
  USER: string;
  PASS: string;
  SENDGRID_API_KEY?: string;
}

// Rate limiting interfaces
export interface RateLimitConfig {
  WINDOW_MS: string;
  MAX_REQUESTS: string;
}

// Google OAuth interfaces
export interface GoogleConfig {
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  CALLBACK_URL: string;
}

// Stripe payment interfaces
export interface StripeConfig {
  SECRET_KEY: string;
  PUBLISHABLE_KEY: string;
  WEBHOOK_SECRET: string;
  CURRENCY: string;
}

// File upload configuration interfaces
export interface FileUploadConfig {
  MAX_SIZE: string;
  UPLOAD_PATH: string;
  ALLOWED_TYPES: string;
}

// OTP interfaces
export interface OTPConfig {
  EXPIRE_MINUTES: string;
  LENGTH: string;
}

// Password reset interfaces
export interface PasswordResetConfig {
  EXPIRE_MINUTES: string;
  
}

// App configuration interfaces
export interface AppConfig {
  CLIENT_URL: string;
  BASE_URL: string;
  FRONTEND_URL: string;
}

// CORS configuration interfaces
export interface CORSConfig {
  ORIGIN: string;
}

// Request interfaces
export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  pagination?: {
    page: number;
    limit: number;
    skip: number;
  };
}

// Error interfaces
export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Cache interfaces
export interface CacheConfig {
  TTL: number;
  MAX_SIZE: number;
}

// Webhook interfaces
export interface WebhookPayload {
  type: string;
  data: any;
  timestamp: string;
  signature?: string;
}
