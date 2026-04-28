import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch complete profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/auth/me');
        
        if (response.data.success) {
          setProfileData(response.data.data);
        } else {
          setError(response.data.message || 'Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 
      ? names[0][0] + names[names.length - 1][0]
      : names[0][0];
  };

  // Safe name access with fallbacks
  const displayName = profileData?.name || profileData?.full_name || 'N/A';

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      hr: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      user: 'bg-gray-100 text-gray-800'
    };
    return colors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and account details</p>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {getInitials(displayName)}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {displayName}
              </h2>
              <p className="text-gray-600 mb-3">
                {profileData.email || 'N/A'}
              </p>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getRoleBadgeColor(profileData.role)}`}>
                {profileData.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Personal Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Full Name</label>
                <p className="text-gray-900 font-medium">
                  {displayName}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Email Address</label>
                <p className="text-gray-900 font-medium">
                  {profileData.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Phone Number</label>
                <p className="text-gray-900 font-medium">
                  {profileData.phone || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Account Status</label>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {profileData.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Work Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Role</label>
                <p className="text-gray-900 font-medium capitalize">
                  {profileData.role || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Department</label>
                <p className="text-gray-900 font-medium">
                  {profileData.department || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Position</label>
                <p className="text-gray-900 font-medium">
                  {profileData.position || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Employee ID</label>
                <p className="text-gray-900 font-medium">
                  {profileData.emp_id || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Account Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Account Created</label>
                <p className="text-gray-900 font-medium">
                  {profileData.created_at 
                    ? new Date(profileData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Last Login</label>
                <p className="text-gray-900 font-medium">
                  {profileData.last_login 
                    ? new Date(profileData.last_login).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'N/A'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Account Type</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profileData.role)}`}>
                  {profileData.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
