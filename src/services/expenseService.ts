import { Expense, IExpense } from '../models/Expense';
import { EXPENSE_STATUS } from '../constants';

export interface CreateExpenseData {
  trip?: string;
  type: string;
  amount: number;
  description: string;
  date: Date;
  receipt?: string;
  employee?: string;
}

export interface UpdateExpenseData {
  type?: string;
  amount?: number;
  description?: string;
  date?: Date;
  status?: string;
  receipt?: string;
}

export interface ExpenseFilters {
  type?: string;
  status?: string;
  tripId?: string;
  employeeId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class ExpenseService {
  async createExpense(expenseData: CreateExpenseData): Promise<IExpense> {
    const expense = new Expense({
      ...expenseData,
      status: EXPENSE_STATUS.PENDING,
    });

    await expense.save();
    return expense;
  }

  async getExpenseById(expenseId: string): Promise<IExpense | null> {
    return await Expense.findById(expenseId)
      .populate('trip', 'departureTime arrivalTime')
      .populate('employee', 'name phone');
  }

  async updateExpense(expenseId: string, updateData: UpdateExpenseData): Promise<IExpense | null> {
    return await Expense.findByIdAndUpdate(
      expenseId,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await Expense.findByIdAndDelete(expenseId);
  }

  async getExpenses(filters: ExpenseFilters = {}, page: number = 1, limit: number = 10): Promise<{ expenses: IExpense[]; total: number }> {
    const query: any = {};

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.tripId) {
      query.trip = filters.tripId;
    }

    if (filters.employeeId) {
      query.employee = filters.employeeId;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.date.$lte = new Date(filters.dateTo);
      }
    }

    const skip = (page - 1) * limit;
    const expenses = await Expense.find(query)
      .populate('trip', 'departureTime arrivalTime')
      .populate('employee', 'name phone')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Expense.countDocuments(query);

    return { expenses, total };
  }

  async getExpensesCount(filters: { 
    employeeId?: string; 
    tripId?: string; 
    status?: string 
  } = {}): Promise<number> {
    const query: any = {};
    
    if (filters.employeeId) {
      query.employee = filters.employeeId;
    }
    
    if (filters.tripId) {
      query.trip = filters.tripId;
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    return await Expense.countDocuments(query);
  }

  async getTotalExpenses(filters: { 
    employeeId?: string; 
    tripId?: string; 
    status?: string 
  } = {}): Promise<number> {
    const matchQuery: any = {};
    
    if (filters.employeeId) {
      matchQuery.employee = filters.employeeId;
    }
    
    if (filters.tripId) {
      matchQuery.trip = filters.tripId;
    }
    
    if (filters.status) {
      matchQuery.status = filters.status;
    }
    
    const result = await Expense.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    return result[0]?.total || 0;
  }
}
