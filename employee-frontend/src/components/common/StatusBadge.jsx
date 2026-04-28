import React from 'react';

/**
 * Reusable Status Badge Component
 * 
 * @param {String} status - Status text
 * @param {String} variant - Color variant: success, warning, danger, info, default
 */
function StatusBadge({ status, variant = 'default' }) {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    orange: 'bg-orange-100 text-orange-800',
    default: 'bg-gray-100 text-gray-800'
  };

  const colorClass = variants[variant] || variants.default;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
