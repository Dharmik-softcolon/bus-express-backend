import mongoose, { Schema, Document } from 'mongoose';

// Route interface
export interface IRoute extends Document {
  _id: string;
  routeName: string;
  from: {
    city: string;
    state: string;
  };
  to: {
    city: string;
    state: string;
  };
  distance: number; // in kilometers
  time: number; // in minutes
  pickupPoints: Array<{
    name: string;
  }>;
  dropPoints: Array<{
    name: string;
  }>;
  fare: number; // in currency
  createdAt: Date;
  updatedAt: Date;
}

// Route schema
const routeSchema = new Schema<IRoute>({
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
    maxlength: [100, 'Route name cannot exceed 100 characters'],
  },
  from: {
    city: {
      type: String,
      required: [true, 'From city is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'From state is required'],
      trim: true,
    },
  },
  to: {
    city: {
      type: String,
      required: [true, 'To city is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'To state is required'],
      trim: true,
    },
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance cannot be negative'],
  },
  time: {
    type: Number,
    required: [true, 'Time is required'],
    min: [0, 'Time cannot be negative'],
  },
  pickupPoints: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Pickup point name cannot exceed 100 characters'],
    },
  }],
  dropPoints: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Drop point name cannot exceed 100 characters'],
    },
  }],
  fare: {
    type: Number,
    required: [true, 'Fare is required'],
    min: [0, 'Fare cannot be negative'],
  },
}, {
  timestamps: true,
});

// Index for better performance
routeSchema.index({ 'from.city': 1, 'to.city': 1 });
routeSchema.index({ 'from.state': 1, 'to.state': 1 });
routeSchema.index({ fare: 1 });

export const Route = mongoose.model<IRoute>('Route', routeSchema);

