import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request logging interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Log request details
  console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`, {
    baseURL: config.baseURL,
    fullURL: `${config.baseURL}${config.url}`,
    headers: config.headers,
  });
  
  return config;
});

// Handle errors globally with detailed logging
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // Log detailed error information
    console.error(`❌ API Error:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      responseData: error.response?.data,
      headers: error.config?.headers,
      isNetworkError: !error.response,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/profile';
    }
    
    return Promise.reject(error);
  }
);

export default api;