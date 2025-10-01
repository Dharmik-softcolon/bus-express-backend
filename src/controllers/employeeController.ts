import { Request, Response } from 'express';
import { Employee } from '../models/Employee';
import { Bus } from '../models/Bus';
import { Trip } from '../models/Trip';
import { sendResponse } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES } from '../constants';
import { logger } from '../utils/logger';

// Create a new employee
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();

    logger.info(`Employee created: ${employee.name}`);
    return sendResponse(res, HTTP_STATUS.CREATED, true, 'Employee created successfully', employee);
  } catch (error) {
    logger.error('Error creating employee:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get all employees with pagination and filters
export const getAllEmployees = async (req: Request, res: Response) => {
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

    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Employee.countDocuments(filter);

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      employees,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching employees:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get employee by ID
export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Employee not found');
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

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      employee,
      assignedBuses,
      assignedTrips,
    });
  } catch (error) {
    logger.error('Error fetching employee:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update employee
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Employee not found');
    }

    logger.info(`Employee updated: ${employee.name}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee updated successfully', employee);
  } catch (error) {
    logger.error('Error updating employee:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Delete employee
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if employee is assigned to any buses
    const assignedBuses = await Bus.find({
      $or: [{ driver: id }, { helper: id }],
    });

    if (assignedBuses.length > 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Cannot delete employee assigned to buses');
    }

    // Check if employee has any upcoming trips
    const upcomingTrips = await Trip.find({
      $or: [{ driver: id }, { helper: id }],
      departureDate: { $gte: new Date() },
    });

    if (upcomingTrips.length > 0) {
      return sendResponse(res, HTTP_STATUS.BAD_REQUEST, false, 'Cannot delete employee with upcoming trips');
    }

    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Employee not found');
    }

    logger.info(`Employee deleted: ${employee.name}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee deleted successfully');
  } catch (error) {
    logger.error('Error deleting employee:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update employee status
export const updateEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const employee = await Employee.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Employee not found');
    }

    logger.info(`Employee status updated: ${employee.name} - ${status}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Employee status updated successfully', employee);
  } catch (error) {
    logger.error('Error updating employee status:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get employee statistics
export const getEmployeeStatistics = async (req: Request, res: Response) => {
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

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      totalEmployees,
      activeEmployees,
      byRole: stats,
    });
  } catch (error) {
    logger.error('Error fetching employee statistics:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};
