import logo from "../assets/logo1.png";
import "../styles/components/Footer.css";

function Footer() {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="footer">

      {/* ================= MAIN FOOTER ================= */}

      <div className="footer-container">

        {/* BRAND */}

        <div className="footer-brand">

          <a href="#home" className="footer-logo">
            <img
              src={logo}
              alt="Infinity Pixel Studios"
            />
          </a>

          <p>
            We capture authentic emotions,
            beautiful details, and unforgettable
            moments — turning your story into
            timeless memories.
          </p>

          <div className="footer-socials">

            <a
              href="https://www.instagram.com/infinitypixel_studios/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>

            <a href="#">
              Facebook
            </a>

            <a
              href="https://wa.me/918925056981"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>

          </div>

        </div>


        {/* EXPLORE */}

        <div className="footer-column">

          <span className="footer-column-title">
            EXPLORE
          </span>

          <a href="#home">
            Home
          </a>

          <a href="#about">
            About
          </a>

          <a href="#services">
            Services
          </a>

          <a href="#gallery">
            Gallery
          </a>

          <a href="#contact">
            Contact
          </a>

        </div>


        {/* SERVICES */}

        <div className="footer-column">

          <span className="footer-column-title">
            SERVICES
          </span>

          <a href="#services">
            Wedding Photography
          </a>

          <a href="#services">
            Engagements
          </a>

          <a href="#services">
            Maternity
          </a>

          <a href="#services">
            Events & Celebrations
          </a>

          <a href="#contact">
            Enquire Now
          </a>

        </div>


        {/* CONTACT */}

        <div className="footer-column footer-contact">

          <span className="footer-column-title">
            GET IN TOUCH
          </span>

          <a href="tel:+918925056981">
            +91 89250 56981
          </a>

          <a href="mailto:infinitypixelngl@gmail.com">
            infinitypixelngl@gmail.com
          </a>

          <p>
            Chidambara Nagar, Kottar,
            <br />
            Nagercoil, Tamil Nadu 629002
          </p>

        </div>

      </div>


      {/* ================= FOOTER BOTTOM ================= */}

      <div className="footer-bottom">

        <p>
          © {new Date().getFullYear()} Infinity Pixel Studios.
          All rights reserved.
        </p>

        <button
          className="footer-top-button"
          onClick={scrollToTop}
          type="button"
        >
          BACK TO TOP
          <span>↑</span>
        </button>

      </div>


      {/* ================= WEBSITE CREDIT ================= */}

      <div className="footer-company">

        <span>
          WEBSITE BY
        </span>

        <a
          href="https://enticeinnovations.com/"
          target="_blank"
          rel="noreferrer"
        >
          Entice Innovations
          <span>↗</span>
        </a>

      </div>


      {/* ================= FLOATING WHATSAPP ================= */}

      <a
        href="https://wa.me/918925056981"
        className="footer-whatsapp"
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <span>◔</span>
      </a>

    </footer>
  );
}

export default Footer;