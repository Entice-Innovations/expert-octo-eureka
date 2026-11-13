import "../styles/components/Services.css";

import engagement from "../assets/engagement.jpeg";
import bridal from "../assets/bridal.jpeg";
import coupleshoot from "../assets/coupleshoot.jpeg";
import baby from "../assets/baby.jpeg";
import portraits from "../assets/portraits.jpeg";
import event from "../assets/EVENT.jpeg";
import maternity from "../assets/MATERNITY.jpeg";
import fashion from "../assets/fashion.jpeg";
function Services() {
  const services = [
    {
      number: "01",
      title: "Wedding",
      subtitle: "& Engagement",
      image: engagement,
      description:
        "From intimate moments to grand celebrations, we capture every emotion, detail, and unforgettable chapter of your love story.",
      tags: ["Wedding", "Engagement", "Candid"],
    },

    {
      number: "02",
      title: "Bridal",
      subtitle: "Photography",
      image: bridal,
      description:
        "Elegant bridal portraits that preserve the beauty, emotions, and little details of one of the most meaningful days of your life.",
      tags: ["Bridal", "Portraits", "Details"],
    },

    {
      number: "03",
      title: "Couples",
      subtitle: "Photography",
      image: coupleshoot,
      description:
        "Natural, emotional photographs that capture the connection, chemistry, and story that make your relationship uniquely yours.",
      tags: ["Couples", "Pre Wedding", "Portraits"],
    },

    {
      number: "04",
      title: "Baby",
      subtitle: "Photography",
      image: baby,
      description:
        "Tiny smiles, little expressions, and beautiful milestones captured with warmth so these precious memories last forever.",
      tags: ["Baby", "Newborn", "Milestones"],
    },

    {
      number: "05",
      title: "Portraits",
      subtitle: "& Headshots",
      image: portraits,
      description:
        "Professional and creative portraits designed to capture your personality with a refined, timeless visual style.",
      tags: ["Headshots", "Portraits", "Fashion"],
    },

    {
      number: "06",
      title: "Events",
      subtitle: "& Celebrations",
      image: event,
      description:
        "From birthdays to special occasions and corporate events, we document the atmosphere, people, and moments that matter.",
      tags: ["Events", "Parties", "Corporate"],
    },

    {
      number: "07",
      title: "Maternity",
      subtitle: "Photography",
      image: maternity,
      description:
        "Beautifully crafted maternity portraits celebrating the emotion, connection, and anticipation of a new beginning.",
      tags: ["Maternity", "Family", "Portraits"],
    },

    {
      number: "08",
      title: "Fashion",
      subtitle: "Shoots",
      image: fashion,
      description:
        "Stylish editorial photography created to bring out confidence, personality, expression, and visual character.",
      tags: ["Fashion", "Editorial", "Creative"],
    },
  ];

  return (
    <section className="services-section" id="services">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="services-bg-number">03</div>

      <div className="services-orb services-orb-one"></div>
      <div className="services-orb services-orb-two"></div>

      <div className="services-container">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="services-header">

          <div className="services-eyebrow">
            <span></span>

            <p>WHAT WE CREATE</p>

            <span></span>
          </div>

          <h2>
            Stories captured
            <em>beautifully.</em>
          </h2>

          <p className="services-intro">
            From the biggest celebrations to the smallest
            expressions, we create photographs and films
            that allow you to experience your memories again
            and again.
          </p>

        </div>

        {/* =====================================================
            SERVICES GRID
        ===================================================== */}

        <div className="services-grid">

          {services.map((service, index) => (
            <article
              className="service-card"
              key={service.number}
              style={{
                "--service-delay": `${index * 0.12}s`,
              }}
            >

              {/* IMAGE */}

              <img
                className="service-image"
                src={service.image}
                alt={`${service.title} ${service.subtitle}`}
              />

              {/* DARK IMAGE OVERLAY */}

              <div className="service-card-overlay"></div>

              {/* SHINE EFFECT */}

              <div className="service-card-shine"></div>

              {/* TOP */}

              <div className="service-card-top">

                <span className="service-number">
                  {service.number}
                </span>

                <span className="service-plus">
                  +
                </span>

              </div>

              {/* CONTENT */}

              <div className="service-card-content">

                <h3>
                  {service.title}

                  <em>
                    {service.subtitle}
                  </em>
                </h3>

                <p>
                  {service.description}
                </p>

                <div className="service-tags">

                  {service.tags.map((tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  ))}

                </div>

              </div>

              {/* BOTTOM LINE */}

              <div className="service-card-line"></div>

              {/* GOLD GLOW */}

              <div className="service-card-glow"></div>

            </article>
          ))}

        </div>

        {/* =====================================================
            BOTTOM
        ===================================================== */}

        <div className="services-bottom">

          <div className="services-bottom-left">

            <span className="services-bottom-number">
              08
            </span>

            <span>
              WAYS TO TELL YOUR STORY
            </span>

          </div>

          <p>
            One story.
            <em>Endless memories.</em>
          </p>

          <a
            href="#contact"
            className="services-button"
          >
            <span>
              Plan Your Session
            </span>

            <b>
              ↗
            </b>
          </a>

        </div>

      </div>

    </section>
  );
}

export default Services;