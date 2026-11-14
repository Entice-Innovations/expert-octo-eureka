
const API_URL = "http://localhost:5000";

// SUBMIT CUSTOMER ENQUIRY
export const submitEnquiry = async (enquiryData) => {
  const response = await fetch(`${API_URL}/api/enquiries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(enquiryData),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || "Unable to send your enquiry."
    );
  }

  return result;
};

