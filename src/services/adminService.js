
export const API_URL = "http://localhost:5000";

// ==========================================
// ADMIN API REQUEST HELPER
// ==========================================

export const apiRequest = async (endpoint, options = {}) => {
  const adminToken = localStorage.getItem("adminToken");

  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    // Response may not contain valid JSON.
  }

  if (!response.ok) {
    throw new Error(
      data?.message || "Something went wrong. Please try again."
    );
  }

  return data;
};
