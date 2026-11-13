
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pages/AdminDashboard.css";
import logo from "../../assets/logo.png";

import {
  API_URL,
  apiRequest,
} from "../../services/adminService";

const emptyCustomer = { name: "", email: "", phone: "", password: "" };
const emptyProject = {
  name: "",
  type: "",
  eventDate: "",
  status: "NOT STARTED",
  progress: 0,
};
const emptyPayment = { total: "", paid: "" };
const emptyRecordPayment = {
  amount: "",
  method: "Cash",
  reference: "",
  note: "",
};
const emptyDocument = { name: "", file: null };
const enquiryStatuses = ["New", "Contacted", "Follow-up", "Booked", "Closed"];

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [customers, setCustomers] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [enquiriesLoading, setEnquiriesLoading] = useState(false);
  const [enquiryNotes, setEnquiryNotes] = useState({});
  const [updatingEnquiryId, setUpdatingEnquiryId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);

  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [projectForm, setProjectForm] = useState(emptyProject);
  const [paymentForm, setPaymentForm] = useState(emptyPayment);
  const [recordPaymentForm, setRecordPaymentForm] = useState(emptyRecordPayment);
  const [documentForm, setDocumentForm] = useState(emptyDocument);

  const adminToken = localStorage.getItem("adminToken");

  const showSuccess = useCallback((message) => {
    setSuccess(message);
    setError("");
    window.setTimeout(() => setSuccess(""), 3500);
  }, []);

  const showError = useCallback((message) => {
    setError(message || "Something went wrong. Please try again.");
    setSuccess("");
    window.setTimeout(() => setError(""), 5000);
  }, []);

/* =========================================================
     LOAD CUSTOMERS
  ========================================================= */

