import { Request, Response } from 'express';
import { Expense } from '../models/Expense';
import { Bus } from '../models/Bus';
import { asyncHandler } from '../utils/responseHandler';
import { sendSuccess, sendError, sendNotFound, sendCreated } from '../utils/responseHandler';
import { logError } from '../utils/logger';

// Create a new expense
export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();

    // Populate the expense with bus details
    await expense.populate('bus', 'busNumber busName');

    return sendCreated(res, expense, 'Expense created successfully');
  } catch (error) {
    logError('Error creating expense:', error);
    return sendError(res, 'Failed to create expense');
  }
});

// Get all expenses with pagination and filters
export const getAllExpenses = asyncHandler(async (req: Request, res: Response) => {
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

    const skip = (Number(page) - 1) * Number(limit);

    const expenses = await Expense.find(filter)
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Expense.countDocuments(filter);

    return sendSuccess(res, {
      expenses,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    }, 'Expenses retrieved successfully');
  } catch (error) {
    logError('Error fetching expenses:', error);
    return sendError(res, 'Failed to fetch expenses');
  }
});

// Get expense by ID
export const getExpenseById = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findById(id)
      .populate('bus', 'busNumber busName')
      .populate('approvedBy', 'name email');

    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    return sendSuccess(res, expense, 'Expense retrieved successfully');
  } catch (error) {
    logError('Error fetching expense:', error);
    return sendError(res, 'Failed to fetch expense');
  }
});

// Update expense
export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
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
      return sendNotFound(res, 'Expense not found');
    }

    return sendSuccess(res, expense, 'Expense updated successfully');
  } catch (error) {
    logError('Error updating expense:', error);
    return sendError(res, 'Failed to update expense');
  }
});

// Delete expense
export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return sendNotFound(res, 'Expense not found');
    }

    return sendSuccess(res, expense, 'Expense deleted successfully');
  } catch (error) {
    logError('Error deleting expense:', error);
    return sendError(res, 'Failed to delete expense');
  }
});

// Approve expense
export const approveExpense = asyncHandler(async (req: Request, res: Response) => {
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
      return sendNotFound(res, 'Expense not found');
    }

    return sendSuccess(res, expense, 'Expense approved successfully');
  } catch (error) {
    logError('Error approving expense:', error);
    return sendError(res, 'Failed to approve expense');
  }
});

// Reject expense
export const rejectExpense = asyncHandler(async (req: Request, res: Response) => {
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
      return sendNotFound(res, 'Expense not found');
    }

    return sendSuccess(res, expense, 'Expense rejected successfully');
  } catch (error) {
    logError('Error rejecting expense:', error);
    return sendError(res, 'Failed to reject expense');
  }
});

// Get expense analytics
export const getExpenseAnalytics = asyncHandler(async (req: Request, res: Response) => {
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

    return sendSuccess(res, result, 'Expense analytics retrieved successfully');
  } catch (error) {
    logError('Error fetching expense analytics:', error);
    return sendError(res, 'Failed to fetch expense analytics');
  }
});
