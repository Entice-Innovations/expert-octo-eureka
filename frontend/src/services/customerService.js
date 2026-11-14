
const API_URL = "http://localhost:5000";

// CUSTOMER LOGIN
export const loginCustomer = async (loginValue, password) => {
  const response = await fetch(`${API_URL}/api/customers/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      loginValue,
      password,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Invalid login details.");
  }

  return data;
};

// CUSTOMER REGISTRATION
export const registerCustomer = async (customerData) => {
  const response = await fetch(`${API_URL}/api/customers/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Unable to create your account.");
  }

  return data;
};

// SEND FORGOT PASSWORD OTP
export const sendPasswordResetOtp = async (loginValue) => {
  const response = await fetch(
    `${API_URL}/api/customers/forgot-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginValue,
        method: "email",
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to send OTP.");
  }

  return data;
};

// VERIFY PASSWORD RESET OTP
export const verifyPasswordResetOtp = async (loginValue, otp) => {
  const response = await fetch(
    `${API_URL}/api/customers/verify-reset-otp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginValue,
        otp,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Invalid OTP.");
  }

  return data;
};

// RESET CUSTOMER PASSWORD
export const resetCustomerPassword = async (
  loginValue,
  resetToken,
  newPassword
) => {
  const response = await fetch(
    `${API_URL}/api/customers/reset-password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        loginValue,
        resetToken,
        newPassword,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to reset password.");
  }

  return data;
};