const loadCustomers = useCallback(async () => {
  try {
    const data = await apiRequest("/api/admin/customers");

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.customers)
        ? data.customers
        : Array.isArray(data.data)
          ? data.data
          : [];

    setCustomers(list);
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}, [apiRequest, showError]);

  /* =========================================================
     LOAD ENQUIRIES
  ========================================================= */

  const loadEnquiries = useCallback(async () => {
    try {
      setEnquiriesLoading(true);

      const data = await apiRequest("/api/admin/enquiries");
      const list = Array.isArray(data.enquiries) ? data.enquiries : [];

      setEnquiries(list);

      setEnquiryNotes((previous) => {
        const next = { ...previous };

        list.forEach((item) => {
          if (!(item._id in next)) {
            next[item._id] = item.internalNotes || "";
          }
        });

        return next;
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setEnquiriesLoading(false);
    }
  }, [apiRequest, showError]);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */
useEffect(() => {
  if (!adminToken) {
    navigate("/admin/login");
    return;
  }

  const timer = setTimeout(() => {
    loadCustomers();
  }, 0);

  return () => clearTimeout(timer);
}, [adminToken, navigate, loadCustomers]);

  /* =========================================================
     REFRESH CUSTOMER
  ========================================================= */

  const refreshCustomer = async (customerId) => {
    if (!customerId) return;

    try {
      const data = await apiRequest(`/api/customers/${customerId}`);
      const customer = data.customer || data.data || data;

      setSelectedCustomer(customer);

      setCustomers((previous) =>
        previous.map((item) =>
          String(item._id) === String(customerId) ? customer : item
        )
      );
    } catch (err) {
      showError(err.message);
    }
  };

  /* =========================================================
     UPDATE ENQUIRY
  ========================================================= */

  const updateEnquiry = async (enquiryId, updates) => {
    try {
      setUpdatingEnquiryId(enquiryId);

      const data = await apiRequest(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });

      if (!data.enquiry) {
        throw new Error(
          "The updated enquiry was not returned by the server."
        );
      }

      setEnquiries((previous) =>
        previous.map((item) =>
          String(item._id) === String(enquiryId) ? data.enquiry : item
        )
      );

      setEnquiryNotes((previous) => ({
        ...previous,
        [enquiryId]: data.enquiry.internalNotes || "",
      }));

      showSuccess(data.message || "Enquiry updated successfully.");
    } catch (err) {
      showError(err.message);
      await loadEnquiries();
    } finally {
      setUpdatingEnquiryId("");
    }
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  /* =========================================================
     CUSTOMER WORKSPACE HELPERS
  ========================================================= */

  const openCustomerWorkspace = async (customer) => {
    setSelectedCustomer(customer);
    await refreshCustomer(customer._id);
  };

  const closeCustomerWorkspace = () => {
    setSelectedCustomer(null);
  };

  /* =========================================================
     CUSTOMER ACTIONS
  ========================================================= */

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({ ...emptyCustomer });
    setShowCustomerModal(true);
  };

  const openEditCustomer = (customer) => {
    setEditingCustomer(customer);

    setCustomerForm({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      password: "",
    });

    setShowCustomerModal(true);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();

    if (!customerForm.name.trim()) {
      return showError("Customer name is required.");
    }

    if (!customerForm.email.trim()) {
      return showError("Customer email is required.");
    }

    try {
      setSaving(true);

      const editing = Boolean(editingCustomer);

      const data = editing
        ? await apiRequest(`/api/customers/${editingCustomer._id}`, {
            method: "PUT",
            body: JSON.stringify({
              name: customerForm.name,
              email: customerForm.email,
              phone: customerForm.phone,
            }),
          })
        : await apiRequest("/api/customers/register", {
            method: "POST",
            body: JSON.stringify(customerForm),
          });

      const customer = data.customer || data.data || data;

      setShowCustomerModal(false);
      await loadCustomers();

      if (customer?._id) {
        setSelectedCustomer(customer);
      }

      showSuccess(
        editing
          ? "Customer updated successfully."
          : "Customer created successfully."
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCustomer = async (customer) => {
    if (
      !window.confirm(
        `Delete customer "${customer.name}"?\n\nThis action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await apiRequest(`/api/customers/${customer._id}`, {
        method: "DELETE",
      });

      if (String(selectedCustomer?._id) === String(customer._id)) {
        setSelectedCustomer(null);
      }

      await loadCustomers();
      showSuccess("Customer deleted successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     PROJECT ACTIONS
  ========================================================= */

  const openProjectModal = (customer) => {
    setEditingProject(customer);

    setProjectForm({
      name: customer.project?.name || "",
      type: customer.project?.type || "",
      eventDate: customer.project?.eventDate
        ? String(customer.project.eventDate).slice(0, 10)
        : "",
      status: customer.project?.status || "NOT STARTED",
      progress: Number(customer.project?.progress || 0),
    });

    setShowProjectModal(true);
  };

  const saveProject = async (event) => {
    event.preventDefault();

    if (!editingProject) return;

    try {
      setSaving(true);

      await apiRequest(`/api/customers/${editingProject._id}/project`, {
        method: "PUT",
        body: JSON.stringify({
          ...projectForm,
          progress: Number(projectForm.progress),
        }),
      });

      await refreshCustomer(editingProject._id);
      await loadCustomers();

      setShowProjectModal(false);
      showSuccess("Project details updated.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     PAYMENT ACTIONS
  ========================================================= */

  const openPaymentModal = (customer) => {
    setEditingPayment(customer);

    setPaymentForm({
      total: customer.payment?.total ?? "",
      paid: customer.payment?.paid ?? "",
    });

    setShowPaymentModal(true);
  };

  const savePaymentDetails = async (event) => {
    event.preventDefault();

    if (!editingPayment) return;

    try {
      setSaving(true);

      await apiRequest(
        `/api/admin/customers/${editingPayment._id}/payment`,
        {
          method: "PUT",
          body: JSON.stringify({
            total: Number(paymentForm.total || 0),
            paid: Number(paymentForm.paid || 0),
          }),
        }
      );

      await refreshCustomer(editingPayment._id);
      await loadCustomers();

      setShowPaymentModal(false);
      showSuccess("Payment details updated.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openRecordPaymentModal = (customer) => {
    setEditingPayment(customer);
    setRecordPaymentForm({ ...emptyRecordPayment });
    setShowRecordPaymentModal(true);
  };

  const saveRecordedPayment = async (event) => {
    event.preventDefault();

    if (!editingPayment) return;

    const amount = Number(recordPaymentForm.amount || 0);

    if (amount <= 0) {
      return showError("Enter a valid payment amount.");
    }

    try {
      setSaving(true);

      await apiRequest(
        `/api/admin/customers/${editingPayment._id}/payment`,
        {
          method: "PUT",
          body: JSON.stringify({
            amount,
            method: recordPaymentForm.method,
            reference: recordPaymentForm.reference,
            note: recordPaymentForm.note,
          }),
        }
      );

      await refreshCustomer(editingPayment._id);
      await loadCustomers();

      setShowRecordPaymentModal(false);
      setRecordPaymentForm({ ...emptyRecordPayment });

      showSuccess("Payment recorded successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendPaymentWhatsApp = (customer) => {
    if (!customer?.phone) {
      return showError("Customer phone number is not available.");
    }

    const payment = customer.payment || {};
    const total = Number(payment.total || 0);
    const paid = Number(payment.paid || 0);
    const balance = Math.max(total - paid, 0);

    const message = `Hello ${customer.name || "Customer"}! 👋

🧾 *INFINITY PIXEL STUDIOS*
*ORDER CONFIRMATION*

━━━━━━━━━━━━━━━━━━
📌 *Order Details*
━━━━━━━━━━━━━━━━━━
🆔 Order ID: ${customer.clientId || "-"}
📸 Project: ${customer.project?.name || "Not assigned"}

━━━━━━━━━━━━━━━━━━
💰 *Payment Summary*
━━━━━━━━━━━━━━━━━━
🛍️ Total Amount: ₹${total.toLocaleString("en-IN")}
✅ Amount Paid: ₹${paid.toLocaleString("en-IN")}
⏳ Balance Due: ₹${balance.toLocaleString("en-IN")}

━━━━━━━━━━━━━━━━━━
Thank you for choosing *Infinity Pixel Studios*! 💛

We appreciate your trust in us.
For any queries, please contact our studio.

✨ Capturing your beautiful moments!`;

    let phone = String(customer.phone).replace(/\D/g, "");
    if (phone.length === 10) phone = `91${phone}`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================================
     DOCUMENT ACTIONS
  ========================================================= */

  const openDocumentModal = (customer) => {
    setEditingCustomer(customer);
    setDocumentForm({ ...emptyDocument });
    setShowDocumentModal(true);
  };

  const uploadDocument = async (event) => {
    event.preventDefault();

    if (!editingCustomer) return;

    if (!documentForm.file) {
      return showError("Please select a document.");
    }

    try {
      setSaving(true);

      const formData = new FormData();

      // Must match upload.single("document") in server.js.
      formData.append("document", documentForm.file);

      if (documentForm.name.trim()) {
        formData.append("name", documentForm.name.trim());
      }

      await apiRequest(
        `/api/customers/${editingCustomer._id}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      await refreshCustomer(editingCustomer._id);

      setShowDocumentModal(false);
      setDocumentForm({ ...emptyDocument });

      showSuccess("Document uploaded successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteDocument = async (customer, document) => {
    if (
      !window.confirm(
        `Delete "${document.name || "this document"}"?`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await apiRequest(
        `/api/customers/${customer._id}/documents/${document._id}`,
        { method: "DELETE" }
      );

      await refreshCustomer(customer._id);
      showSuccess("Document deleted successfully.");
    } catch (err) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const statistics = useMemo(() => {
    const totals = customers.reduce(
      (result, customer) => {
        const payment = customer.payment || {};
        const total = Number(payment.total || 0);
        const paid = Number(payment.paid || 0);

        result.totalRevenue += total;
        result.totalPaid += paid;
        result.totalBalance += Math.max(total - paid, 0);

        return result;
      },
      { totalRevenue: 0, totalPaid: 0, totalBalance: 0 }
    );

    return {
      customers: customers.length,
      projects: customers.filter(
        (customer) =>
          customer.project?.name &&
          customer.project.name !== "No project assigned"
      ).length,
      ...totals,
    };
  }, [customers]);

  const paymentHistory = selectedCustomer?.payment?.history || [];
  const documents = selectedCustomer?.documents || [];

  /* =========================================================
     CUSTOMER WORKSPACE
  ========================================================= */

  const renderCustomerWorkspace = () => {
    if (!selectedCustomer) return null;

    const payment = selectedCustomer.payment || {};
    const project = selectedCustomer.project || {};

    const total = Number(payment.total || 0);
    const paid = Number(payment.paid || 0);
    const balance = Math.max(total - paid, 0);

    return (
      <div className="admin-section customer-workspace">
        <div className="customer-workspace-header">
          <button
            type="button"
            className="admin-back-button"
            onClick={closeCustomerWorkspace}
          >
            ← Back to Customers
          </button>

          <div className="customer-workspace-title">
            <div className="customer-avatar large">
              {(selectedCustomer.name || "C")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <span className="section-kicker">CUSTOMER WORKSPACE</span>
              <h2>{selectedCustomer.name || "Customer"}</h2>
              <p>{selectedCustomer.clientId || "No Client ID"}</p>
            </div>
          </div>

          <div className="customer-workspace-actions">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => openEditCustomer(selectedCustomer)}
            >
              Edit Customer
            </button>

            <button
              type="button"
              className="admin-danger-button"
              onClick={() => deleteCustomer(selectedCustomer)}
              disabled={saving}
            >
              Delete
            </button>
          </div>
        </div>

        {/* CUSTOMER DETAILS */}
        <div className="admin-dashboard-card">
          <div className="admin-card-heading">
            <div>
              <span>PROFILE</span>
              <h2>Customer Details</h2>
            </div>
          </div>

          <div className="customer-detail-grid">
            <div className="detail-box">
              <span>Full Name</span>
              <strong>{selectedCustomer.name || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Client ID</span>
              <strong>{selectedCustomer.clientId || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Email</span>
              <strong>{selectedCustomer.email || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Phone</span>
              <strong>{selectedCustomer.phone || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Client Since</span>
              <strong>
                {selectedCustomer.clientSince
                  ? new Date(selectedCustomer.clientSince).toLocaleDateString("en-IN")
                  : "—"}
              </strong>
            </div>

            <div className="detail-box">
              <span>Account Status</span>
              <strong>{selectedCustomer.status || "ACTIVE"}</strong>
            </div>
          </div>
        </div>

        {/* PROJECT */}
        <div className="admin-dashboard-card">
          <div className="admin-card-heading">
            <div>
              <span>PROJECT</span>
              <h2>Project Details</h2>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={() => openProjectModal(selectedCustomer)}
            >
              Edit Project
            </button>
          </div>

          <div className="customer-detail-grid">
            <div className="detail-box">
              <span>Project Name</span>
              <strong>{project.name || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Project Type</span>
              <strong>{project.type || "—"}</strong>
            </div>

            <div className="detail-box">
              <span>Event Date</span>
              <strong>
                {project.eventDate
                  ? String(project.eventDate).slice(0, 10)
                  : "—"}
              </strong>
            </div>

            <div className="detail-box">
              <span>Status</span>
              <strong>
                <span className="status-badge">
                  {project.status || "NOT STARTED"}
                </span>
              </strong>
            </div>
          </div>

          <div className="project-progress">
            <div className="form-label-row">
              <span>Project Progress</span>
              <strong>{Number(project.progress || 0)}%</strong>
            </div>

            <div className="progress-bar">
              <div
                style={{
                  width: `${Math.min(
                    Math.max(Number(project.progress || 0), 0),
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="admin-dashboard-card">
          <div className="admin-card-heading">
            <div>
              <span>FINANCE</span>
              <h2>Payment Details</h2>
            </div>

            <div className="payment-card-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => openPaymentModal(selectedCustomer)}
              >
                Edit Payment
              </button>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => openRecordPaymentModal(selectedCustomer)}
              >
                + Record Payment
              </button>

              <button
                type="button"
                className="admin-whatsapp-button"
                onClick={() => sendPaymentWhatsApp(selectedCustomer)}
              >
                WhatsApp
              </button>
            </div>
          </div>

          <div className="payment-summary">
            <div className="finance-card">
              <span>Total Amount</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            <div className="finance-card">
              <span>Paid Amount</span>
              <strong>₹{paid.toLocaleString("en-IN")}</strong>
            </div>

            <div className="finance-card balance">
              <span>Balance</span>
              <strong>₹{balance.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <div className="modal-section">
            <div className="modal-section-heading">
              <h3>Payment History</h3>
              <span>
                {paymentHistory.length} transaction
                {paymentHistory.length !== 1 ? "s" : ""}
              </span>
            </div>

            {paymentHistory.length === 0 ? (
              <p className="mini-empty">No payment history available.</p>
            ) : (
              <div className="payment-history-mini">
                {paymentHistory.map((item, index) => (
                  <div
                    className="payment-history-row"
                    key={item._id || `${item.date}-${index}`}
                  >
                    <div>
                      <strong>
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </strong>

                      {item.note && <div>{item.note}</div>}
                    </div>

                    <span>{item.method || "—"}</span>

                    <span>
                      {item.date
                        ? new Date(item.date).toLocaleDateString("en-IN")
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DOCUMENTS */}
        <div className="admin-dashboard-card">
          <div className="admin-card-heading">
            <div>
              <span>FILES</span>
              <h2>Documents</h2>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={() => openDocumentModal(selectedCustomer)}
            >
              + Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="admin-empty-state">
              <div>▱</div>
              <h3>No Documents</h3>
              <p>
                Upload agreements, invoices, payment bills and other files
                for this customer.
              </p>
            </div>
          ) : (
            <div className="document-list">
              {documents.map((document, index) => (
                <div
                  className="document-row"
                  key={document._id || `${document.name}-${index}`}
                >
                  <div className="document-icon">
                    {(document.type || "FILE")
                      .split("/")
                      .pop()
                      .toUpperCase()
                      .slice(0, 5)}
                  </div>

                  <div className="document-info">
                    <strong>{document.name || "Untitled Document"}</strong>

                    <span>
                      {document.type || "Document"}
                      {document.uploadedAt
                        ? ` • ${new Date(document.uploadedAt).toLocaleDateString("en-IN")}`
                        : ""}
                    </span>
                  </div>

                  <div className="document-actions">
                    {document.url && (
                      <button
                        type="button"
                        className="document-view-button"
                        onClick={() =>
                          window.open(
                            document.url.startsWith("http")
                              ? document.url
                              : `${API_URL}${document.url}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }
                      >
                        View
                      </button>
                    )}

                    <button
                      type="button"
                      className="document-delete-button"
                      onClick={() => deleteDocument(selectedCustomer, document)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="customer-permission-note">
          <div>
            <strong>Customer Portal Permissions</strong>
            <p>
              Customers can view project progress, payment details, payment
              history and documents. Editing payment details and documents
              remains an administrator task.
            </p>
          </div>
        </div>
      </div>
    );
  };

  /* =========================================================
     DASHBOARD SCREEN
  ========================================================= */

  const renderDashboard = () => (
    <div className="admin-section">
      <div className="admin-section-toolbar">
        <div>
          <span className="section-kicker">OVERVIEW</span>
          <h2>Studio Dashboard</h2>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAddCustomer}
        >
          + Add Customer
        </button>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon">◉</div>
          <span>Total Customers</span>
          <strong>{statistics.customers}</strong>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">▱</div>
          <span>Active Projects</span>
          <strong>{statistics.projects}</strong>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">₹</div>
          <span>Total Revenue</span>
          <strong>₹{statistics.totalRevenue.toLocaleString("en-IN")}</strong>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">↗</div>
          <span>Outstanding</span>
          <strong>₹{statistics.totalBalance.toLocaleString("en-IN")}</strong>
        </div>
      </div>

      <div className="admin-dashboard-card">
        <div className="admin-card-heading">
          <div>
            <span>CUSTOMERS</span>
            <h2>Recent Customers</h2>
          </div>

          <button
            type="button"
            className="admin-text-button"
            onClick={() => setActiveSection("customers")}
          >
            View All →
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="admin-empty-state">
            <div>◎</div>
            <h3>No Customers Yet</h3>
            <p>
              Add your first customer to start managing projects, payments
              and documents.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {customers.slice(0, 6).map((customer) => {
                  const payment = customer.payment || {};
                  const balance = Math.max(
                    Number(payment.total || 0) -
                      Number(payment.paid || 0),
                    0
                  );

                  return (
                    <tr key={customer._id}>
                      <td>
                        <div className="admin-customer-cell">
                          <div className="customer-avatar">
                            {(customer.name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{customer.name || "—"}</strong>
                            <span>{customer.clientId || "—"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{customer.project?.name || "No project"}</td>

                      <td>
                        <span className="status-badge">
                          {customer.project?.status || "NOT STARTED"}
                        </span>
                      </td>

                      <td>₹{balance.toLocaleString("en-IN")}</td>

                      <td>
                        <button
                          type="button"
                          className="admin-small-button"
                          onClick={() => openCustomerWorkspace(customer)}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* =========================================================
     CUSTOMERS SCREEN
  ========================================================= */

  const renderCustomers = () => (
    <div className="admin-section">
      <div className="admin-section-toolbar">
        <div>
          <span className="section-kicker">CLIENT MANAGEMENT</span>
          <h2>Customers</h2>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openAddCustomer}
        >
          + Add Customer
        </button>
      </div>

      <div className="admin-dashboard-card">
        {customers.length === 0 ? (
          <div className="admin-empty-state">
            <div>◎</div>
            <h3>No Customers</h3>
            <p>Create a customer account to begin managing their project.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Project</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => {
                  const payment = customer.payment || {};

                  const balance = Math.max(
                    Number(payment.total || 0) -
                      Number(payment.paid || 0),
                    0
                  );

                  return (
                    <tr key={customer._id}>
                      <td>
                        <div className="admin-customer-cell">
                          <div className="customer-avatar">
                            {(customer.name || "C")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{customer.name || "—"}</strong>
                            <span>{customer.clientId || "—"}</span>
                          </div>
                        </div>
                      </td>

                      <td>{customer.email || "—"}</td>
                      <td>{customer.phone || "—"}</td>
                      <td>{customer.project?.name || "—"}</td>
                      <td>₹{balance.toLocaleString("en-IN")}</td>

                      <td>
                        <div className="project-card-actions">
                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() => openCustomerWorkspace(customer)}
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() => openEditCustomer(customer)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="admin-small-danger"
                            onClick={() => deleteCustomer(customer)}
                            disabled={saving}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  /* =========================================================
     ENQUIRIES SCREEN
  ========================================================= */

  const renderEnquiries = () => (
    <div className="admin-section">
      <div className="admin-section-toolbar">
        <div>
          <span className="section-kicker">WEBSITE CONTACT FORM</span>
          <h2>Customer Enquiries</h2>
          <p className="enquiry-subtitle">
            View enquiries and manage follow-ups.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={loadEnquiries}
          disabled={enquiriesLoading}
        >
          {enquiriesLoading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      <div className="enquiry-summary">
        <div className="enquiry-summary-card">
          <span>Total Enquiries</span>
          <strong>{enquiries.length}</strong>
        </div>

        <div className="enquiry-summary-card">
          <span>New</span>
          <strong>
            {enquiries.filter((item) => item.status === "New").length}
          </strong>
        </div>

        <div className="enquiry-summary-card">
          <span>Booked</span>
          <strong>
            {enquiries.filter((item) => item.status === "Booked").length}
          </strong>
        </div>
      </div>

      {enquiriesLoading && enquiries.length === 0 ? (
        <div className="admin-dashboard-card">
          <p>Loading enquiries...</p>
        </div>
      ) : enquiries.length === 0 ? (
        <div className="admin-dashboard-card admin-empty-state">
          <div>✉</div>
          <h3>No Enquiries Yet</h3>
          <p>
            Enquiries submitted through your website contact form will
            appear here.
          </p>
        </div>
      ) : (
        <div className="admin-enquiry-list">
          {enquiries.map((enquiry) => (
            <article className="admin-enquiry-card" key={enquiry._id}>
              <div className="admin-enquiry-header">
                <div>
                  <span className="section-kicker">
                    {enquiry.eventType || "GENERAL ENQUIRY"}
                  </span>

                  <h3>{enquiry.name}</h3>

                  <span className="enquiry-date">
                    Submitted{" "}
                    {enquiry.createdAt
                      ? new Date(enquiry.createdAt).toLocaleString("en-IN")
                      : "—"}
                  </span>
                </div>

                <span
                  className={`enquiry-status status-${String(
                    enquiry.status || "New"
                  )
                    .toLowerCase()
                    .replace(/[^a-z]+/g, "-")}`}
                >
                  {enquiry.status || "New"}
                </span>
              </div>

              <div className="admin-enquiry-details">
                <div>
                  <span>PHONE</span>
                  <a href={`tel:${enquiry.phone}`}>
                    {enquiry.phone || "—"}
                  </a>
                </div>

                <div>
                  <span>EMAIL</span>
                  {enquiry.email ? (
                    <a href={`mailto:${enquiry.email}`}>
                      {enquiry.email}
                    </a>
                  ) : (
                    <strong>—</strong>
                  )}
                </div>

                <div>
                  <span>EVENT DATE</span>
                  <strong>
                    {enquiry.eventDate
                      ? new Date(enquiry.eventDate).toLocaleDateString(
                          "en-IN",
                          { timeZone: "UTC" }
                        )
                      : "Not specified"}
                  </strong>
                </div>
              </div>

              <div className="admin-enquiry-message">
                <span>CUSTOMER MESSAGE</span>
                <p>{enquiry.message}</p>
              </div>

              <div className="admin-enquiry-controls">
                <div className="admin-form-group">
                  <label htmlFor={`status-${enquiry._id}`}>
                    ENQUIRY STATUS
                  </label>

                  <select
                    id={`status-${enquiry._id}`}
                    value={enquiry.status || "New"}
                    disabled={updatingEnquiryId === enquiry._id}
                    onChange={(event) =>
                      updateEnquiry(enquiry._id, {
                        status: event.target.value,
                      })
                    }
                  >
                    {enquiryStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group enquiry-notes-group">
                  <label htmlFor={`notes-${enquiry._id}`}>
                    PRIVATE ADMIN NOTES
                  </label>

                  <textarea
                    id={`notes-${enquiry._id}`}
                    rows="2"
                    maxLength={3000}
                    placeholder="Add a follow-up note..."
                    value={
                      enquiryNotes[enquiry._id] ??
                      enquiry.internalNotes ??
                      ""
                    }
                    onChange={(event) =>
                      setEnquiryNotes((previous) => ({
                        ...previous,
                        [enquiry._id]: event.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  type="button"
                  className="admin-primary-button enquiry-save-button"
                  disabled={updatingEnquiryId === enquiry._id}
                  onClick={() =>
                    updateEnquiry(enquiry._id, {
                      internalNotes:
                        enquiryNotes[enquiry._id] ??
                        enquiry.internalNotes ??
                        "",
                    })
                  }
                >
                  {updatingEnquiryId === enquiry._id
                    ? "Saving..."
                    : "Save Notes"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  /* =========================================================
     ADMIN PROFILE SCREEN
  ========================================================= */

  const renderProfile = () => (
    <div className="admin-section">
      <div className="admin-section-toolbar">
        <div>
          <span className="section-kicker">ADMINISTRATION</span>
          <h2>Admin Profile</h2>
        </div>
      </div>

      <div className="admin-profile-card">
        <div className="admin-user-avatar">
          <img src={logo} alt="Infinity Pixel Studios Logo" />
        </div>

        <span className="section-kicker">INFINITY PIXEL STUDIOS</span>
        <h2>Administrator</h2>

        <p>
          Manage customers, projects, payments and documents from one
          secure workspace.
        </p>

        <div className="profile-security-note">
          <span>✓</span>

          <div>
            <strong>Secure Admin Access</strong>
            <p>
              Customer payment details and documents are controlled by
              the administrator. Customers only receive view access.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-danger-button"
          style={{ marginTop: 24 }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );

  /* =========================================================
     CUSTOMER MODAL
  ========================================================= */

  const renderCustomerModal = () => !showCustomerModal ? null : (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          setShowCustomerModal(false);
        }
      }}
    >
      <div className="admin-modal">
        <button
          type="button"
          className="admin-modal-close"
          onClick={() => setShowCustomerModal(false)}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="modal-heading">
          <span>
            {editingCustomer ? "CUSTOMER MANAGEMENT" : "NEW CUSTOMER"}
          </span>

          <h2>{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
          <p>Enter the customer's account information.</p>
        </div>

        <form className="admin-form" onSubmit={saveCustomer}>
          <div className="admin-form-group">
            <label htmlFor="customer-name">FULL NAME</label>
            <input
              id="customer-name"
              type="text"
              value={customerForm.name}
              onChange={(event) =>
                setCustomerForm({ ...customerForm, name: event.target.value })
              }
              placeholder="Customer name"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="customer-email">EMAIL</label>
            <input
              id="customer-email"
              type="email"
              value={customerForm.email}
              onChange={(event) =>
                setCustomerForm({ ...customerForm, email: event.target.value })
              }
              placeholder="customer@email.com"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="customer-phone">PHONE</label>
            <input
              id="customer-phone"
              type="tel"
              value={customerForm.phone}
              onChange={(event) =>
                setCustomerForm({ ...customerForm, phone: event.target.value })
              }
              placeholder="+91 XXXXX XXXXX"
            />
          </div>

          {!editingCustomer && (
            <div className="admin-form-group">
              <label htmlFor="customer-password">PASSWORD</label>
              <input
                id="customer-password"
                type="password"
                value={customerForm.password}
                onChange={(event) =>
                  setCustomerForm({
                    ...customerForm,
                    password: event.target.value,
                  })
                }
                placeholder="Customer login password"
                required
              />
            </div>
          )}

          {editingCustomer && (
            <div className="profile-security-note">
              <span>i</span>
              <div>
                <strong>Password protected</strong>
                <p>
                  The existing customer password is not displayed or
                  exposed here.
                </p>
              </div>
            </div>
          )}

          <div className="admin-modal-buttons">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setShowCustomerModal(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingCustomer
                  ? "Save Changes"
                  : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* =========================================================
     PROJECT MODAL
  ========================================================= */

  const renderProjectModal = () => !showProjectModal ? null : (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          setShowProjectModal(false);
        }
      }}
    >
      <div className="admin-modal">
        <button
          type="button"
          className="admin-modal-close"
          onClick={() => setShowProjectModal(false)}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="modal-heading">
          <span>PROJECT MANAGEMENT</span>
          <h2>Edit Project</h2>
          <p>Update the complete project information for this customer.</p>
        </div>

        <form className="admin-form" onSubmit={saveProject}>
          <div className="admin-form-group">
            <label htmlFor="project-name">PROJECT NAME</label>
            <input
              id="project-name"
              type="text"
              value={projectForm.name}
              onChange={(event) =>
                setProjectForm({ ...projectForm, name: event.target.value })
              }
              placeholder="Project name"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="project-type">PROJECT TYPE</label>
            <input
              id="project-type"
              type="text"
              value={projectForm.type}
              onChange={(event) =>
                setProjectForm({ ...projectForm, type: event.target.value })
              }
              placeholder="Wedding Photography"
            />
          </div>

          <div className="customer-detail-grid">
            <div className="admin-form-group">
              <label htmlFor="project-date">EVENT DATE</label>
              <input
                id="project-date"
                type="date"
                value={projectForm.eventDate}
                onChange={(event) =>
                  setProjectForm({
                    ...projectForm,
                    eventDate: event.target.value,
                  })
                }
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="project-status">STATUS</label>
              <select
                id="project-status"
                value={projectForm.status}
                onChange={(event) =>
                  setProjectForm({ ...projectForm, status: event.target.value })
                }
              >
                <option value="NOT STARTED">NOT STARTED</option>
                <option value="IN PROGRESS">IN PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          <div className="admin-form-group">
            <div className="form-label-row">
              <label htmlFor="project-progress">PROJECT PROGRESS</label>
              <strong>{projectForm.progress}%</strong>
            </div>

            <input
              id="project-progress"
              type="range"
              min="0"
              max="100"
              value={projectForm.progress}
              onChange={(event) =>
                setProjectForm({
                  ...projectForm,
                  progress: Number(event.target.value),
                })
              }
            />
          </div>

          <div className="admin-modal-buttons">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setShowProjectModal(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* =========================================================
     PAYMENT MODAL
  ========================================================= */

  const renderPaymentModal = () => {
    if (!showPaymentModal) return null;

    const total = Number(paymentForm.total || 0);
    const paid = Number(paymentForm.paid || 0);
    const balance = Math.max(total - paid, 0);

    return (
      <div
        className="admin-modal-overlay"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) {
            setShowPaymentModal(false);
          }
        }}
      >
        <div className="admin-modal">
          <button
            type="button"
            className="admin-modal-close"
            onClick={() => setShowPaymentModal(false)}
            aria-label="Close modal"
          >
            ×
          </button>

          <div className="modal-heading">
            <span>FINANCE MANAGEMENT</span>
            <h2>Edit Payment</h2>
            <p>Update the customer's payment information.</p>
          </div>

          <form className="admin-form" onSubmit={savePaymentDetails}>
            <div className="admin-form-group">
              <label htmlFor="payment-total">TOTAL PROJECT AMOUNT</label>
              <input
                id="payment-total"
                type="number"
                min="0"
                value={paymentForm.total}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, total: event.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="payment-paid">TOTAL PAID AMOUNT</label>
              <input
                id="payment-paid"
                type="number"
                min="0"
                value={paymentForm.paid}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, paid: event.target.value })
                }
                placeholder="0"
              />
            </div>

            <div className="payment-summary">
              <div className="finance-card">
                <span>Total</span>
                <strong>₹{total.toLocaleString("en-IN")}</strong>
              </div>

              <div className="finance-card">
                <span>Paid</span>
                <strong>₹{paid.toLocaleString("en-IN")}</strong>
              </div>

              <div className="finance-card balance">
                <span>Balance</span>
                <strong>₹{balance.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="admin-modal-buttons">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={() => setShowPaymentModal(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  /* =========================================================
     RECORD PAYMENT MODAL
  ========================================================= */

  const renderRecordPaymentModal = () => !showRecordPaymentModal ? null : (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          setShowRecordPaymentModal(false);
        }
      }}
    >
      <div className="admin-modal">
        <button
          type="button"
          className="admin-modal-close"
          onClick={() => setShowRecordPaymentModal(false)}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="modal-heading">
          <span>PAYMENT HISTORY</span>
          <h2>Record Payment</h2>
          <p>Add a new payment transaction to this customer's history.</p>
        </div>

        <form className="admin-form" onSubmit={saveRecordedPayment}>
          <div className="admin-form-group">
            <label htmlFor="record-amount">PAYMENT AMOUNT</label>
            <input
              id="record-amount"
              type="number"
              min="1"
              value={recordPaymentForm.amount}
              onChange={(event) =>
                setRecordPaymentForm({
                  ...recordPaymentForm,
                  amount: event.target.value,
                })
              }
              placeholder="Enter amount"
              required
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="record-method">PAYMENT METHOD</label>
            <select
              id="record-method"
              value={recordPaymentForm.method}
              onChange={(event) =>
                setRecordPaymentForm({
                  ...recordPaymentForm,
                  method: event.target.value,
                })
              }
            >
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="admin-form-group">
            <label htmlFor="record-reference">REFERENCE</label>
            <input
              id="record-reference"
              type="text"
              value={recordPaymentForm.reference}
              onChange={(event) =>
                setRecordPaymentForm({
                  ...recordPaymentForm,
                  reference: event.target.value,
                })
              }
              placeholder="Transaction/reference number"
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="record-note">NOTE</label>
            <textarea
              id="record-note"
              value={recordPaymentForm.note}
              onChange={(event) =>
                setRecordPaymentForm({
                  ...recordPaymentForm,
                  note: event.target.value,
                })
              }
              placeholder="Optional payment note"
            />
          </div>

          <div className="admin-modal-buttons">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setShowRecordPaymentModal(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* =========================================================
     DOCUMENT MODAL
  ========================================================= */

  const renderDocumentModal = () => !showDocumentModal ? null : (
    <div
      className="admin-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          setShowDocumentModal(false);
        }
      }}
    >
      <div className="admin-modal">
        <button
          type="button"
          className="admin-modal-close"
          onClick={() => setShowDocumentModal(false)}
          aria-label="Close modal"
        >
          ×
        </button>

        <div className="modal-heading">
          <span>DOCUMENT MANAGEMENT</span>
          <h2>Upload Document</h2>
          <p>Add a PDF, JPG, JPEG or PNG file for this customer.</p>
        </div>

        <form className="admin-form" onSubmit={uploadDocument}>
          <div className="admin-form-group">
            <label htmlFor="document-name">DOCUMENT NAME</label>
            <input
              id="document-name"
              type="text"
              value={documentForm.name}
              onChange={(event) =>
                setDocumentForm({
                  ...documentForm,
                  name: event.target.value,
                })
              }
              placeholder="Agreement / Invoice / Bill"
            />
          </div>

          <div className="document-file-dropzone">
            <div className="upload-icon">↑</div>
            <strong>Choose a document</strong>
            <span>PDF, JPG, JPEG or PNG · Maximum 10 MB</span>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(event) =>
                setDocumentForm({
                  ...documentForm,
                  file: event.target.files?.[0] || null,
                })
              }
              aria-label="Choose a document"
            />
          </div>

          {documentForm.file && (
            <div className="selected-file-preview">
              Selected: {documentForm.file.name}
            </div>
          )}

          <div className="admin-modal-buttons">
            <button
              type="button"
              className="admin-secondary-button"
              onClick={() => setShowDocumentModal(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving || !documentForm.file}
            >
              {saving ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  if (loading) {
    return (
      <div className="admin-loading-screen">
        <div className="admin-loading-spinner" />
        <p>Loading Infinity Pixel Studios...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">
            <img src={logo} alt="Infinity Pixel Studios Logo" />
          </div>

          <div>
            <h2>Infinity Pixel</h2>
            <span>STUDIOS · ADMIN</span>
          </div>
        </div>

        {/* Each navigation button must remain a separate sibling. */}
        <nav className="admin-navigation" aria-label="Admin navigation">
          <button
            type="button"
            className={
              activeSection === "dashboard" && !selectedCustomer
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedCustomer(null);
              setActiveSection("dashboard");
            }}
          >
            <span className="admin-nav-icon">◈</span>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={
              activeSection === "customers" && !selectedCustomer
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedCustomer(null);
              setActiveSection("customers");
            }}
          >
            <span className="admin-nav-icon">◎</span>
            <span>Customers</span>
          </button>

          <button
            type="button"
            className={
              activeSection === "enquiries" && !selectedCustomer
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedCustomer(null);
              setActiveSection("enquiries");
              loadEnquiries();
            }}
          >
            <span className="admin-nav-icon">✉</span>
            <span>Enquiries</span>
          </button>

          <button
            type="button"
            className={
              activeSection === "profile" && !selectedCustomer
                ? "active"
                : ""
            }
            onClick={() => {
              setSelectedCustomer(null);
              setActiveSection("profile");
            }}
          >
            <span className="admin-nav-icon">◯</span>
            <span>Admin Profile</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button type="button" onClick={handleLogout}>
            <span className="admin-nav-icon">↪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-header-eyebrow">
              INFINITY PIXEL STUDIOS
            </span>
            <h1>Admin Portal</h1>
            <p>Manage your studio operations from one place.</p>
          </div>

          <div className="admin-header-user">
            <div className="admin-user-avatar">IP</div>

            <button
              type="button"
              className="admin-logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="admin-error-message" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-success-message" role="status">
            {success}
          </div>
        )}

        {selectedCustomer ? (
          renderCustomerWorkspace()
        ) : (
          <>
            {activeSection === "dashboard" && renderDashboard()}
            {activeSection === "customers" && renderCustomers()}
            {activeSection === "enquiries" && renderEnquiries()}
            {activeSection === "profile" && renderProfile()}
          </>
        )}
      </main>

      {/* MODALS */}
      {renderCustomerModal()}
      {renderProjectModal()}
      {renderPaymentModal()}
      {renderRecordPaymentModal()}
      {renderDocumentModal()}
    </div>
  );
}

export default AdminDashboard;
