import { Request, Response } from 'express';
import { Employee } from '../models/Employee';
import { Bus } from '../models/Bus';
import { Trip } from '../models/Trip';
import { asyncHandler } from '../utils/responseHandler';
import { sendSuccess, sendError, sendNotFound, sendBadRequest, sendCreated } from '../utils/responseHandler';
import { logError } from '../utils/logger';

// Create a new employee
export const createEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check role hierarchy permissions
    const userRole = (req as any).user?.role;
    const targetRole = req.body.role;
    
    // Define role hierarchy
    const roleHierarchy: Record<string, string[]> = {
      'MASTER_ADMIN': ['BUS_OWNER'],
      'BUS_OWNER': ['BUS_ADMIN'],
      'BUS_ADMIN': ['BUS_EMPLOYEE', 'BOOKING_MAN']
    };
    
    // Check if user can create the target role
    if (!userRole || !roleHierarchy[userRole]?.includes(targetRole)) {
      return sendBadRequest(res, `You don't have permission to create ${targetRole} role`);
    }
    
    const employee = new Employee(req.body);
    await employee.save();

    return sendCreated(res, employee, 'Employee created successfully');
  } catch (error) {
    logError('Error creating employee:', error);
    return sendError(res, 'Failed to create employee');
  }
});

// Get all employees with pagination and filters
export const getAllEmployees = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
    } = req.query;

    const filter: any = {};

    if (role) filter.role = role;
    if (status) filter.status = status;
    
    // Handle role filter from URL params
    if (req.params.role) {
      filter.role = req.params.role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Employee.countDocuments(filter);

    return sendSuccess(res, {
      employees,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Employees retrieved successfully');
  } catch (error) {
    logError('Error fetching employees:', error);
    return sendError(res, 'Failed to fetch employees');
  }
});

// Get employee by ID
export const getEmployeeById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return sendNotFound(res, 'Employee not found');
    }

    // Get assigned buses for drivers
    let assignedBuses = [];
    if (employee.role === 'driver') {
      assignedBuses = await Bus.find({ driver: id })
        .select('busNumber busName type status');
    }

    // Get assigned trips
    const assignedTrips = await Trip.find({
      $or: [{ driver: id }, { helper: id }],
    })
      .populate('route', 'routeName from to')
      .populate('bus', 'busNumber busName')
      .select('tripNumber departureDate departureTime status')
      .sort({ departureDate: -1 })
      .limit(10);

    return sendSuccess(res, {
      employee,
      assignedBuses,
      assignedTrips,
    }, 'Employee retrieved successfully');
  } catch (error) {
    logError('Error fetching employee:', error);
    return sendError(res, 'Failed to fetch employee');
  }
});

// Update employee
export const updateEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return sendNotFound(res, 'Employee not found');
    }

    return sendSuccess(res, employee, 'Employee updated successfully');
  } catch (error) {
    logError('Error updating employee:', error);
    return sendError(res, 'Failed to update employee');
  }
});

// Delete employee
export const deleteEmployee = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if employee is assigned to any buses
    const assignedBuses = await Bus.find({
      $or: [{ driver: id }, { helper: id }],
    });

    if (assignedBuses.length > 0) {
      return sendBadRequest(res, 'Cannot delete employee assigned to buses');
    }

    // Check if employee has any upcoming trips
    const upcomingTrips = await Trip.find({
      $or: [{ driver: id }, { helper: id }],
      departureDate: { $gte: new Date() },
    });

    if (upcomingTrips.length > 0) {
      return sendBadRequest(res, 'Cannot delete employee with upcoming trips');
    }

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return sendNotFound(res, 'Employee not found');
    }

    return sendSuccess(res, employee, 'Employee deleted successfully');
  } catch (error) {
    logError('Error deleting employee:', error);
    return sendError(res, 'Failed to delete employee');
  }
});

// Update employee status
export const updateEmployeeStatus = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return sendNotFound(res, 'Employee not found');
    }

    return sendSuccess(res, employee, 'Employee status updated successfully');
  } catch (error) {
    logError('Error updating employee status:', error);
    return sendError(res, 'Failed to update employee status');
  }
});

// Get employee statistics
export const getEmployeeStatistics = asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          inactive: {
            $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
          },
        },
      },
    ]);

    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });

    return sendSuccess(res, {
      totalEmployees,
      activeEmployees,
      byRole: stats,
    }, 'Employee statistics retrieved successfully');
  } catch (error) {
    logError('Error fetching employee statistics:', error);
    return sendError(res, 'Failed to fetch employee statistics');
  }
});
