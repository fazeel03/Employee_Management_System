import axiosInstance from "./axiosInstance";

export const getProjects = (page = 1, limit = 10, search = "") => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (search) params.append('search', search);
  
  return axiosInstance.get(`/projects?${params.toString()}`);
};

export const createProject = (data) => {
  return axiosInstance.post("/projects", data);
};

export const updateProject = (id, data) => {
  return axiosInstance.put(`/projects/${id}`, data);
};

export const deleteProject = (id) => {
  return axiosInstance.delete(`/projects/${id}`);
};