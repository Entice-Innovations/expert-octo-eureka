import heroImage from "../assets/HEROO.jpeg";
import "../styles/components/Hero.css";

function Hero() {
  return (
    <section className="hero" id="home">
      {/* Background image */}
      <div className="hero-image">
        <img
          src={heroImage}
          alt="South Indian wedding"
        />
      </div>

      {/* Dark overlay */}
      <div className="hero-overlay"></div>

      {/* Hero content */}
      <div className="hero-content">
        <p className="hero-eyebrow">
          INFINITY PIXEL STUDIOS
        </p>

        <p className="hero-category">
          WEDDING PHOTOGRAPHY & FILMS
        </p>

        <h1>
          Every Moment.
          <br />
          <em>Forever Remembered.</em>
        </h1>

        <p className="hero-description">
          The laughter, the tears, the little details.
          We turn your most beautiful moments into
          memories that last forever.
        </p>

        <div className="hero-actions">
          <a href="#gallery" className="hero-button primary">
            EXPLORE OUR WORK <span>↗</span>
          </a>

          <a href="#contact" className="hero-button secondary">
            BOOK YOUR DATE
          </a>
        </div>
      </div>

      {/* Bottom details */}
      <div className="hero-bottom">
        <span>CAPTURING STORIES, CREATING LEGACIES</span>
        <span>01 / 01</span>
      </div>
    </section>
  );
}

export default Hero;