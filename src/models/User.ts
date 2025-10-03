import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, BUS_EMPLOYEE_SUBROLES } from '../constants';

// User interface - Unified for all roles
export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
  subrole?: string; // For BUS_EMPLOYEE: DRIVER or HELPER
  createdBy?: string; // ID of the user who created this user
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  profileImage?: string;
  company?: string;
  aadhaarCard?: string;
  position?: string;
  address?: string;
  // Employee-specific fields
  license?: string; // For drivers
  assignedBus?: string; // For drivers/helpers
  joiningDate?: Date;
  salary?: number; // For BUS_ADMIN and BUS_EMPLOYEE
  commission?: number; // For BOOKING_MAN
  totalTrips?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User schema
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid phone number'],
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.BUS_EMPLOYEE,
  },
  subrole: {
    type: String,
    enum: Object.values(BUS_EMPLOYEE_SUBROLES),
    required: function(this: IUser) {
      return this.role === USER_ROLES.BUS_EMPLOYEE;
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  profileImage: {
    type: String,
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters'],
  },
  aadhaarCard: {
    type: String,
    trim: true,
    match: [/^\d{4}-\d{4}-\d{4}$/, 'Aadhaar card must be in format XXXX-XXXX-XXXX'],
  },
  position: {
    type: String,
    trim: true,
    maxlength: [50, 'Position cannot exceed 50 characters'],
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters'],
  },
  // Employee-specific fields
  license: {
    type: String,
    trim: true,
    uppercase: true,
  },
  assignedBus: {
    type: String,
    trim: true,
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative'],
  },
  commission: {
    type: Number,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%'],
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 5.0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5'],
  },
}, {
  timestamps: true,
});

// Index for better performance
userSchema.index({ role: 1 });

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform output
userSchema.set('toJSON', {
  transform: function(doc, ret: any) {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
