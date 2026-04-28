import axiosInstance from "./axiosInstance";

export const getEmployeeProjects = async () => {
  return axiosInstance.get('/employee-projects');
};

export const createEmployeeProject = (data) => {
  return axiosInstance.post("/employee-projects", data);
};

export const updateEmployeeProject = (id, data) => {
  console.log('UPDATE:', id, data);
  return axiosInstance.put(`/employee-projects/${id}`, data);
};

export const deleteEmployeeProject = (id) => {
  return axiosInstance.delete(`/employee-projects/${id}`);
};