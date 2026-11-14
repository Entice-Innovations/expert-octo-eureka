
import {
  API_URL,
  getCustomerProfile,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../../services/dashboardService";

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import logo from "../../assets/logo1.png";
import "../../styles/pages/CustomerDashboard.css";

// =====================================================
// LOAD RAZORPAY CHECKOUT
// =====================================================

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });

// =====================================================
// FORMAT MONEY
// =====================================================

const formatMoney = (amount) => {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
};

// =====================================================
// CUSTOMER DASHBOARD
// =====================================================

function CustomerDashboard() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // =====================================================
  // LOAD CUSTOMER
  // =====================================================

  useEffect(() => {
    const loadCustomer = async () => {
      const customerId =
        localStorage.getItem("customerId") ||
        localStorage.getItem("loggedInCustomerId") ||
        sessionStorage.getItem("customerId") ||
        sessionStorage.getItem("loggedInCustomerId");

      const token =
        localStorage.getItem("customerToken") ||
        sessionStorage.getItem("customerToken");

      if (!customerId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setError("");

        // API SERVICE: GET CUSTOMER PROFILE
        const data = await getCustomerProfile(customerId, token);

        const customerData = data.customer || data.data || data;

        if (!customerData?._id && !customerData?.id) {
          throw new Error("Customer information was not found.");
        }

        setCustomer(customerData);
        setLoading(false);
      } catch (err) {
        console.error("Customer dashboard error:", err);
        setError(err.message || "Unable to load customer.");

        [
          "loggedInCustomerId",
          "customerId",
          "customerToken",
          "customer",
        ].forEach((key) => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        setLoading(false);

        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      }
    };

    loadCustomer();
  }, [navigate]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("loggedInCustomerId");
    localStorage.removeItem("customerId");
    localStorage.removeItem("customerToken");
    localStorage.removeItem("customer");

    sessionStorage.removeItem("loggedInCustomerId");
    sessionStorage.removeItem("customerId");
    sessionStorage.removeItem("customerToken");
    sessionStorage.removeItem("customer");

    navigate("/login");
  };

  // =====================================================
  // CHANGE SECTION
  // =====================================================

  const changeSection = (section) => {
    setActiveSection(section);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-logo">
          <img src={logo} alt="Infinity Pixel Studios" />
        </div>

        <div className="loading-line"></div>

        <p>{error || "Preparing your private space..."}</p>
      </div>
    );
  }

  // =====================================================
  // SAFETY CHECK
  // =====================================================

  if (!customer) {
    return null;
  }

  // =====================================================
  // CUSTOMER DATA
  // =====================================================

  const project = customer.project || {
    name: "No project assigned",
    type: "Photography",
    eventDate: "",
    status: "NOT STARTED",
    progress: 0,
  };

  const payment = customer.payment || {
    total: 0,
    paid: 0,
    balance: 0,
    history: [],
  };

  const documents = Array.isArray(customer.documents)
    ? customer.documents
    : [];

  const paymentHistory = Array.isArray(payment.history)
    ? payment.history
    : [];

  // =====================================================
  // PAYMENT CALCULATIONS
  // =====================================================

  const paymentTotal = Number(payment.total) || 0;
  const paymentPaid = Number(payment.paid) || 0;

  const calculatedBalance = Math.max(
    paymentTotal - paymentPaid,
    0
  );

  const paymentBalance = calculatedBalance;

  const paymentPercentage =
    paymentTotal > 0
      ? Math.min(
          Math.round((paymentPaid / paymentTotal) * 100),
          100
        )
      : 0;

  const isFullyPaid =
    paymentTotal > 0 &&
    paymentPaid >= paymentTotal &&
    paymentBalance <= 0;

  const hasPaymentDue =
    paymentTotal > 0 && paymentBalance > 0;

  // =====================================================
  // PROJECT PROGRESS
  // =====================================================

  const projectProgress = Math.min(
    Math.max(Number(project.progress) || 0, 0),
    100
  );

  // =====================================================
  // CLIENT SINCE
  // =====================================================

  const clientSince = customer.clientSince
    ? new Date(customer.clientSince).toLocaleDateString(
        "en-IN",
        {
          month: "short",
          year: "numeric",
        }
      )
    : "2026";

  // =====================================================
  // CUSTOMER ID
  // =====================================================

  const displayClientId =
    customer.clientId ||
    customer.id ||
    customer._id ||
    "—";

  // =====================================================
  // RAZORPAY ONLINE PAYMENT
  // =====================================================

  const openPaymentOptions = () => {
    const halfBalance =
      Math.round((paymentBalance / 2) * 100) / 100;

    const defaultAmount =
      paymentBalance >= 2 ? halfBalance : paymentBalance;

    setPaymentAmount(defaultAmount.toFixed(2));
    setPaymentError("");
    setShowPaymentOptions(true);
  };

  const chooseHalfPayment = () => {
    if (paymentBalance < 2) return;

    const halfBalance =
      Math.round((paymentBalance / 2) * 100) / 100;

    setPaymentAmount(halfBalance.toFixed(2));
  };

  const handlePaymentRequest = async () => {
    if (isPaying) return;

    setPaymentError("");

    try {
      const token =
        localStorage.getItem("customerToken") ||
        sessionStorage.getItem("customerToken");

      if (!token) {
        throw new Error("Please log in again to continue.");
      }

      if (!hasPaymentDue || paymentBalance <= 0) {
        throw new Error("There is no payment balance due.");
      }

      // VALIDATE PAYMENT AMOUNT

      const rawAmount = String(paymentAmount ?? "").trim();
      const amountToPay = Number(rawAmount);
      const amountPaise = Math.round(amountToPay * 100);
      const balancePaise = Math.round(paymentBalance * 100);

      if (
        !rawAmount ||
        !Number.isFinite(amountToPay) ||
        amountToPay <= 0 ||
        Math.abs(amountToPay * 100 - amountPaise) > 0.0001 ||
        amountPaise < 100
      ) {
        throw new Error(
          "Enter a valid amount of at least ₹1, with up to 2 decimal places."
        );
      }

      if (amountPaise > balancePaise) {
        throw new Error(
          `The amount cannot exceed your remaining balance of ${formatMoney(paymentBalance)}.`
        );
      }

      setIsPaying(true);

      // LOAD RAZORPAY CHECKOUT

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Unable to load Razorpay. Please check your internet connection."
        );
      }

      // API SERVICE: CREATE RAZORPAY ORDER

      const orderData = await createRazorpayOrder(
        amountToPay,
        token
      );

      console.log("Selected amount (₹):", amountToPay);
      console.log("Expected amount (paise):", amountPaise);
      console.log("Backend order response:", orderData);

      if (
        !orderData.order ||
        !orderData.order.id ||
        Number(orderData.order.amount) !== amountPaise
      ) {
        throw new Error(
          "The server returned a different payment amount. Please refresh and try again."
        );
      }

      // OPEN RAZORPAY CHECKOUT

      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Infinity Pixel Studios",
        description: `Payment for ${project.name}`,
        order_id: orderData.order.id,

        prefill: {
          name: customer.name || "",
          email: customer.email || "",
          contact: customer.phone || "",
        },

        theme: {
          color: "#B08D57",
        },

        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },

        handler: async (razorpayResponse) => {
          try {
            // API SERVICE: VERIFY RAZORPAY PAYMENT

            const verifyData = await verifyRazorpayPayment(
              razorpayResponse,
              token
            );

            setCustomer(verifyData.customer);
            setPaymentError("");
            setShowPaymentOptions(false);
            setPaymentAmount("");

            alert(
              "Payment successful! Your payment details have been updated."
            );
          } catch (error) {
            setPaymentError(
              error.message ||
                "Payment confirmation is pending. Please check before trying again."
            );
          } finally {
            setIsPaying(false);
          }
        },
      });

      checkout.on("payment.failed", (response) => {
        console.error("RAZORPAY PAYMENT FAILURE:", {
          code: response.error?.code,
          description: response.error?.description,
          source: response.error?.source,
          step: response.error?.step,
          reason: response.error?.reason,
        });

        setPaymentError(
          response.error?.description ||
            "Payment failed. Please try again."
        );

        setIsPaying(false);
      });

      checkout.open();
    } catch (error) {
      setPaymentError(
        error.message || "Unable to start your payment."
      );

      setIsPaying(false);
    }
  };

  // =====================================================
  // DASHBOARD
  // =====================================================

  const DashboardContent = () => (
    <section className="portal-section dashboard-section">
      <div className="welcome-block">
        <div>
          <span className="section-eyebrow">
            CLIENT DASHBOARD
          </span>

          <h1>
            Welcome back <em>{customer.name}</em>.
          </h1>

          <p>
            Everything related to your Infinity Pixel Studios
            project, payments and documents is available here.
          </p>
        </div>

        <div className="welcome-date">
          <span>CLIENT ID</span>
          <strong>{displayClientId}</strong>
        </div>
      </div>

      <div className="dashboard-project-card">
        <div className="project-card-content">
          <div className="project-card-top">
            <span className="project-label">
              CURRENT PROJECT
            </span>

            <span className="project-status">
              {project.status || "NOT STARTED"}
            </span>
          </div>

          <h2>{project.name}</h2>
          <p>{project.type || "Photography"}</p>

          <div className="project-progress">
            <div className="progress-header">
              <span>PROJECT PROGRESS</span>
              <strong>{projectProgress}%</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${projectProgress}%`,
                }}
              ></div>
            </div>
          </div>

          <button
            className="dashboard-action"
            onClick={() => changeSection("projects")}
          >
            View Project <span>↗</span>
          </button>
        </div>

        <div className="project-card-decoration">
          <span>IPS</span>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-icon">◈</span>
          <div>
            <span>PROJECT</span>
            <strong>01</strong>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">₹</span>
          <div>
            <span>PAID</span>
            <strong>{formatMoney(paymentPaid)}</strong>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">▤</span>
          <div>
            <span>DOCUMENTS</span>
            <strong>{documents.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-icon">◎</span>
          <div>
            <span>CLIENT SINCE</span>
            <strong>{clientSince}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="payment-summary-card">
          <div className="card-heading">
            <div>
              <span>PAYMENT SUMMARY</span>
              <h3>Your investment</h3>
            </div>

            <button onClick={() => changeSection("payments")}>
              View all ↗
            </button>
          </div>

          <div className="payment-main">
            <div
              className="payment-circle"
              style={{
                "--payment": `${paymentPercentage}%`,
              }}
            >
              <div>
                <strong>{paymentPercentage}%</strong>
                <span>PAID</span>
              </div>
            </div>

            <div className="payment-details">
              <div>
                <span>TOTAL</span>
                <strong>{formatMoney(paymentTotal)}</strong>
              </div>

              <div>
                <span>PAID</span>
                <strong>{formatMoney(paymentPaid)}</strong>
              </div>

              <div>
                <span>BALANCE</span>
                <strong>{formatMoney(paymentBalance)}</strong>
              </div>
            </div>
          </div>

          {hasPaymentDue && (
            <div className="dashboard-payment-action">
              <div>
                <span>PAYMENT DUE</span>
                <strong>{formatMoney(paymentBalance)}</strong>
                <p>Remaining balance for your project.</p>
              </div>

              <button
                type="button"
                className="pay-now-button"
                onClick={openPaymentOptions}
                disabled={isPaying}
              >
                {isPaying ? "Opening payment..." : "Pay Balance"}
                <span>↗</span>
              </button>
            </div>
          )}

          {isFullyPaid && (
            <div className="payment-complete-banner">
              <div className="payment-complete-icon">✓</div>
              <div>
                <span>PAYMENT COMPLETE</span>
                <h3>Your project is fully paid.</h3>
                <p>
                  Thank you for choosing Infinity Pixel Studios.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="documents-summary-card">
          <div className="card-heading">
            <div>
              <span>DOCUMENTS</span>
              <h3>Recent files</h3>
            </div>

            <button onClick={() => changeSection("documents")}>
              View all ↗
            </button>
          </div>

          <div className="mini-documents">
            {documents.length > 0 ? (
              documents.slice(0, 3).map((document, index) => (
                <div
                  className="mini-document"
                  key={
                    document.id ||
                    document._id ||
                    `document-${index}`
                  }
                >
                  <div className="mini-document-icon">
                    {document.type === "INVOICE"
                      ? "₹"
                      : document.type === "AGREEMENT"
                      ? "✦"
                      : "▤"}
                  </div>

                  <div>
                    <strong>{document.name || "Document"}</strong>
                    <span>{document.type || "DOCUMENT"}</span>
                  </div>

                  <span className="document-arrow">↗</span>
                </div>
              ))
            ) : (
              <div className="mini-empty">
                No documents available yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="support-card">
        <div className="support-icon">✦</div>

        <div className="support-content">
          <span>NEED HELP?</span>
          <h3>We're here for you.</h3>
          <p>
            Have a question about your project, payment or documents?
            Get in touch with Infinity Pixel Studios.
          </p>
        </div>

        <a
          href="https://wa.me/918925056981"
          target="_blank"
          rel="noreferrer"
          className="support-button"
        >
          Contact Studio <span>↗</span>
        </a>
      </div>
    </section>
  );

  // =====================================================
  // PROJECTS
  // =====================================================

  const ProjectsContent = () => (
    <section className="portal-section projects-section">
      <div className="section-heading">
        <span className="section-eyebrow">YOUR PROJECT</span>
        <h2>Your <em>story.</em></h2>
        <p>
          Follow the progress of your photography project with
          Infinity Pixel Studios.
        </p>
      </div>

      <div className="project-detail-card">
        <div className="project-detail-header">
          <div>
            <span>PROJECT ID</span>
            <strong>{displayClientId}</strong>
          </div>

          <span className="project-status">
            {project.status || "NOT STARTED"}
          </span>
        </div>

        <div className="project-detail-main">
          <span className="project-label">
            {project.type || "Photography"}
          </span>

          <h2>{project.name}</h2>

          <div className="project-info-grid">
            <div>
              <span>EVENT DATE</span>
              <strong>{project.eventDate || "Not assigned"}</strong>
            </div>

            <div>
              <span>PROJECT STATUS</span>
              <strong>{project.status || "NOT STARTED"}</strong>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>{projectProgress}%</strong>
            </div>
          </div>
        </div>

        <div className="project-progress large-progress">
          <div className="progress-header">
            <span>PROJECT PROGRESS</span>
            <strong>{projectProgress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{
                width: `${projectProgress}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="project-timeline">
        <div className="timeline-item completed">
          <span className="timeline-dot">✓</span>
          <div>
            <span>STEP 01</span>
            <h3>Project Confirmed</h3>
            <p>
              Your project has been registered with the studio.
            </p>
          </div>
        </div>

        <div
          className={
            projectProgress > 0
              ? "timeline-item active"
              : "timeline-item"
          }
        >
          <span className="timeline-dot">02</span>
          <div>
            <span>STEP 02</span>
            <h3>Project In Progress</h3>
            <p>Your project is currently being worked on.</p>
          </div>
        </div>

        <div
          className={
            projectProgress >= 100
              ? "timeline-item active"
              : "timeline-item"
          }
        >
          <span className="timeline-dot">03</span>
          <div>
            <span>STEP 03</span>
            <h3>Final Delivery</h3>
            <p>Your final project delivery will appear here.</p>
          </div>
        </div>
      </div>
    </section>
  );

  // =====================================================
  // PAYMENTS
  // =====================================================

  const PaymentsContent = () => (
    <section className="portal-section payments-section">
      <div className="section-heading">
        <span className="section-eyebrow">PAYMENTS</span>
        <h2>Payment <em>details.</em></h2>
        <p>
          Keep track of your project investment and payment
          transactions.
        </p>
      </div>

      <div className="payment-overview">
        <div className="payment-overview-card">
          <span>TOTAL PROJECT VALUE</span>
          <strong>{formatMoney(paymentTotal)}</strong>
        </div>

        <div className="payment-overview-card">
          <span>TOTAL PAID</span>
          <strong>{formatMoney(paymentPaid)}</strong>
        </div>

        <div className="payment-overview-card">
          <span>REMAINING BALANCE</span>
          <strong>{formatMoney(paymentBalance)}</strong>
        </div>
      </div>

      {hasPaymentDue && (
        <div className="payment-action-panel">
          <div>
            <span>PAYMENT REQUIRED</span>
            <h3>{formatMoney(paymentBalance)}</h3>
            <p>This amount is still due for your project.</p>
          </div>

          <button
            type="button"
            className="pay-now-button"
            onClick={openPaymentOptions}
            disabled={isPaying}
          >
            {isPaying ? "Opening payment..." : "Pay Balance"}
            <span>↗</span>
          </button>
        </div>
      )}

      {isFullyPaid && (
        <div className="payment-complete-banner">
          <div className="payment-complete-icon">✓</div>
          <div>
            <span>PAYMENT COMPLETE</span>
            <h3>Your project is fully paid.</h3>
            <p>
              Thank you for choosing Infinity Pixel Studios.
            </p>
          </div>
        </div>
      )}

      <div className="payment-history-card">
        <div className="payment-history-header">
          <div>
            <span>PAYMENT HISTORY</span>
            <h3>Recent Transactions</h3>
          </div>

          <span className="payment-history-count">
            {paymentHistory.length}
          </span>
        </div>

        <div className="payment-history-list">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((transaction, index) => {
              const transactionId =
                transaction._id ||
                transaction.id ||
                `payment-${index}`;

              const transactionDate = transaction.date
                ? new Date(transaction.date).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )
                : "Date unavailable";

              return (
                <div
                  className="payment-history-item"
                  key={transactionId}
                >
                  <div className="payment-history-icon">₹</div>

                  <div className="payment-history-details">
                    <strong>Payment</strong>

                    <span>
                      {transactionDate}
                      {" · "}
                      {transaction.method || "Payment"}
                    </span>

                    {transaction.reference &&
                      transaction.reference !== "—" && (
                        <small>
                          Ref: {transaction.reference}
                        </small>
                      )}

                    {transaction.note && (
                      <small>{transaction.note}</small>
                    )}
                  </div>

                  <div className="payment-history-amount">
                    <strong>
                      {formatMoney(transaction.amount)}
                    </strong>

                    <span
                      className={
                        transaction.status === "PAID"
                          ? "payment-paid"
                          : "payment-pending"
                      }
                    >
                      {transaction.status || "PAID"}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="payment-history-empty">
              <div className="empty-icon">₹</div>
              <h4>No payments yet</h4>
              <p>
                Payment transactions will appear here once
                they are added by the studio.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  // =====================================================
  // DOCUMENTS
  // =====================================================

  const DocumentsContent = () => {
    const invoiceDocuments = documents.filter(
      (document) =>
        String(document.type || "").toUpperCase() === "INVOICE"
    );

    const agreementDocuments = documents.filter(
      (document) =>
        String(document.type || "").toUpperCase() === "AGREEMENT"
    );

    const otherDocuments = documents.filter((document) => {
      const type = String(document.type || "").toUpperCase();

      return type !== "INVOICE" && type !== "AGREEMENT";
    });

    const DocumentCard = ({ document }) => {
      const documentUrl =
        document.url ||
        document.file ||
        "";

      const finalUrl = documentUrl
        ? documentUrl.startsWith("http")
          ? documentUrl
          : `${API_URL}${documentUrl}`
        : "";

      const documentType = String(
        document.type || "DOCUMENT"
      ).toUpperCase();

      return (
        <div className="document-card">
          <div className="document-card-icon">
            {documentType === "INVOICE"
              ? "₹"
              : documentType === "AGREEMENT"
              ? "✦"
              : "▤"}
          </div>

          <div className="document-card-content">
            <span className="document-type">
              {documentType}
            </span>

            <h3>{document.name || "Document"}</h3>

            <p>
              Document ID: {document.id || document._id || "—"}
            </p>

            <div className="document-meta">
              <span>
                Date:{" "}
                {document.uploadedAt
                  ? new Date(
                      document.uploadedAt
                    ).toLocaleDateString("en-IN")
                  : document.date || "Not available"}
              </span>

              <span
                className={
                  String(
                    document.status || "AVAILABLE"
                  ).toUpperCase() === "AVAILABLE"
                    ? "document-available"
                    : "document-pending"
                }
              >
                {document.status || "AVAILABLE"}
              </span>
            </div>
          </div>

          <div className="document-card-action">
            {finalUrl ? (
              <a
                href={finalUrl}
                target="_blank"
                rel="noreferrer"
                className="document-view-button"
              >
                View <span>↗</span>
              </a>
            ) : (
              <span className="document-disabled">
                Not available
              </span>
            )}
          </div>
        </div>
      );
    };

    return (
      <section className="portal-section documents-section">
        <div className="section-heading">
          <span className="section-eyebrow">YOUR FILES</span>
          <h2>Your <em>documents.</em></h2>
          <p>
            Important project documents shared by Infinity
            Pixel Studios.
          </p>
        </div>

        <div className="document-category">
          <div className="document-category-heading">
            <div>
              <span>FINANCIAL</span>
              <h3>Invoices</h3>
            </div>

            <span className="document-category-count">
              {invoiceDocuments.length}
            </span>
          </div>

          {invoiceDocuments.length > 0 ? (
            invoiceDocuments.map((document, index) => (
              <DocumentCard
                key={
                  document.id ||
                  document._id ||
                  `invoice-${index}`
                }
                document={document}
              />
            ))
          ) : (
            <div className="document-empty-small">
              No invoices available yet.
            </div>
          )}
        </div>

        <div className="document-category">
          <div className="document-category-heading">
            <div>
              <span>PROJECT</span>
              <h3>Agreements</h3>
            </div>

            <span className="document-category-count">
              {agreementDocuments.length}
            </span>
          </div>

          {agreementDocuments.length > 0 ? (
            agreementDocuments.map((document, index) => (
              <DocumentCard
                key={
                  document.id ||
                  document._id ||
                  `agreement-${index}`
                }
                document={document}
              />
            ))
          ) : (
            <div className="document-empty-small">
              No agreements available yet.
            </div>
          )}
        </div>

        <div className="document-category">
          <div className="document-category-heading">
            <div>
              <span>ADDITIONAL</span>
              <h3>Other Documents</h3>
            </div>

            <span className="document-category-count">
              {otherDocuments.length}
            </span>
          </div>

          {otherDocuments.length > 0 ? (
            otherDocuments.map((document, index) => (
              <DocumentCard
                key={
                  document.id ||
                  document._id ||
                  `other-${index}`
                }
                document={document}
              />
            ))
          ) : (
            <div className="document-empty-small">
              Additional documents will appear here when
              shared by the studio.
            </div>
          )}
        </div>
      </section>
    );
  };

  // =====================================================
  // PROFILE
  // =====================================================

  const ProfileContent = () => (
    <section className="portal-section profile-section">
      <div className="section-heading">
        <span className="section-eyebrow">CLIENT PROFILE</span>
        <h2>Your <em>profile.</em></h2>
        <p>
          Your personal information associated with Infinity
          Pixel Studios.
        </p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          {customer.name?.charAt(0).toUpperCase()}
        </div>

        <div className="profile-info">
          <div className="profile-info-item">
            <span>FULL NAME</span>
            <strong>{customer.name}</strong>
          </div>

          <div className="profile-info-item">
            <span>CUSTOMER ID</span>
            <strong>{displayClientId}</strong>
          </div>

          <div className="profile-info-item">
            <span>EMAIL ADDRESS</span>
            <strong>{customer.email}</strong>
          </div>

          <div className="profile-info-item">
            <span>PHONE NUMBER</span>
            <strong>{customer.phone}</strong>
          </div>

          <div className="profile-info-item">
            <span>CLIENT SINCE</span>
            <strong>{clientSince}</strong>
          </div>
        </div>
      </div>
    </section>
  );

  // =====================================================
  // CONTENT SWITCHER
  // =====================================================

  const renderContent = () => {
    if (activeSection === "projects") {
      return <ProjectsContent />;
    }

    if (activeSection === "payments") {
      return <PaymentsContent />;
    }

    if (activeSection === "documents") {
      return <DocumentsContent />;
    }

    if (activeSection === "profile") {
      return <ProfileContent />;
    }

    return <DashboardContent />;
  };

  // =====================================================
  // MAIN LAYOUT
  // =====================================================

  return (
    <div className="customer-dashboard">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <img src={logo} alt="Infinity Pixel Studios" />
          </div>

          <div>
            <strong>INFINITY PIXEL</strong>
            <span>STUDIOS</span>
          </div>
        </div>

        <div className="sidebar-client">
          <span>CLIENT PORTAL</span>
          <strong>{customer.name}</strong>
          <small>{displayClientId}</small>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              activeSection === "dashboard" ? "active" : ""
            }
            onClick={() => changeSection("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={
              activeSection === "projects" ? "active" : ""
            }
            onClick={() => changeSection("projects")}
          >
            <span>◈</span>
            Projects
          </button>

          <button
            className={
              activeSection === "payments" ? "active" : ""
            }
            onClick={() => changeSection("payments")}
          >
            <span>₹</span>
            Payments
          </button>

          <button
            className={
              activeSection === "documents" ? "active" : ""
            }
            onClick={() => changeSection("documents")}
          >
            <span>▤</span>
            Documents
          </button>

          <button
            className={
              activeSection === "profile" ? "active" : ""
            }
            onClick={() => changeSection("profile")}
          >
            <span>◎</span>
            Profile
          </button>
        </nav>

        <div className="sidebar-bottom">
          <Link to="/" className="back-website">
            <span>↙</span>
            Back to Website
          </Link>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-mobile-brand">
            <div className="topbar-mobile-logo">
              <img src={logo} alt="Infinity Pixel Studios" />
            </div>

            <strong>INFINITY PIXEL</strong>
          </div>

          <div className="topbar-right">
            <div className="topbar-welcome">
              <span>WELCOME BACK</span>
              <strong>{customer.name}</strong>
            </div>

            <div className="topbar-avatar">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {paymentError && (
            <div
              className="payment-error-message"
              role="alert"
            >
              {paymentError}
            </div>
          )}

          {renderContent()}
        </div>

        <footer className="dashboard-footer">
          <span>© 2026 Infinity Pixel Studios</span>
          <span>Crafted with care for your story.</span>
        </footer>
      </main>

      {/* =================================================
          PAYMENT OPTIONS MODAL
      ================================================= */}

      {showPaymentOptions && (
        <div
          className="payment-modal-overlay"
          onClick={() => setShowPaymentOptions(false)}
        >
          <div
            className="payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="payment-modal-close"
              onClick={() => setShowPaymentOptions(false)}
              aria-label="Close"
            >
              ×
            </button>

            <span className="section-eyebrow">PAYMENT</span>

            <h2>
              Complete your
              <em> payment.</em>
            </h2>

            <p>Your remaining balance is:</p>

            <div className="payment-modal-amount">
              {formatMoney(paymentBalance)}
            </div>

            <div className="payment-amount-field">
              <label htmlFor="paymentAmount">
                Enter amount to pay (₹)
              </label>

              <input
                id="paymentAmount"
                type="number"
                min="1"
                max={paymentBalance}
                step="0.01"
                value={paymentAmount}
                onChange={(event) =>
                  setPaymentAmount(event.target.value)
                }
                disabled={isPaying}
                placeholder="Enter your amount"
              />

              <div className="payment-quick-actions">
                <button
                  type="button"
                  onClick={chooseHalfPayment}
                  disabled={isPaying || paymentBalance < 2}
                >
                  Pay Half
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(paymentBalance.toFixed(2))
                  }
                  disabled={isPaying}
                >
                  Pay Full Balance
                </button>
              </div>
            </div>

            <div className="payment-modal-info">
              <div>
                <span>PROJECT</span>
                <strong>{project.name}</strong>
              </div>

              <div>
                <span>TOTAL</span>
                <strong>{formatMoney(paymentTotal)}</strong>
              </div>

              <div>
                <span>ALREADY PAID</span>
                <strong>{formatMoney(paymentPaid)}</strong>
              </div>
            </div>

            <div className="payment-modal-note">
              <strong>Secure online payment</strong>
              <p>
                Pay your outstanding balance using the payment
                methods available through Razorpay Checkout.
              </p>
            </div>

            {paymentError && (
              <p
                className="payment-error-message"
                role="alert"
              >
                {paymentError}
              </p>
            )}

            <button
              type="button"
              className="payment-whatsapp-button"
              onClick={handlePaymentRequest}
              disabled={isPaying}
            >
              {isPaying
                ? "Opening secure checkout..."
                : "Pay securely with Razorpay"}

              <span>↗</span>
            </button>

            <p className="payment-modal-small">
              After payment, the server will verify the
              transaction and update your payment history
              and remaining balance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;
