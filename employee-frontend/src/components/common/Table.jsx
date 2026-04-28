import React from 'react';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

/**
 * Reusable Table Component - SaaS Standard
 * 
 * @param {Array} columns - Array of column definitions: [{ key, label, render }]
 * @param {Array} data - Array of data objects
 * @param {Boolean} loading - Loading state
 * @param {String} emptyMessage - Message when no data
 * @param {Function} renderActions - Optional function to render action buttons
 */
function Table({ 
  columns = [], 
  data = [], 
  loading = false, 
  emptyMessage = "No data available",
  renderActions = null
}) {
  
  if (loading) {
    return <LoadingState rows={5} columns={columns.length} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="bg-blue-600">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={`hover:bg-blue-50 transition-colors ${
                  rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-200'
                }`}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key || colIndex} 
                    className="px-6 py-4 text-sm text-gray-700"
                  >
                    {column.render 
                      ? column.render(row, column) 
                      : row[column.key] || '-'}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {renderActions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
