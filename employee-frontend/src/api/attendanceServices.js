import axiosInstance from "./axiosInstance";

export const getAttendance = async () => {
  try {
    const response = await axiosInstance.get('/attendance');
    console.log('Attendance API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get Attendance Error:', error);
    throw error;
  }
};

export const createAttendance = (data) => {
  return axiosInstance.post("/attendance", data);
};

export const updateAttendance = (id, data) => {
  return axiosInstance.put(`/attendance/${id}`, data);
};

export const deleteAttendance = (id) => {
  return axiosInstance.delete(`/attendance/${id}`);
};