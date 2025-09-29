import mongoose, { Schema, Document } from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../constants';

// Booking interface
export interface IBooking extends Document {
  _id: string;
  bookingReference: string;
  user: mongoose.Types.ObjectId;
  bus: mongoose.Types.ObjectId;
  route: mongoose.Types.ObjectId;
  journeyDate: Date;
  seats: Array<{
    seatNumber: number;
    passengerName: string;
    passengerAge: number;
    passengerGender: string;
    passengerPhone: string;
  }>;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentId?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  refundAmount?: number;
  boardingPoint: string;
  droppingPoint: string;
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema
const bookingSchema = new Schema<IBooking>({
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true,
    uppercase: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
  },
  bus: {
    type: Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required'],
  },
  route: {
    type: Schema.Types.ObjectId,
    ref: 'Route',
    required: [true, 'Route is required'],
  },
  journeyDate: {
    type: Date,
    required: [true, 'Journey date is required'],
    min: [new Date(), 'Journey date cannot be in the past'],
  },
  seats: [{
    seatNumber: {
      type: Number,
      required: [true, 'Seat number is required'],
      min: [1, 'Seat number must be at least 1'],
    },
    passengerName: {
      type: String,
      required: [true, 'Passenger name is required'],
      trim: true,
      maxlength: [50, 'Passenger name cannot exceed 50 characters'],
    },
    passengerAge: {
      type: Number,
      required: [true, 'Passenger age is required'],
      min: [1, 'Passenger age must be at least 1'],
      max: [120, 'Passenger age cannot exceed 120'],
    },
    passengerGender: {
      type: String,
      required: [true, 'Passenger gender is required'],
      enum: ['Male', 'Female', 'Other'],
    },
    passengerPhone: {
      type: String,
      required: [true, 'Passenger phone is required'],
      match: [/^(\+91|91)?[6-9]\d{9}$/, 'Please enter a valid phone number'],
    },
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
  },
  bookingStatus: {
    type: String,
    enum: Object.values(BOOKING_STATUS),
    default: BOOKING_STATUS.PENDING,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Wallet', 'Cash'],
  },
  paymentId: {
    type: String,
  },
  cancellationReason: {
    type: String,
    trim: true,
  },
  cancelledAt: {
    type: Date,
  },
  refundAmount: {
    type: Number,
    min: [0, 'Refund amount cannot be negative'],
  },
  boardingPoint: {
    type: String,
    required: [true, 'Boarding point is required'],
    trim: true,
  },
  droppingPoint: {
    type: String,
    required: [true, 'Dropping point is required'],
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for better performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ bus: 1 });
bookingSchema.index({ route: 1 });
bookingSchema.index({ journeyDate: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ paymentStatus: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
