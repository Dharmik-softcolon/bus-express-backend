import { User, IUser } from '../models/User';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/auth';
import config from '../config/config';
import { USER_ROLES } from '../constants';
import { RoleValidationService } from './roleValidationService';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: string;
  subrole?: string;
  createdBy?: string;
  company?: string;
  aadhaarCard?: string;
  position?: string;
  address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  phone?: string;
  address?: string;
  company?: string;
  position?: string;
  isActive?: boolean;
}

export interface UserFilters {
  role?: string;
  isActive?: boolean;
  search?: string;
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: userData.email }, { phone: userData.phone }]
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Validate role creation if creator is specified
    if (userData.createdBy && userData.role) {
      const validation = await RoleValidationService.canCreateRole(userData.createdBy, userData.role);
      if (!validation.canCreate) {
        throw new Error(validation.reason || 'Cannot create user with this role');
      }

      // Validate subrole if provided
      if (userData.subrole && !RoleValidationService.isValidSubrole(userData.role, userData.subrole)) {
        throw new Error(`Invalid subrole ${userData.subrole} for role ${userData.role}`);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      role: userData.role || USER_ROLES.CUSTOMER,
    });

    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });

    return { user, token, refreshToken };
  }

  async loginUser(loginData: LoginData): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Find user and include password
    const user = await User.findOne({ email: loginData.email }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated. Please contact support.');
    }

    // Compare password
    const isPasswordValid = await comparePassword(loginData.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    // Generate tokens
    const token = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const refreshToken = generateRefreshToken({ id: user._id });

    return { user, token, refreshToken };
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser | null> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Check if phone is being changed and if it's already taken
    if (updateData.phone && updateData.phone !== user.phone) {
      const existingUser = await User.findOne({ phone: updateData.phone });
      if (existingUser) {
        throw new Error('Phone number is already in use');
      }
    }

    return await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    user.password = hashedNewPassword;
    await user.save();
  }

  async getUsers(filters: UserFilters, pagination: { page: number; limit: number; skip: number }): Promise<{
    users: IUser[];
    total: number;
  }> {
    // Build filter
    const filter: any = {};
    if (filters.role) filter.role = filters.role;
    if (filters.isActive !== undefined) filter.isActive = filters.isActive;
    if (filters.search) {
      filter.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } },
      ];
    }

    console.log('UserService getUsers filter:', filter);
    console.log('UserService getUsers pagination:', pagination);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await User.countDocuments(filter);

    console.log('UserService found users:', users.length, 'total:', total);

    return { users, total };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    await User.findByIdAndDelete(userId);
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, config.jwt.REFRESH_SECRET || 'fallback-refresh-secret');
    
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const newToken = generateToken({ id: user._id, email: user.email, role: user.role, name: user.name });
    const newRefreshToken = generateRefreshToken({ id: user._id });

    return { token: newToken, refreshToken: newRefreshToken };
  }

  async getUserByRole(role: string): Promise<IUser | null> {
    return await User.findOne({ role, isActive: true });
  }

  async getUsersCount(filters: { role?: string; createdBy?: string } = {}): Promise<number> {
    const query: any = { isActive: true };
    
    if (filters.role) {
      query.role = filters.role;
    }
    
    if (filters.createdBy) {
      query.createdBy = filters.createdBy;
    }
    
    return await User.countDocuments(query);
  }
}
