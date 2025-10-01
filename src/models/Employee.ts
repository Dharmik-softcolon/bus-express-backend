import mongoose, { Schema, Document } from 'mongoose';
import { BUS_EMPLOYEE_SUBROLES, EMPLOYEE_STATUS } from '../constants';

// Employee interface
export interface IEmployee extends Document {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  subrole?: string;
  license?: string;
  aadhaarCard?: string;
  address: string;
  assignedBus?: string;
  joiningDate: Date;
  salary?: number;
  status: string;
  profileImage?: string;
  totalTrips?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Employee schema
const employeeSchema = new Schema<IEmployee>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
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
    enum: ['BUS_OWNER', 'BUS_ADMIN', 'BUS_EMPLOYEE', 'BOOKING_MAN'],
    required: [true, 'Role is required'],
  },
  subrole: {
    type: String,
    enum: ['DRIVER', 'HELPER'],
    required: function() {
      return this.role === 'BUS_EMPLOYEE';
    },
  },
  license: {
    type: String,
    trim: true,
    uppercase: true,
  },
  aadhaarCard: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  assignedBus: {
    type: String,
    trim: true,
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
    default: Date.now,
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative'],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  profileImage: {
    type: String,
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
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
// email and phone already have unique: true, so no need for separate indexes

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
