import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const TeamLeaveRequestsPage = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, [filter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await axios.get(`/api/v1/manager/team-leaves${params}`);
      setLeaveRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = async (leaveId, action, comments = '') => {
    try {
      setActionLoading(leaveId);
      await axios.put(`/api/v1/manager/leave-requests/${leaveId}/approve`, {
        action,
        comments
      });
      
      // Refresh the list
      await fetchLeaveRequests();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error processing leave request:', error);
      alert('Error processing leave request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const typeColors = {
      sick: 'bg-red-50 text-red-700 border border-red-200',
      casual: 'bg-blue-50 text-blue-700 border border-blue-200',
      annual: 'bg-green-50 text-green-700 border border-green-200',
      maternity: 'bg-purple-50 text-purple-700 border border-purple-200',
      paternity: 'bg-indigo-50 text-indigo-700 border border-indigo-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md ${typeColors[type] || 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
        {type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'}
      </span>
    );
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Leave Requests</h1>
          <p className="text-gray-600 mt-2">Review and approve leave requests from your team members</p>
        </div>
        <div className="flex space-x-2">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            {leaveRequests.filter(r => r.approval_status === 'pending').length} Pending
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'pending' && (
                  <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                    {leaveRequests.filter(r => r.approval_status === 'pending').length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {leaveRequests.map((request) => (
          <div key={request.leave_id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                {/* Request Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{request.employee_name}</h3>
                    <span className="text-sm text-gray-500">{request.employee_code}</span>
                    {getLeaveTypeBadge(request.leave_type)}
                    {getStatusBadge(request.approval_status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {calculateDays(request.start_date, request.end_date)} days
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Requested: {new Date(request.requested_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="text-sm text-gray-700">
                    <strong>Reason:</strong> {request.reason}
                  </div>

                  {request.approved_by_name && (
                    <div className="text-sm text-gray-500 mt-2">
                      Processed by: {request.approved_by_name}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col space-y-2">
                  {request.approval_status === 'pending' && (
                    <>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => handleLeaveAction(request.leave_id, 'approve')}
                        disabled={actionLoading === request.leave_id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === request.leave_id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleLeaveAction(request.leave_id, 'reject')}
                        disabled={actionLoading === request.leave_id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === request.leave_id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                  {request.approval_status !== 'pending' && (
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {leaveRequests.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'pending' ? 'No pending leave requests' : `No ${filter} leave requests`}
          </p>
        </div>
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Leave Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Employee Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Employee Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 text-gray-900">{selectedRequest.employee_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Employee Code:</span>
                      <span className="ml-2 text-gray-900">{selectedRequest.employee_code}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedRequest.employee_email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Leave Type:</span>
                      <span className="ml-2">{getLeaveTypeBadge(selectedRequest.leave_type)}</span>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Leave Details</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(selectedRequest.start_date).toLocaleDateString()} - {new Date(selectedRequest.end_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Days:</span>
                      <span className="ml-2 text-gray-900">{calculateDays(selectedRequest.start_date, selectedRequest.end_date)} days</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Requested on:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedRequest.requested_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedRequest.approval_status)}</span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Reason for Leave</h3>
                  <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
                </div>

                {/* Actions */}
                {selectedRequest.approval_status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => handleLeaveAction(selectedRequest.leave_id, 'approve')}
                      disabled={actionLoading === selectedRequest.leave_id}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {actionLoading === selectedRequest.leave_id ? 'Processing...' : 'Approve Request'}
                    </button>
                    <button
                      onClick={() => handleLeaveAction(selectedRequest.leave_id, 'reject')}
                      disabled={actionLoading === selectedRequest.leave_id}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {actionLoading === selectedRequest.leave_id ? 'Processing...' : 'Reject Request'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeaveRequestsPage;
