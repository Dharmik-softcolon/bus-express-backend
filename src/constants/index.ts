// Constants for API responses and configuration
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  MASTER_ADMIN_CREATED: 'Master admin created successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  BUS_CREATED: 'Bus created successfully',
  BUS_UPDATED: 'Bus updated successfully',
  BUS_DELETED: 'Bus deleted successfully',
  ROUTE_CREATED: 'Route created successfully',
  ROUTE_UPDATED: 'Route updated successfully',
  ROUTE_DELETED: 'Route deleted successfully',
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_UPDATED: 'Booking updated successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
} as const;

export const USER_ROLES = {
  MASTER_ADMIN: 'MASTER_ADMIN',
  BUS_OWNER: 'BUS_OWNER',
  BUS_ADMIN: 'BUS_ADMIN',
  BOOKING_MAN: 'BOOKING_MAN',
  BUS_EMPLOYEE: 'BUS_EMPLOYEE',
} as const;

export const BUS_EMPLOYEE_SUBROLES = {
  DRIVER: 'DRIVER',
  HELPER: 'HELPER',
} as const;

export const BUS_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  MAINTENANCE: 'maintenance',
} as const;

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const TRIP_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
} as const;

// Role hierarchy and creation rules
export const ROLE_HIERARCHY: Record<string, string[]> = {
  [USER_ROLES.MASTER_ADMIN]: [USER_ROLES.BUS_OWNER],
  [USER_ROLES.BUS_OWNER]: [USER_ROLES.BUS_ADMIN],
  [USER_ROLES.BUS_ADMIN]: [USER_ROLES.BOOKING_MAN, USER_ROLES.BUS_EMPLOYEE],
  [USER_ROLES.BOOKING_MAN]: [],
  [USER_ROLES.BUS_EMPLOYEE]: [],
};

// Role limits
export const ROLE_LIMITS = {
  [USER_ROLES.MASTER_ADMIN]: 1,
  [USER_ROLES.BUS_ADMIN]: 2, // per BUS_OWNER
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ON_LEAVE: 'on_leave',
  TERMINATED: 'terminated',
} as const;

export const EXPENSE_TYPES = {
  FUEL: 'fuel',
  MAINTENANCE: 'maintenance',
  TOLL: 'toll',
  PARKING: 'parking',
  REPAIR: 'repair',
  INSURANCE: 'insurance',
  OTHER: 'other',
} as const;

export const EXPENSE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
} as const;

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;

