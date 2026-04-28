import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
  role: null,
  isLoggingOut: false,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOGGING_OUT: 'SET_LOGGING_OUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role: action.payload.user?.role || null,
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: action.payload.user !== null,
        isLoading: false,
        error: null,
        role: action.payload.user?.role || null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role: action.payload?.role || null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload || null, // Only set error if payload exists
        role: null,
      };

    case AUTH_ACTIONS.SET_LOGGING_OUT:
      return {
        ...state,
        isLoggingOut: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        role: null,
        isLoggingOut: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        role: action.payload?.role || state.role,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API base URL - Use empty string since axiosInstance already has baseURL
  const API_URL = '';

  // Setup axios instance with token
  const setupAxiosInterceptors = (token) => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }
  };

  // Load user from token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token');
    
    if (!token) {
      // Don't set error for missing token - this is normal for first-time visitors
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      return;
    }

    try {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
      setupAxiosInterceptors(token);

      const response = await axiosInstance.get(`${API_URL}/auth/me`);
      
      console.log("AUTH CONTEXT /AUTH/ME RESPONSE:", response.data);
      console.log("AUTH CONTEXT USER DATA:", response.data.data);
      console.log("AUTH CONTEXT USER ROLE:", response.data.data?.role);
      
      if (response.data.success) {
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_SUCCESS, payload: response.data.data });
      } else {
        throw new Error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Load user error:', error);
      
      // ONLY clear token on 401/403 (auth errors), NOT on 500/network errors!
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token');
        localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ems_user');
        setupAxiosInterceptors(null);
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: 'Session expired' });
      } else {
        // For 500, network errors, etc - keep user logged in!
        dispatch({ type: AUTH_ACTIONS.LOAD_USER_FAILURE, payload: null });
      }
    }
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const response = await axiosInstance.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { token, user, tenant } = response.data.data;
        const normalizedUser = {
          ...user,
          tenant_id: tenant?.tenant_id ?? user?.tenant_id,
          tenant_key: tenant?.tenant_key ?? user?.tenant_key,
          tenant_name: tenant?.tenant_name ?? user?.tenant_name,
        };
        
        console.log("LOGIN RESPONSE USER:", normalizedUser);
        console.log("LOGIN USER ROLE:", normalizedUser.role);
        
        // Store token and user in localStorage
        localStorage.setItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token', token);
        localStorage.setItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ems_user', JSON.stringify(normalizedUser));
        
        // Setup axios headers
        setupAxiosInterceptors(token);
        
        // Update state
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { token, user: normalizedUser } });
        
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });

      const response = await axiosInstance.post(`${API_URL}/auth/register`, userData);

      if (response.data.success) {
        // Dispatch REGISTER_SUCCESS to clear loading state
        dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: { user: null, token: null } });
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout endpoint (optional, for server-side logging)
      if (state.token) {
        await axiosInstance.post(`${API_URL}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Set logging out flag first
      dispatch({ type: 'SET_LOGGING_OUT', payload: true });
      
      // Clear localStorage
      localStorage.removeItem(import.meta.env.VITE_TOKEN_STORAGE_KEY || 'ems_token');
      localStorage.removeItem(import.meta.env.VITE_USER_STORAGE_KEY || 'ems_user');
      
      // Clear axios headers
      setupAxiosInterceptors(null);
      
      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  }, [state.token]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Update user profile
  const updateUser = useCallback((userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
    localStorage.setItem(
      import.meta.env.VITE_USER_STORAGE_KEY || 'ems_user',
      JSON.stringify({ ...state.user, ...userData })
    );
  }, [state.user]);

  // Check if user has specific role
  const hasRole = useCallback((requiredRole) => {
    if (!state.user || !state.user.role) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(state.user.role);
    }
    
    return state.user.role === requiredRole;
  }, [state.user]);

  // Check if user is admin
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);

  // Check if user is manager
  const isManager = useCallback(() => hasRole('manager'), [hasRole]);

  // Check if user is regular user
  const isUser = useCallback(() => hasRole('employee'), [hasRole]);

  // Check if user is HR
  const isHR = useCallback(() => hasRole('hr'), [hasRole]);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Context value
  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    hasRole,
    isAdmin,
    isManager,
    isUser,
    isHR,
    loadUser,
  }), [
    state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    hasRole,
    isAdmin,
    isManager,
    isUser,
    isHR,
    loadUser
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
