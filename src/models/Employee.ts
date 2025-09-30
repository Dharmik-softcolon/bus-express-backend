import mongoose, { Schema, Document } from 'mongoose';
import { EMPLOYEE_ROLES, EMPLOYEE_STATUS } from '../constants';

// Employee interface
export interface IEmployee extends Document {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  licenseNumber?: string;
  licenseExpiry?: Date;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  joiningDate: Date;
  salary?: number;
  status: string;
  profileImage?: string;
  documents: Array<{
    type: string;
    documentNumber: string;
    expiryDate?: Date;
    fileUrl: string;
  }>;
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
    required: [true, 'Email is required'],
    unique: true,
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
    enum: Object.values(EMPLOYEE_ROLES),
    required: [true, 'Role is required'],
  },
  licenseNumber: {
    type: String,
    trim: true,
    uppercase: true,
  },
  licenseExpiry: {
    type: Date,
  },
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    country: {
      type: String,
      default: 'India',
      trim: true,
    },
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      trim: true,
      match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid phone number'],
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true,
    },
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
    enum: Object.values(EMPLOYEE_STATUS),
    default: EMPLOYEE_STATUS.ACTIVE,
  },
  profileImage: {
    type: String,
  },
  documents: [{
    type: {
      type: String,
      required: [true, 'Document type is required'],
      enum: ['License', 'Aadhar', 'PAN', 'Passport', 'Other'],
    },
    documentNumber: {
      type: String,
      required: [true, 'Document number is required'],
      trim: true,
    },
    expiryDate: {
      type: Date,
    },
    fileUrl: {
      type: String,
      required: [true, 'Document file URL is required'],
    },
  }],
}, {
  timestamps: true,
});

// Index for better performance
employeeSchema.index({ role: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ email: 1 });
employeeSchema.index({ phone: 1 });

export const Employee = mongoose.model<IEmployee>('Employee', employeeSchema);
