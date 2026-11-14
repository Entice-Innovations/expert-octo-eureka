
export const API_URL = "http://localhost:5000";

// ==========================================
// GET CUSTOMER PROFILE
// ==========================================

export const getCustomerProfile = async (customerId, token) => {
  const response = await fetch(
    `${API_URL}/api/customers/${customerId}`,
    {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to load customer.");
  }

  return data;
};

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

export const createRazorpayOrder = async (amount, token) => {
  const response = await fetch(
    `${API_URL}/api/payments/razorpay/order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to start the payment.");
  }

  return data;
};

// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

export const verifyRazorpayPayment = async (razorpayResponse, token) => {
  const response = await fetch(
    `${API_URL}/api/payments/razorpay/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(
      data.message || "We could not confirm your payment yet."
    );
  }

  return data;
};
