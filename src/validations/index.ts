// Export all validation functions
export * from './authValidation';
export * from './busValidation';
export * from './routeValidation';
export * from './bookingValidation';
export * from './commonValidation';
export * from './tripValidation';
// export * from './employeeValidation'; // File not found
export * from './expenseValidation';
export * from './analyticsValidation';

// Export search validation with specific exports to avoid conflicts
export {
  searchBusesValidation,
  getPopularRoutesValidation as getPopularRoutesSearchValidation,
  getAvailableSeatsValidation,
  getTripDetailsValidation,
  getSearchSuggestionsValidation
} from './searchValidation';

