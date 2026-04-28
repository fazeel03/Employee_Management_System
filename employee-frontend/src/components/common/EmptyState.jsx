import React from 'react';

function EmptyState({ message = "No data available", icon = "📋" }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-6xl mb-4">{icon}</div>
        <p className="text-gray-500 text-base font-medium">{message}</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later</p>
      </div>
    </div>
  );
}

export default EmptyState;
