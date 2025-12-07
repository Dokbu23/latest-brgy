import api from "./axios";

export const login = async (email, password) => {
  return api.post('/api/login', { email, password });
};

export const register = async (data) => {
  return api.post('/api/register', data);
};

export const logout = async () => {
  await api.post('/api/logout');
};

export const getCars = async () => {
  return api.get('/api/v1/cars');
};