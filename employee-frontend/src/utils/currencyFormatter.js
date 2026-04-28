/**
 * Currency formatting utility for consistent monetary displays
 * @param {number|string|null|undefined} amount - The monetary value to format
 * @param {Object} options - Formatting options
 * @param {string} options.currency - Currency symbol (default: '$')
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @param {number} options.minimumFractionDigits - Min decimal places (default: 0)
 * @param {number} options.maximumFractionDigits - Max decimal places (default: 0)
 * @param {string} options.displayValue - Value to show for null/undefined (default: 'N/A')
 * @returns {string} Formatted currency string or display value for invalid inputs
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = '$',
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    displayValue = 'N/A'
  } = options;

  // Handle null, undefined, empty string, or non-numeric values
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return displayValue;
  }

  // Convert to number
  const numericAmount = Number(amount);

  // Format using Intl.NumberFormat for proper locale-aware formatting
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD', // Using USD as base for formatting, but we'll replace with custom symbol
    minimumFractionDigits,
    maximumFractionDigits,
  });

  // Get formatted string and replace currency symbol with our custom one
  let formatted = formatter.format(numericAmount);
  
  // Replace the default currency symbol with our custom one
  if (currency !== '$') {
    formatted = formatted.replace('$', currency);
  }

  return formatted;
};

/**
 * Format currency without symbol (for input fields or calculations)
 * @param {number|string|null|undefined} amount - The monetary value to format
 * @returns {string} Formatted number string with commas (no decimals)
 */
export const formatNumber = (amount) => {
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    return '0';
  }

  const numericAmount = Number(amount);
  return numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

/**
 * Parse currency string back to number
 * @param {string} currencyString - Currency string like "$50,000.00"
 * @returns {number} Parsed numeric value
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString || typeof currencyString !== 'string') {
    return 0;
  }

  // Remove currency symbols and commas, then parse
  const cleanString = currencyString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanString);
  
  return isNaN(parsed) ? 0 : parsed;
};

// Default export for convenience
export default formatCurrency;
