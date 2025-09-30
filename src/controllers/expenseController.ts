import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { Bus } from '../models/Bus';
import { sendResponse } from '../utils/responseHandler';
import { HTTP_STATUS, API_MESSAGES } from '../constants';
import { logger } from '../utils/logger';

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();

    // Populate the expense with bus details
    await expense.populate('bus', 'busNumber busName');

    logger.info(`Expense created: ${expense.type} - ${expense.amount}`);
    return sendResponse(res, HTTP_STATUS.CREATED, true, 'Expense created successfully', expense);
  } catch (error) {
    logger.error('Error creating expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get all expenses with pagination and filters
export const getAllExpenses = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      bus,
      type,
      category,
      status,
      startDate,
      endDate,
    } = req.query;

    const filter: any = {};

    if (bus) filter.bus = bus;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const expenses = await Expense.find(filter)
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Expense.countDocuments(filter);

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, {
      expenses,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      },
    });
  } catch (error) {
    logger.error('Error fetching expenses:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Expense not found');
    }

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, expense);
  } catch (error) {
    logger.error('Error fetching expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Update expense
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const expense = await Expense.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Expense not found');
    }

    logger.info(`Expense updated: ${expense.type} - ${expense.amount}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Expense updated successfully', expense);
  } catch (error) {
    logger.error('Error updating expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Delete expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Expense not found');
    }

    logger.info(`Expense deleted: ${expense.type} - ${expense.amount}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Expense deleted successfully');
  } catch (error) {
    logger.error('Error deleting expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Approve expense
export const approveExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        notes,
      },
      { new: true, runValidators: true }
    )
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Expense not found');
    }

    logger.info(`Expense approved: ${expense.type} - ${expense.amount}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Expense approved successfully', expense);
  } catch (error) {
    logger.error('Error approving expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Reject expense
export const rejectExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        notes,
      },
      { new: true, runValidators: true }
    )
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return sendResponse(res, HTTP_STATUS.NOT_FOUND, false, 'Expense not found');
    }

    logger.info(`Expense rejected: ${expense.type} - ${expense.amount}`);
    return sendResponse(res, HTTP_STATUS.OK, true, 'Expense rejected successfully', expense);
  } catch (error) {
    logger.error('Error rejecting expense:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};

// Get expense analytics
export const getExpenseAnalytics = async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', startDate, endDate, bus } = req.query;

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.date = {
        $gte: startOfMonth,
        $lte: endOfMonth,
      };
    }

    const matchFilter: any = { ...dateFilter };
    if (bus) matchFilter.bus = bus;

    const analytics = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category',
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: '$count' },
          averageAmount: { $avg: '$averageAmount' },
          categories: {
            $push: {
              category: '$_id.category',
              amount: '$totalAmount',
              count: '$count',
            },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    const totalExpenses = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const result = {
      totalAmount: totalExpenses[0]?.totalAmount || 0,
      totalCount: totalExpenses[0]?.totalCount || 0,
      byType: analytics,
    };

    return sendResponse(res, HTTP_STATUS.OK, true, API_MESSAGES.SUCCESS, result);
  } catch (error) {
    logger.error('Error fetching expense analytics:', error);
    return sendResponse(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, API_MESSAGES.INTERNAL_ERROR);
  }
};
