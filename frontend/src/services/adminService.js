
export const API_URL = "http://localhost:5000";

// ==========================================
// ADMIN API REQUEST HELPER
// ==========================================

export const apiRequest = async (endpoint, options = {}) => {
  const adminToken = localStorage.getItem("adminToken");

  console.log("Admin token exists:", Boolean(adminToken));

  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }

  console.log("Authorization header exists:", Boolean(headers.Authorization));

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  console.log("Response status:", response.status);

  let data;

  try {
    data = await response.json();
  } catch {
    // Response may not contain valid JSON.
  }

  if (!response.ok) {
    throw new Error(data?.message || "Something went wrong.");
  }

  return data;
};
