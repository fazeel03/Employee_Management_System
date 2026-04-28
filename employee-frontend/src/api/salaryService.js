import axiosInstance from "./axiosInstance";

export const getSalaryHistory = (page = 1, limit = 10, empId = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (empId) params.append('emp_id', empId);
  
  return axiosInstance.get(`/salary-history?${params.toString()}`);
};

export const createSalaryHistory = (data) => {
  return axiosInstance.post("/salary-history", data);
};

export const updateSalaryHistory = (id, data) => {
  return axiosInstance.put(`/salary-history/${id}`, data);
};

export const deleteSalaryHistory = (id) => {
  return axiosInstance.delete(`/salary-history/${id}`);
};

export const getSalaryHistoryById = (id) => {
  return axiosInstance.get(`/salary-history/${id}`);
};
