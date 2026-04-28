import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  };

  // Safe name access with fallbacks
  const displayName = user?.name || user?.full_name || 'N/A';

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hr: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Profile Content */}
          <div className="p-6">
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials(displayName)}
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {displayName}
              </h2>
              <p className="text-gray-600 mb-3">
                {user.email || 'N/A'}
              </p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
              </span>
            </div>

            {/* Additional Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Phone:</span>
                <span className="text-gray-900 font-medium">
                  {user.phone || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Department:</span>
                <span className="text-gray-900 font-medium">
                  {user.department || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Position:</span>
                <span className="text-gray-900 font-medium">
                  {user.position || 'N/A'}
                </span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Status:</span>
                <span className="text-green-600 font-medium">
                  {user.status || 'Active'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onClose();
                    navigate('/settings');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/profile');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  View Full Profile
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
