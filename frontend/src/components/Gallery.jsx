
import { useCallback, useEffect, useState } from "react";
import "../styles/components/Gallery.css";

import hinduWedding from "../assets/hindu.jpeg";
import aestheticWedding from "../assets/asethetic.jpeg";
import candidWedding from "../assets/candid.jpeg";
import muslimWedding from "../assets/muslim.jpeg";
import postWedding from "../assets/post wedding.jpeg";
import familyWedding from "../assets/family.jpeg";
import preWedding from "../assets/pre wedding.jpeg";
import cinematicWedding from "../assets/cinematic (2).jpeg";
import coupleWedding from "../assets/couple.jpeg";
import receptionWedding from "../assets/reception.jpeg";
import candidsWedding from "../assets/candids.jpeg";
import christianWedding from "../assets/chirstian.jpeg";

function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  const galleryImages = [
    { image: hinduWedding, title: "Hindu Wedding" },
    { image: aestheticWedding, title: "Aesthetic Wedding" },
    { image: candidWedding, title: "Candid Moments" },
    { image: muslimWedding, title: "Muslim Wedding" },
    { image: postWedding, title: "Post Wedding" },
    { image: familyWedding, title: "Family Moments" },
    { image: preWedding, title: "Pre Wedding" },
    { image: cinematicWedding, title: "Cinematic Story" },
    { image: coupleWedding, title: "Couple Portrait" },
    { image: receptionWedding, title: "Wedding Reception" },
    { image: candidsWedding, title: "Wedding Candid" },
    { image: christianWedding, title: "Christian Wedding" },
  ];

  const openLightbox = (index) => {
    setSelectedImage(index);
  };

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImage((current) => {
      if (current === null) return 0;
      return (current + 1) % galleryImages.length;
    });
  }, [galleryImages.length]);

  const previousImage = useCallback(() => {
    setSelectedImage((current) => {
      if (current === null) return galleryImages.length - 1;

      return (
        (current - 1 + galleryImages.length) %
        galleryImages.length
      );
    });
  }, [galleryImages.length]);

  // Lock background scrolling while the lightbox is open.
  useEffect(() => {
    if (selectedImage === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedImage]);

  // Keyboard controls.
  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") nextImage();
      if (event.key === "ArrowLeft") previousImage();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedImage, closeLightbox, nextImage, previousImage]);

  return (
    <>
      <section className="gallery-section" id="gallery">
        <div className="gallery-bg-number">04</div>

        <div className="gallery-header">
          <div className="gallery-eyebrow">
            <span></span>
            <p>OUR WEDDING STORIES</p>
            <span></span>
          </div>

          <h2>
            Moments
            <em>Worth Remembering</em>
          </h2>

          <p className="gallery-intro">
            Every smile, every glance, every celebration —
            beautifully preserved as timeless wedding memories.
          </p>
        </div>

        <div className="gallery-grid">
          {galleryImages.map((item, index) => (
            <div
              className={`gallery-box ${
                index === 0
                  ? "large"
                  : index === 3 || index === 9
                    ? "tall"
                    : index === 6
                      ? "wide"
                      : ""
              }`}
              key={index}
              onClick={() => openLightbox(index)}
            >
              <img src={item.image} alt={item.title} />

              <div className="gallery-image-overlay"></div>

              <span>
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="gallery-box-icon">+</div>

              <div className="gallery-photo-title">
                <small>VIEW STORY</small>
                <strong>{item.title}</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="gallery-bottom">
          <p>
            Your love story deserves to be remembered
            <span> beautifully.</span>
          </p>

          <a href="#contact" className="gallery-button">
            Let's Create Your Story
            <b>↗</b>
          </a>
        </div>
      </section>

      {selectedImage !== null && (
        <div
          className="gallery-lightbox"
          onClick={(event) => {
            if (event.target.classList.contains("gallery-lightbox")) {
              closeLightbox();
            }
          }}
        >
          <div className="lightbox-top">
            <div className="lightbox-counter">
              <span>
                {String(selectedImage + 1).padStart(2, "0")}
              </span>
              <i>/</i>
              <span>
                {String(galleryImages.length).padStart(2, "0")}
              </span>
            </div>

            <button
              className="lightbox-close"
              onClick={closeLightbox}
              aria-label="Close gallery"
            >
              <span></span>
              <span></span>
            </button>
          </div>

          <button
            className="lightbox-arrow lightbox-prev"
            onClick={previousImage}
            aria-label="Previous image"
          >
            <span>←</span>
            <small>PREVIOUS</small>
          </button>

          <div className="lightbox-image-wrapper">
            <img
              key={selectedImage}
              src={galleryImages[selectedImage].image}
              alt={galleryImages[selectedImage].title}
              className="lightbox-image"
            />
          </div>

          <button
            className="lightbox-arrow lightbox-next"
            onClick={nextImage}
            aria-label="Next image"
          >
            <small>NEXT</small>
            <span>→</span>
          </button>

          <div className="lightbox-bottom">
            <div className="lightbox-title">
              <small>INFINITY PIXEL STUDIOS</small>
              <h3>{galleryImages[selectedImage].title}</h3>
            </div>

            <button
              className="lightbox-back"
              onClick={closeLightbox}
            >
              <span>↙</span>
              Back to Gallery
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;
