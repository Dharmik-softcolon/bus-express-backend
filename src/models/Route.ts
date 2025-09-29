import mongoose, { Schema, Document } from 'mongoose';

// Route interface
export interface IRoute extends Document {
  _id: string;
  routeName: string;
  from: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  to: {
    city: string;
    state: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  distance: number; // in kilometers
  duration: number; // in minutes
  stops: Array<{
    name: string;
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    arrivalTime?: string;
    departureTime?: string;
  }>;
  isActive: boolean;
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
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'From latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        required: [true, 'From longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
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
    coordinates: {
      latitude: {
        type: Number,
        required: [true, 'To latitude is required'],
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        required: [true, 'To longitude is required'],
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance cannot be negative'],
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative'],
  },
  stops: [{
    name: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
      },
      longitude: {
        type: Number,
        required: true,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
      },
    },
    arrivalTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
    },
    departureTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)'],
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for better performance
routeSchema.index({ 'from.city': 1, 'to.city': 1 });
routeSchema.index({ 'from.state': 1, 'to.state': 1 });
routeSchema.index({ isActive: 1 });

export const Route = mongoose.model<IRoute>('Route', routeSchema);

