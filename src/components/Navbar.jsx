
import { useEffect, useState } from "react";
import logo from "../assets/logo1.png";
import "../styles/components/Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const leftLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
  ];

  const rightLinks = [
    { label: "Gallery", href: "#gallery" },
    { label: "Contact", href: "#contact" },
  ];

  const closeMenu = () => setMenuOpen(false);

  // Smooth scrolling without adding # to the URL
  const handleSectionClick = (event, href) => {
    event.preventDefault();

    const section = document.querySelector(href);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );

    closeMenu();
  };

  return (
    <header className="site-header">
      <div className="navbar">

        {/* Desktop left navigation */}
        <nav className="nav-side nav-left" aria-label="Main navigation">
          {leftLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(event) =>
                handleSectionClick(event, link.href)
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Centred logo */}
        <a
          href="#home"
          className="navbar-logo"
          aria-label="Infinity Pixel Studios home"
          onClick={(event) =>
            handleSectionClick(event, "#home")
          }
        >
          <img src={logo} alt="Infinity Pixel Studios" />
        </a>

        {/* Desktop right navigation */}
        <nav className="nav-side nav-right" aria-label="Main navigation">
          {rightLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(event) =>
                handleSectionClick(event, link.href)
              }
            >
              {link.label}
            </a>
          ))}

          <a href="/login" className="nav-login">
            Login
          </a>

          <a
            href="#contact"
            className="nav-book"
            onClick={(event) =>
              handleSectionClick(event, "#contact")
            }
          >
            Book Now <span>↗</span>
          </a>
        </nav>

        {/* Mobile menu button */}
        <button
          className={`menu-toggle ${menuOpen ? "active" : ""}`}
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((previous) => !previous)}
        >
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile navigation */}
      {menuOpen && (
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {[...leftLinks, ...rightLinks].map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(event) =>
                handleSectionClick(event, link.href)
              }
            >
              {link.label}
            </a>
          ))}

          <a href="/login" onClick={closeMenu}>
            Login
          </a>

          <a
            href="#contact"
            className="mobile-book"
            onClick={(event) =>
              handleSectionClick(event, "#contact")
            }
          >
            Book Your Date ↗
          </a>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
