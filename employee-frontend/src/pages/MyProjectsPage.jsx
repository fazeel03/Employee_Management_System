import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { getEmployeeProjects } from '../api/employeeProjectService';

const MyProjectsPage = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const response = await getEmployeeProjects();
      setProjects(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      planning: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1).replace('_', ' ') || 'Unknown'}
      </span>
    );
  };

  const getAllocationColor = (percentage) => {
    if (percentage >= 80) return 'text-red-600 bg-red-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return 'Unknown';
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
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
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">View your assigned projects and track your contributions</p>
        </div>
        <div className="text-sm text-gray-500">
          Active Projects: {projects.filter(p => p.status === 'active').length}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {projects.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {projects.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Allocation</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {projects.length > 0 
                  ? Math.round(projects.reduce((sum, p) => sum + (p.allocation_percent || 0), 0) / projects.length)
                  : 0
                }%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.project_id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Project Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{project.project_name}</h3>
                  <p className="text-sm text-gray-500">ID: {project.project_id}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>

              {/* Project Description */}
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {project.description || 'No description available'}
              </p>

              {/* Project Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium text-gray-900">{project.role_name || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Allocation:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAllocationColor(project.allocation_percent || 0)}`}>
                    {project.allocation_percent || 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Duration:</span>
                  <span className="text-gray-900">
                    {calculateDuration(project.start_date, project.end_date)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="text-gray-900">{formatDate(project.start_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">End Date:</span>
                  <span className="text-gray-900">{formatDate(project.end_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Assigned:</span>
                  <span className="text-gray-900">
                    {project.assigned_on ? new Date(project.assigned_on).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Progress Bar (for active projects) */}
              {project.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs text-gray-600">
                      {project.allocation_percent || 0}% allocated
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.allocation_percent || 0}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                <button
                  onClick={() => setSelectedProject(project)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  View Details
                </button>
                {project.status === 'active' && (
                  <button className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                    Update Progress
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No projects assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't been assigned to any projects yet.
          </p>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Project Details</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Project Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Project Overview</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Project Name:</span>
                      <span className="ml-2 text-gray-900">{selectedProject.project_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Project ID:</span>
                      <span className="ml-2 text-gray-900">{selectedProject.project_id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">{getStatusBadge(selectedProject.status)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Your Role:</span>
                      <span className="ml-2 text-gray-900">{selectedProject.role_name || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="text-gray-900">{formatDate(selectedProject.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="text-gray-900">{formatDate(selectedProject.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="text-gray-900">{calculateDuration(selectedProject.start_date, selectedProject.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned On:</span>
                      <span className="text-gray-900">
                        {selectedProject.assigned_on ? new Date(selectedProject.assigned_on).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProject.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-700">{selectedProject.description}</p>
                  </div>
                )}

                {/* Allocation */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Resource Allocation</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Your Allocation:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAllocationColor(selectedProject.allocation_percent || 0)}`}>
                      {selectedProject.allocation_percent || 0}%
                    </span>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${selectedProject.allocation_percent || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Tasks
                    </button>
                    <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Update Progress
                    </button>
                    <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      View Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
