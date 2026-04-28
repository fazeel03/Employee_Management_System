import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full border-4 border-blue-600 border-t-transparent h-12 w-12 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Unauthorized component
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
      <div className="mb-4">
        <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page.
      </p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
);

/**
 * Protected Route Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authenticated
 * @param {string|string[]} props.roles - Required role(s) to access the route
 * @param {React.ReactNode} props.fallback - Component to render if not authenticated
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ 
  children, 
  roles = null, 
  fallback = null, 
  requireAuth = true 
}) => {
  const { isAuthenticated, isLoading, user, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return (
      <Navigate 
        to={`/login?returnUrl=${returnUrl}`} 
        replace 
        state={{ from: location }} 
      />
    );
  }

  // If specific roles are required, check user permissions
  if (roles && isAuthenticated) {
    const hasRequiredRole = Array.isArray(roles) 
      ? roles.some(role => hasRole(role))
      : hasRole(roles);

    if (!hasRequiredRole) {
      // Show unauthorized component or fallback
      return fallback || <Unauthorized />;
    }
  }

  // If user is authenticated and has required permissions, render children
  if (isAuthenticated) {
    return children;
  }

  // If no authentication required and user is not authenticated, render children
  if (!requireAuth) {
    return children;
  }

  // Default fallback
  return fallback || <Navigate to="/login" replace />;
};

/**
 * Admin Only Route Component
 * Only users with 'admin' role can access
 */
export const AdminRoute = ({ children, ...props }) => (
  <ProtectedRoute roles="admin" {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * Manager Route Component
 * Users with 'admin' or 'manager' roles can access
 */
export const ManagerRoute = ({ children, ...props }) => (
  <ProtectedRoute roles={['admin', 'manager']} {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * User Route Component
 * Any authenticated user can access
 */
export const UserRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={true} {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * HR Route Component
 * Users with 'admin' or 'hr' roles can access
 */
export const HRRoute = ({ children, ...props }) => (
  <ProtectedRoute roles={['admin', 'hr']} {...props}>
    {children}
  </ProtectedRoute>
);

/**
 * Public Route Component
 * Anyone can access (authenticated or not)
 */
export const PublicRoute = ({ children, ...props }) => (
  <ProtectedRoute requireAuth={false} {...props}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
