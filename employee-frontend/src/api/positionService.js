import axiosInstance from "./axiosInstance";

export const getPositions = async () => {
  const response = await axiosInstance.get('/positions');
  return response.data;
};

export const createPosition = (data) => {
  return axiosInstance.post("/positions", data);
};

export const updatePosition = (id, data) => {
  return axiosInstance.put(`/positions/${id}`, data);
};

export const deletePosition = (id) => {
  return axiosInstance.delete(`/positions/${id}`);
};