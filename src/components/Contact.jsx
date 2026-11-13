
import { useState } from "react";
import "../styles/components/Contact.css";
import { submitEnquiry } from "../services/enquiryService";

function Contact() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitStatus("");
    setSubmitMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const enquiryData = {
      name: String(formData.get("name") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      eventType: String(formData.get("event") || ""),
      message: String(formData.get("message") || "").trim(),
    };

    try {
  const result = await submitEnquiry(enquiryData);
      

      setSubmitStatus("success");
      setSubmitMessage(
        "Thank you! Your enquiry has been sent successfully. We'll get back to you soon."
      );

      form.reset();
    } catch (error) {
      console.error("ENQUIRY SUBMISSION ERROR:", error);

      setSubmitStatus("error");
      setSubmitMessage(
        error.message === "Failed to fetch"
          ? "Unable to connect to the server. Please check that the backend is running and try again."
          : error.message || "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="contact-section" id="contact">
      <div className="contact-bg-number">06</div>

      <div className="contact-orb contact-orb-one"></div>
      <div className="contact-orb contact-orb-two"></div>

      <div className="contact-container">
        {/* LEFT SIDE */}
        <div className="contact-content">
          <div className="contact-eyebrow">
            <span></span>
            <p>LET'S CREATE SOMETHING BEAUTIFUL</p>
          </div>

          <h2>
            Your story
            <em>starts here.</em>
          </h2>

          <p className="contact-intro">
            Tell us about your wedding, celebration, or special
            moment. We'd love to turn it into photographs and
            films you'll cherish forever.
          </p>

          <div className="contact-details">
            <a href="tel:+918925056981" className="contact-detail">
              <div className="contact-icon">✦</div>

              <div>
                <span>CALL US</span>
                <strong>+91 89250 56981</strong>
              </div>
            </a>

            <a
              href="mailto:infinitypixelngl@gmail.com"
              className="contact-detail"
            >
              <div className="contact-icon">✉</div>

              <div>
                <span>EMAIL US</span>
                <strong>infinitypixelngl@gmail.com</strong>
              </div>
            </a>

            <div className="contact-detail">
              <div className="contact-icon">⌖</div>

              <div>
                <span>LOCATION</span>
                <strong>
                  Chidambara Nagar, Kottar,
                  <br />
                  Nagercoil, Tamil Nadu 629002
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="contact-form-wrapper">
          <div className="contact-form-top">
            <span>01</span>
            <p>START A CONVERSATION</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">YOUR NAME</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">PHONE NUMBER</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="Enter your number"
                  maxLength={25}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="event">EVENT TYPE</label>

              <select
                id="event"
                name="event"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Select your event
                </option>

                <option value="Wedding Photography">
                  Wedding
                </option>

                <option value="Engagement">
                  Engagement
                </option>

                <option value="Wedding Photography">
                  Pre Wedding
                </option>

                <option value="Wedding Photography">
                  Post Wedding
                </option>

                <option value="Maternity Photography">
                  Maternity
                </option>

                <option value="Event Photography">
                  Birthday / Celebration
                </option>

                <option value="Event Photography">
                  Corporate / Event
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">
                TELL US ABOUT YOUR STORY
              </label>

              <textarea
                id="message"
                name="message"
                rows="4"
                placeholder="Tell us about your event..."
                maxLength={3000}
                required
              ></textarea>
            </div>

            {submitMessage && (
              <p
                className={`contact-form-feedback ${submitStatus}`}
                role={submitStatus === "error" ? "alert" : "status"}
                style={{
                  marginTop: "14px",
                  lineHeight: 1.6,
                  fontSize: "0.92rem",
                  color:
                    submitStatus === "success"
                      ? "#2f6b3c"
                      : "#b42318",
                }}
              >
                {submitMessage}
              </p>
            )}

            <button
              type="submit"
              className="contact-submit"
              disabled={submitting}
            >
              <span>
                {submitting ? "Sending..." : "Send Enquiry"}
              </span>
              <b>{submitting ? "…" : "↗"}</b>
            </button>
          </form>
        </div>
      </div>

      <div className="contact-bottom">
        <div className="contact-bottom-line"></div>

        <p>
          Let's turn your moments into
          <span> memories.</span>
        </p>
      </div>

      <div className="contact-corner contact-corner-left"></div>
      <div className="contact-corner contact-corner-right"></div>
    </section>
  );
}

export default Contact;
