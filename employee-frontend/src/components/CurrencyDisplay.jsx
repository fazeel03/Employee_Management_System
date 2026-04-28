import { formatCurrency } from '../utils/currencyFormatter';

/**
 * Professional Currency Display Component
 * Renders monetary amounts with consistent formatting and styling
 */
const CurrencyDisplay = ({ 
  amount, 
  className = '', 
  displayValue = 'N/A',
  color = 'text-green-600',
  fontWeight = 'font-medium'
}) => {
  const formattedAmount = formatCurrency(amount, { displayValue });

  // Don't apply styling to N/A or placeholder values
  if (formattedAmount === displayValue) {
    return <span className={`text-gray-500 ${className}`}>{formattedAmount}</span>;
  }

  return (
    <span className={`${color} ${fontWeight} ${className}`}>
      {formattedAmount}
    </span>
  );
};

export default CurrencyDisplay;
