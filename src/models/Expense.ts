import mongoose, { Schema, Document } from 'mongoose';
import { EXPENSE_TYPES, EXPENSE_STATUS } from '../constants';

// Expense interface
export interface IExpense extends Document {
  _id: string;
  bus: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  description: string;
  date: Date;
  category: string;
  status: string;
  receipt?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Expense schema
const expenseSchema = new Schema<IExpense>({
  bus: {
    type: Schema.Types.ObjectId,
    ref: 'Bus',
    required: [true, 'Bus is required'],
  },
  type: {
    type: String,
    enum: Object.values(EXPENSE_TYPES),
    required: [true, 'Expense type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Fuel', 'Maintenance', 'Toll', 'Parking', 'Repair', 'Insurance', 'Other'],
  },
  status: {
    type: String,
    enum: Object.values(EXPENSE_STATUS),
    default: EXPENSE_STATUS.PENDING,
  },
  receipt: {
    type: String,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
}, {
  timestamps: true,
});

// Index for better performance
expenseSchema.index({ bus: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ date: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });

export const Expense = mongoose.model<IExpense>('Expense', expenseSchema);
