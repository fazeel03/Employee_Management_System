import axiosInstance from "./axiosInstance";

export const getLeaveRequests = (page = 1, limit = 10, empId = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (empId) params.append('emp_id', empId);
  
  return axiosInstance.get(`/leave-requests?${params.toString()}`);
};

export const createLeaveRequest = (data) => {
  return axiosInstance.post("/leave-requests", data);
};

export const updateLeaveRequest = (id, data) => {
  return axiosInstance.put(`/leave-requests/${id}`, data);
};

export const deleteLeaveRequest = (id) => {
  return axiosInstance.delete(`/leave-requests/${id}`);
};

export const getLeaveRequestById = (id) => {
  return axiosInstance.get(`/leave-requests/${id}`);
};

export const approveLeaveRequest = (id, approvedBy) => {
  return axiosInstance.put(`/leave-requests/${id}/approve`, { approved_by: approvedBy });
};

export const rejectLeaveRequest = (id, approvedBy) => {
  return axiosInstance.put(`/leave-requests/${id}/reject`, { approved_by: approvedBy });
};
