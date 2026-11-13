
import { useEffect, useRef } from "react";
import aboutImage from "../assets/about1.jpeg";
import "../styles/components/About.css";
function About() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const handleMouseMove = (event) => {
      const rect = section.getBoundingClientRect();

      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      section.style.setProperty("--mouse-x", `${x * 20}px`);
      section.style.setProperty("--mouse-y", `${y * 20}px`);
    };

    section.addEventListener("mousemove", handleMouseMove);

    return () => {
      section.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <section className="about-section" id="about" ref={sectionRef}>

      {/* BACKGROUND */}
      <div className="about-bg-number">01</div>
      <div className="about-orb orb-one"></div>
      <div className="about-orb orb-two"></div>

      {/* FLOATING PARTICLES */}
      <div className="about-particles">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <div className="about-container">

        {/* IMAGE SIDE */}
        <div className="about-image-wrapper">

          <div className="about-image-frame frame-one"></div>
          <div className="about-image-frame frame-two"></div>

          <div className="about-image">

            <img
              src={aboutImage}
              alt="Infinity Pixel Studios wedding photography"
            />

            <div className="image-shine"></div>

          </div>


          {/* IMAGE CORNER */}
          <div className="image-corner top"></div>
          <div className="image-corner bottom"></div>

        </div>


        {/* CONTENT */}
        <div className="about-content">

          <div className="about-eyebrow">
            <span></span>
            <p>ABOUT INFINITY PIXEL STUDIOS</p>
          </div>

          <h2>
            Every moment
            <br />
            <em>has a story.</em>
          </h2>

          <p className="about-intro">
            Your story deserves more than just photographs.
            It deserves to be felt, remembered, and relived.
          </p>

          <p className="about-description">
            At Infinity Pixel Studios, we transform real emotions,
            beautiful details, and unforgettable moments into
            timeless visual stories. From intimate weddings and
            engagements to maternity, celebrations, and special
            events, we capture every chapter with creativity,
            authenticity, and care.
          </p>


          {/* FEATURES */}
          <div className="about-features">

            <div className="about-feature">
              <span className="feature-number">01</span>

              <div>
                <h3>Authentic Moments</h3>
                <p>Real emotions, naturally captured.</p>
              </div>
            </div>


            <div className="about-feature">
              <span className="feature-number">02</span>

              <div>
                <h3>Cinematic Stories</h3>
                <p>Visuals crafted to feel timeless.</p>
              </div>
            </div>


            <div className="about-feature">
              <span className="feature-number">03</span>

              <div>
                <h3>Attention to Detail</h3>
                <p>Every little moment matters.</p>
              </div>
            </div>

          </div>


          {/* BUTTON */}
          <a href="#services" className="about-button">

            <span>Discover Our Approach</span>

            <span className="about-button-arrow">
              ↗
            </span>

          </a>

        </div>

      </div>


      {/* BOTTOM INFO */}
      <div className="about-bottom">

        <div className="about-stat">

          <strong>01</strong>

          <span>OUR STORY</span>

        </div>

        <div className="about-line"></div>

        <p>
          Creating photographs that become
          part of your story forever.
        </p>

      </div>

    </section>
  );
}

export default About;

