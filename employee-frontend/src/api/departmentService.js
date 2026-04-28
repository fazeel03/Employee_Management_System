import axiosInstance from "./axiosInstance";

export const getDepartments = (page = 1, limit = 10, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (search) params.append('search', search);
  
  return axiosInstance.get(`/departments?${params.toString()}`);
};

export const createDepartment = (data) => {
  return axiosInstance.post("/departments", data);
};

export const updateDepartment = (id, data) => {
  return axiosInstance.put(`/departments/${id}`, data);
};

export const deleteDepartment = (id) => {
  return axiosInstance.delete(`/departments/${id}`);
};