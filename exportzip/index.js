const getEmbedUrl = `function getEmbedUrl(url) {
        if (!url) return "";

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const regExp = "/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/";

            const match = url.match(regExp);

            if (match && match[2].length === 11) {
                return \`https://www.youtube.com/embed/\${match[2]}?autoplay=1&rel=0\`;
            }
        }

        if (url.includes("vimeo.com")) {
            const id = url.split("/").pop();
            return \`https://player.vimeo.com/video/\${id}?autoplay=1\`;
        }

        return url;
    }`

const sectionScripts = {
about_stats:
`
    document.addEventListener("DOMContentLoaded", () => {
  const statCards = document.querySelectorAll(".aboutsection .grid > div");

  statCards.forEach((card, index) => {
    card.classList.add("scroll-animation", "scroll-fade-up");
    const delayClass = "delay-" + ((index + 1) * 100);
    card.classList.add(delayClass);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if(entry.isIntersecting){
        entry.target.classList.add("scroll-show");
        animateNumber(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  statCards.forEach((card) => observer.observe(card));

  function animateNumber(card) {
    const numberDiv = card.querySelector(".text-4xl");
    if (!numberDiv || numberDiv.dataset.animated === "true") return;
    numberDiv.dataset.animated = "true";

    const originalText = numberDiv.innerText.trim();
    const numericValue = parseInt(originalText.replace(/[^0-9]/g, ""));
    const suffix = originalText.replace(/[0-9]/g, "");

    if (isNaN(numericValue)) return;

    let start = 0;
    const duration = 2000;
    const stepTime = 16;
    const increment = numericValue / (duration / stepTime);

    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        numberDiv.innerText = numericValue + suffix;
        clearInterval(timer);
      } else {
        numberDiv.innerText = Math.floor(start) + suffix;
      }
    }, stepTime);
  }
})`,

  gallery_grid:`
    function initGridGallery() {
     const modal = document.getElementById("lightboxModal");
    const modalImg = document.getElementById("lightboxImage");
    const galleryItems = document.querySelectorAll(".gallery-item");

    function handleClick(item) {
      const img = item.querySelector("img");
      const src = img?.getAttribute("src") || "";
      modalImg.src = src;
        modalImg.setAttribute("srcSet", src);
      modal.classList.remove("hidden");
    }

    galleryItems.forEach((item) => {
      item.addEventListener("click", () => handleClick(item));
    });

    // close modal
    modal?.addEventListener("click", () => {
      modal.classList.add("hidden");
      modalImg.src = "";
    });

    modal?.querySelector("div")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
document.addEventListener("DOMContentLoaded", () => {
  initGridGallery();
})
  `,
  gallery_masonry:`
      function initMasonryGallery() {
     const closemodal = document.getElementById("closemodal");
    const modal = document.getElementById("lightboxModal");
    const modalImg = document.getElementById("lightboxImage");
    const galleryItems = document.querySelectorAll(".gallery-item-mas");

    function handleClick(item) {
      const img = item.querySelector("img");
      const src = img?.getAttribute("src") || "";
      modalImg.src = src;
        modalImg.setAttribute("srcSet", src);
      modal.classList.remove("hidden");
    }

    galleryItems.forEach((item) => {
      item.addEventListener("click", () => handleClick(item));
    });

    // close modal
    modal?.addEventListener("click", () => {
      modal.classList.add("hidden");
      modalImg.src = "";
    });
  closemodal?.addEventListener("click", () => {
      modal.classList.add("hidden");
      modalImg.src = "";
    });
    modal?.querySelector("div")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
document.addEventListener("DOMContentLoaded", () => {
  initMasonryGallery();
})
  `,
    gallery_slider:`
   function initSliderGallery() {
  const galleries = document.querySelectorAll(".gallery-section");

  galleries.forEach((gallery) => {
    let currentIndex = 0;

    const modalImg = document.getElementById("lightboxImage");
    const gallerytitle = document.getElementById("gallerytitle");
    const gallerycategory = document.getElementById("gallerycategory");
    const gallerycounter = document.getElementById("gallerycounter");

    const thumbs = gallery.querySelectorAll(".thumb");
    const nextBtn = gallery.querySelector(".nextBtn");
    const prevBtn = gallery.querySelector(".prevBtn");

    function show(index) {
      thumbs.forEach((t) => t.classList.remove("galleryActive"));
      thumbs.forEach((t) => t.classList.add("galleryInActive"));
   const img = thumbs[index]?.querySelector("img");
   const src = img?.getAttribute("src") || "";
      modalImg.src = src;
      modalImg.alt = img?.getAttribute("data-title") || "Gallery item "+index + 1;
      gallerytitle.textContent = img?.getAttribute("data-title") || "";
      gallerycategory.textContent = img?.getAttribute("data-category") || "";
      gallerycounter.textContent =String(index + 1).padStart(2, "0") + " / "+String(thumbs.length).padStart(2, "0")

      thumbs[index]?.classList.remove("galleryInActive");
      thumbs[index]?.classList.add("galleryActive");
    }

    function next() {
      currentIndex = (currentIndex + 1) % thumbs.length;
      show(currentIndex);
    }

    function prev() {
      currentIndex = (currentIndex - 1 + thumbs.length) % thumbs.length;
      show(currentIndex);
    }

    nextBtn?.addEventListener("click", next);
    prevBtn?.addEventListener("click", prev);

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        currentIndex = index;
        show(index);
      });
    });

    show(0);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  initSliderGallery();
})
  `,
 stats_grid:`
 document.addEventListener("DOMContentLoaded", () => {

      const section = document.querySelector(".stats-section");
  if (!section) return;

  const cards = section.querySelectorAll(
    ".bg-gradient-extra-light.rounded-xl.border.border-gray-200"
  );

    cards.forEach((card, index) => {
      // Add smooth transition like framer-motion
      card.style.transition = "opacity 0.7s ease, transform 0.7s ease";
      card.style.transitionDelay = index * 0.1 + "s";

      const valueEl = card.querySelector(
        ".stat-number"
      );

      if (!valueEl) return;

      const originalText = valueEl.innerText.trim();
      const numericValue = parseInt(originalText.replace(/[^0-9]/g, ""));

      const prefix = originalText.match(/^[^0-9]+/)?.[0] || "";
      const suffix = originalText.match(/[^0-9]+$/)?.[0] || "";

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // show animation
              card.style.opacity = "1";
              card.style.transform = "scale(1)";

              // counting animation
              if (!isNaN(numericValue)) {
                let start = 0;
                const duration = 2000;
                const increment = numericValue / (duration / 16);

                const timer = setInterval(() => {
                  start += increment;

                  if (start >= numericValue) {
                    valueEl.innerText = prefix + numericValue + suffix;
                    clearInterval(timer);
                  } else {
                    valueEl.innerText =
                      prefix + Math.floor(start) + suffix;
                  }
                }, 16);
              }

              observer.unobserve(card);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(card);
    });
  })
`,

faq_accordion:`

document.addEventListener("DOMContentLoaded", () => {
   const faqButtons = document.querySelectorAll(".faq-item button");

    faqButtons.forEach((btn) => {
        btn.addEventListener("click", function() {
            // Button ka parent (.faq-item) dhundo
            const currentItem = this.closest(".faq-item");
            
            // Check karo ki ye pehle se khula hai ya nahi
            const isOpen = currentItem.classList.contains("active");

            // STEP A: Baaki sabko band kar do (Reset All)
            document.querySelectorAll(".faq-item").forEach((item) => {
                item.classList.remove("active");
                item.classList.remove("border-primary", "shadow-lg"); // Highlight hatao
                item.classList.add("border-primary-light"); // Default border wapas lao
            });

            // STEP B: Agar clicked item band tha, to use khol do
            if (!isOpen) {
                currentItem.classList.add("active");
                currentItem.classList.remove("border-primary-light");
                currentItem.classList.add("border-primary", "shadow-lg"); // Highlight add karo
            }
        });
    });
    });`,

products_carousel:`
document.addEventListener("DOMContentLoaded", function () {

  const slides = document.querySelectorAll(".product-slide");
  const prevBtn = document.querySelector(".carousel-prev");
  const nextBtn = document.querySelector(".carousel-next");
  const dots = document.querySelectorAll(".product-dot"); // sirf existing dots use

  let currentIndex = 0;

  // ----------------------------
  // SHOW SLIDE FUNCTION
  // ----------------------------
  function showSlide(index, direction = 1) {

    slides.forEach((slide, i) => {
      slide.classList.add("hidden");
      slide.classList.remove("slide-enter-right", "slide-enter-left");

      if (i === index) {
        slide.classList.remove("hidden");
        slide.classList.add(
          direction > 0 ? "slide-enter-right" : "slide-enter-left"
        );
      }
    });

    // DOT ACTIVE STYLE
    dots.forEach((dot, i) => {
      dot.classList.remove("w-8", "bg-primary");
      dot.classList.add("w-2", "bg-gray-300");

      if (i === index) {
        dot.classList.remove("w-2", "bg-gray-300");
        dot.classList.add("w-8", "bg-primary");
      }
    });

    currentIndex = index;
  }

  // ----------------------------
  // NEXT BUTTON
  // ----------------------------
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      const next = (currentIndex + 1) % slides.length;
      showSlide(next, 1);
    });
  }

  // ----------------------------
  // PREV BUTTON
  // ----------------------------
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      const prev = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(prev, -1);
    });
  }

  // ----------------------------
  // DOT CLICK
  // ----------------------------
  dots.forEach((dot, index) => {
    dot.addEventListener("click", function () {
      showSlide(index, index > currentIndex ? 1 : -1);
    });
  });

  // INITIAL
  showSlide(0);

});
`,
testimonials_carousel:`
document.addEventListener("DOMContentLoaded", function () {

  const slides = document.querySelectorAll(".testimonial-slide");
  const prevBtn = document.querySelector(".testimonial-prev");
  const nextBtn = document.querySelector(".testimonial-next");
  const dots = document.querySelectorAll(".testimonial-dot");

  let currentIndex = 0;

  function showSlide(index, direction = 1) {

    slides.forEach((slide, i) => {
      slide.classList.add("hidden");
      slide.classList.remove("slide-enter-right", "slide-enter-left");

      if (i === index) {
        slide.classList.remove("hidden");
        slide.classList.add(
          direction > 0 ? "slide-enter-right" : "slide-enter-left"
        );
      }
    });

    dots.forEach((dot, i) => {
      dot.classList.remove("w-12", "bg-primary");
      dot.classList.add("w-3", "bg-gray-300");

      if (i === index) {
        dot.classList.remove("w-3", "bg-gray-300");
        dot.classList.add("w-12", "bg-primary");
      }
    });

    currentIndex = index;
  }

  // NEXT
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const next = (currentIndex + 1) % slides.length;
      showSlide(next, 1);
    });
  }

  // PREV
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      const prev = (currentIndex - 1 + slides.length) % slides.length;
      showSlide(prev, -1);
    });
  }

  // DOT CLICK
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      showSlide(index, index > currentIndex ? 1 : -1);
    });
  });

  // INIT
  showSlide(0);

});

`,
video_popup: `

document.addEventListener("DOMContentLoaded", function () {
  ${getEmbedUrl}
  
    const section = document.querySelector(".video-popup-section");

    if (!section) return;

    const playBtn = section.querySelector(".video-play-btn");
    const overlay = section.querySelector(".video-poster-overlay");
    const playerMount = section.querySelector(".video-player-mount");

    if (!playBtn || !overlay || !playerMount) return;

    // Get video URL from poster iframe
    let videourl = "";

    const posterIframe = overlay.querySelector("iframe");

    if (posterIframe) {
        videourl = posterIframe.getAttribute("src") || "";
    }

    if (!videourl) return;

    function handlePlayClick() {

        overlay.classList.add("hidden");
        playerMount.classList.remove("hidden");

        const isDirectVideo =
            videourl.endsWith(".mp4") ||
            videourl.endsWith(".webm") ||
            videourl.endsWith(".ogg") ||
            videourl.endsWith(".mov");

        if (isDirectVideo) {

            playerMount.innerHTML = \`
                <video
                    class="h-full w-full object-cover bg-black"
                    src="\${videourl}"
                    controls
                    autoplay
                    playsinline
                ></video>
            \`;

        } else {

            playerMount.innerHTML = \`
                <iframe
                    class="h-full w-full border-0"
                    src="\${getEmbedUrl(videourl)}"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowfullscreen
                ></iframe>
            \`;

        }
    }

    playBtn.addEventListener("click", handlePlayClick);

});
`,
video_split: `

document.addEventListener("DOMContentLoaded", function () {
  ${getEmbedUrl}

    const section = document.querySelector(".video-split-section");

    if (!section) return;

    const ctaBtn = section.querySelector(".left-cta-play-btn");
    const playBtn = section.querySelector(".video-play-btn");
    const overlay = section.querySelector(".video-poster-overlay");
    const playerMount = section.querySelector(".video-player-mount");

    if (!overlay || !playerMount) return;

    // Get video URL from poster iframe
    let videourl = "";

    const posterIframe = overlay.querySelector("iframe");

    if (posterIframe) {
        videourl = posterIframe.getAttribute("src") || "";
    }

    if (!videourl) return;

    function handlePlayClick(e) {

        e.preventDefault();

        overlay.classList.add("hidden");
        playerMount.classList.remove("hidden");

        const lowerUrl = videourl.toLowerCase();

        const isDirectVideo =
            lowerUrl.endsWith(".mp4") ||
            lowerUrl.endsWith(".webm") ||
            lowerUrl.endsWith(".ogg") ||
            lowerUrl.endsWith(".mov");

        if (isDirectVideo) {

            playerMount.innerHTML = \`
                <video
                    class="h-full w-full object-cover bg-black"
                    src="\${videourl}"
                    controls
                    autoplay
                    playsinline
                ></video>
            \`;

        } else {

            playerMount.innerHTML = \`
                <iframe
                    class="h-full w-full border-0"
                    src="\${getEmbedUrl(videourl)}"
                    title="Video Player"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowfullscreen
                ></iframe>
            \`;

        }
    }

    ctaBtn?.addEventListener("click", handlePlayClick);
    playBtn?.addEventListener("click", handlePlayClick);

});
`,
video_centered: `
document.addEventListener("DOMContentLoaded", function () {
${getEmbedUrl}
   

    const section = document.querySelector(".video-centered-section");

    if (!section) return;

    const playBtn = section.querySelector(".video-play-btn");
    const overlay = section.querySelector(".video-poster-overlay");
    const playerMount = section.querySelector(".video-player-mount");

    if (!playBtn || !overlay || !playerMount) return;

    // Get the video URL from the existing iframe
    const posterIframe = overlay.querySelector("iframe");

    if (!posterIframe) return;

    const videourl = posterIframe.getAttribute("src");

    if (!videourl) return;

    playBtn.addEventListener("click", function () {

        overlay.classList.add("hidden");
        playerMount.classList.remove("hidden");

        const isDirectVideo =
            videourl.endsWith(".mp4") ||
            videourl.endsWith(".webm") ||
            videourl.endsWith(".ogg") ||
            videourl.endsWith(".mov");

        if (isDirectVideo) {

            playerMount.innerHTML = \`
                <video
                    src="\${videourl}"
                    class="h-full w-full object-cover bg-black"
                    controls
                    autoplay
                    playsinline
                ></video>
            \`;

        } else {

            playerMount.innerHTML = \`
                <iframe
                    src="\${getEmbedUrl(videourl)}"
                    class="h-full w-full border-0"
                    allow="autoplay; encrypted-media; fullscreen"
                    allowfullscreen
                ></iframe>
            \`;

        }

    });

});
`,
testimonials_video: `
  document.addEventListener("DOMContentLoaded", function () {

  // Create Modal
  const modal = document.createElement("div");
  modal.className =
    "video-modal-wrapper fixed inset-0 z-[9999] hidden items-center justify-center bg-black/80 p-4";

  modal.innerHTML = \`
    <div class="relative w-full max-w-5xl">
      <button
        class="video-modal-close absolute -top-12 right-0 text-white text-5xl leading-none hover:opacity-80">
        &times;
      </button>

      <div class="video-player-container overflow-hidden rounded-xl bg-black"></div>
    </div>
  \`;

  document.body.appendChild(modal);

  const playerContainer = modal.querySelector(".video-player-container");
  const closeBtn = modal.querySelector(".video-modal-close");

  function getEmbedUrl(url) {

    // youtube.com/watch?v=
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      return \`https://www.youtube.com/embed/\${id}?autoplay=1&rel=0\`;
    }

    // youtu.be/
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1].split("?")[0];
      return \`https://www.youtube.com/embed/\${id}?autoplay=1&rel=0\`;
    }

    // Vimeo
    if (url.includes("vimeo.com")) {
      const id = url.split("/").pop();
      return \`https://player.vimeo.com/video/\${id}?autoplay=1\`;
    }

    return url;
  }

  // Open Video
  document.querySelectorAll(".video-trigger").forEach(function (trigger) {

    trigger.addEventListener("click", function () {

      const videoUrl = trigger.getAttribute("data-video-url");

      if (!videoUrl) return;

      const isDirectVideo = /\.(mp4|webm|ogg|mov|m4v)(\.*)?$/i.test(videoUrl);

      if (isDirectVideo) {

        playerContainer.innerHTML = \`
          <video
            src="\${videoUrl}"
            controls
            autoplay
            class="w-full aspect-video">
          </video>
        \`;

      } else {

        playerContainer.innerHTML = \`
          <iframe
            src="\${getEmbedUrl(videoUrl)}"
            class="w-full aspect-video border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowfullscreen>
          </iframe>
        \`;
      }

      modal.classList.remove("hidden");
      modal.classList.add("flex");
      document.body.style.overflow = "hidden";
    });

  });

  function closeModal() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    playerContainer.innerHTML = "";
    document.body.style.overflow = "";
  }

  // Close Button
  closeBtn.addEventListener("click", closeModal);

  // Close on Backdrop
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // ESC Key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
    }
  });

});
`,
team_stacked:`
function initTeamSection(id = null) {
    const section =
        (id ? document.getElementById(id) : null) ||
        document.querySelector(".team-stacked-section");

    if (!section) return;

    const buttons = section.querySelectorAll(".team-member-button");

    if (!buttons.length) return;

    const detail = section.querySelector(".team-member-detail");

    if (!detail) return;

    const image = detail.querySelector(".team-detail-image");
    const name = detail.querySelector(".team-detail-name");
    const role = detail.querySelector(".team-detail-role");
    const bio = detail.querySelector(".team-detail-bio");

    const twitter = detail.querySelector(".team-twitter");
    const linkedin = detail.querySelector(".team-linkedin");
    const github = detail.querySelector(".team-github");
    const email = detail.querySelector(".team-email");

    function activateMember(button) {
        // Reset all buttons
        buttons.forEach((btn) => {
            btn.classList.remove(
                "bg-primary",
                "text-primary-foreground",
                "shadow-lg"
            );

            btn.classList.add(
                "border",
                "border-gray-500/15",
                "bg-card"
            );

            const btnName = btn.querySelector(".team-item-name");
            if (btnName) {
                btnName.classList.remove("text-white");
                btnName.classList.add("text-gray-900");
            }

            const btnRole = btn.querySelector(".team-item-role");
            if (btnRole) {
                btnRole.classList.remove("text-white/70");
                btnRole.classList.add("text-gray-600");
            }
        });

        // Active button
        button.classList.remove(
            "border",
            "border-gray-500/15",
            "bg-card"
        );

        button.classList.add(
            "bg-primary",
            "text-primary-foreground",
            "shadow-lg"
        );

        const activeName = button.querySelector(".team-item-name");
        if (activeName) {
            activeName.classList.remove("text-gray-900");
            activeName.classList.add("text-white");
        }

        const activeRole = button.querySelector(".team-item-role");
        if (activeRole) {
            activeRole.classList.remove("text-gray-600");
            activeRole.classList.add("text-white/70");
        }

        // Update Detail Card
        if (image) {
            image.src = button.dataset.image || "";
            image.alt = button.dataset.name || "";
        }

        if (name) {
            name.textContent = button.dataset.name || "";
        }

        if (role) {
            role.textContent = button.dataset.role || "";
        }

        if (bio) {
            bio.textContent = button.dataset.bio || "";
        }

        // Twitter
        if (twitter) {
            if (button.dataset.twitter) {
                twitter.href = button.dataset.twitter;
                twitter.classList.remove("hidden");
            } else {
                twitter.classList.add("hidden");
            }
        }

        // LinkedIn
        if (linkedin) {
            if (button.dataset.linkedin) {
                linkedin.href = button.dataset.linkedin;
                linkedin.classList.remove("hidden");
            } else {
                linkedin.classList.add("hidden");
            }
        }

        // GitHub
        if (github) {
            if (button.dataset.github) {
                github.href = button.dataset.github;
                github.classList.remove("hidden");
            } else {
                github.classList.add("hidden");
            }
        }

        // Email
        if (email) {
            if (button.dataset.email) {
                email.href = "mailto:" + button.dataset.email;
                email.classList.remove("hidden");
            } else {
                email.classList.add("hidden");
            }
        }
    }

    // Click Events
    buttons.forEach((button) => {
        button.addEventListener("click", function () {
            activateMember(button);
        });
    });

    // Default Active Member
    activateMember(buttons[0]);
}

function initSliderGallery() {
    const galleries = document.querySelectorAll(".gallery-section");

    galleries.forEach((gallery) => {
        let currentIndex = 0;

        const modalImg = document.getElementById("lightboxImage");
        const gallerytitle = document.getElementById("gallerytitle");
        const gallerycategory = document.getElementById("gallerycategory");
        const gallerycounter = document.getElementById("gallerycounter");

        const thumbs = gallery.querySelectorAll(".thumb");
        const nextBtn = gallery.querySelector(".nextBtn");
        const prevBtn = gallery.querySelector(".prevBtn");

        if (!thumbs.length) return;

        function show(index) {
            thumbs.forEach((t) => {
                t.classList.remove("galleryActive");
                t.classList.add("galleryInActive");
            });

            const img = thumbs[index].querySelector("img");

            if (!img) return;

            if (modalImg) {
                modalImg.src = img.getAttribute("src") || "";
                modalImg.alt =
                    img.getAttribute("data-title") ||
                    "Gallery item " + (index + 1);
            }

            if (gallerytitle) {
                gallerytitle.textContent =
                    img.getAttribute("data-title") || "";
            }

            if (gallerycategory) {
                gallerycategory.textContent =
                    img.getAttribute("data-category") || "";
            }

            if (gallerycounter) {
                gallerycounter.textContent =
                    String(index + 1).padStart(2, "0") +
                    " / " +
                    String(thumbs.length).padStart(2, "0");
            }

            thumbs[index].classList.remove("galleryInActive");
            thumbs[index].classList.add("galleryActive");
        }

        function next() {
            currentIndex = (currentIndex + 1) % thumbs.length;
            show(currentIndex);
        }

        function prev() {
            currentIndex =
                (currentIndex - 1 + thumbs.length) % thumbs.length;
            show(currentIndex);
        }

        if (nextBtn) {
            nextBtn.addEventListener("click", next);
        }

        if (prevBtn) {
            prevBtn.addEventListener("click", prev);
        }

        thumbs.forEach((thumb, index) => {
            thumb.addEventListener("click", function () {
                currentIndex = index;
                show(index);
            });
        });

        show(0);
    });
}

// Initialize Everything
document.addEventListener("DOMContentLoaded", function () {
    initTeamSection();
    initSliderGallery();
});
`,
services_accordion:`
document.addEventListener("DOMContentLoaded", function () {

    const items = document.querySelectorAll(".service-accordion-item");

    if (!items.length) return;

    let activeIndex = 0;

    function setActive(newActiveIndex) {

        activeIndex = newActiveIndex;

        items.forEach(function (item, index) {

            const content = item.querySelector(".service-accordion-content");
            const icon = item.querySelector(".service-accordion-icon");

            if (!content || !icon) return;

            if (index === activeIndex) {

                content.classList.remove("grid-rows-[0fr]");
                content.classList.add("grid-rows-[1fr]");

                icon.setAttribute("data-lucide", "ChevronDown");

            } else {

                content.classList.remove("grid-rows-[1fr]");
                content.classList.add("grid-rows-[0fr]");

                icon.setAttribute("data-lucide", "ChevronRight");

            }

        });

        // Refresh Lucide icons if available
        if (window.lucide) {
            lucide.createIcons();
        }

    }

    // Open first item by default
    setActive(0);

    items.forEach(function (item, index) {

        const button = item.querySelector(".service-accordion-button");

        if (!button) return;

        button.addEventListener("click", function () {

            if (activeIndex === index) {
                setActive(-1); // Close all
            } else {
                setActive(index); // Open clicked
            }

        });

    });

});
`,
pricing_toggle:`
 document.addEventListener("DOMContentLoaded", function () {

    const monthlyBtn = document.querySelector(".pricing-toggle-monthly");
    const yearlyBtn = document.querySelector(".pricing-toggle-yearly");
    const cards = document.querySelectorAll(".pricing-card");

    if (!monthlyBtn || !yearlyBtn || !cards.length) return;

    function setBillingPeriod(isYearly) {

        // Toggle button styles
        if (isYearly) {

            yearlyBtn.classList.add("bg-primary", "text-white", "shadow");
            yearlyBtn.classList.remove("text-gray-700");

            monthlyBtn.classList.remove("bg-primary", "text-white", "shadow");
            monthlyBtn.classList.add("text-gray-700");

        } else {

            monthlyBtn.classList.add("bg-primary", "text-white", "shadow");
            monthlyBtn.classList.remove("text-gray-700");

            yearlyBtn.classList.remove("bg-primary", "text-white", "shadow");
            yearlyBtn.classList.add("text-gray-700");

        }

        // Update every pricing card
        cards.forEach(function (card) {

            const priceEl = card.querySelector(".pricing-card-price");
            const periodEl = card.querySelector(".pricing-card-period");
            const infoEl = card.querySelector(".pricing-card-billed-info");

            if (priceEl) {

                const monthly = priceEl.getAttribute("data-monthly");
                const yearly = priceEl.getAttribute("data-yearly");

                priceEl.textContent = isYearly ? yearly : monthly;
            }

            if (periodEl) {

                const hasYearly =
                    periodEl.getAttribute("data-has-yearly") === "true";

                periodEl.textContent =
                    isYearly && hasYearly ? "/yr" : "/mo";
            }

            if (infoEl) {

                const hasYearly =
                    infoEl.getAttribute("data-has-yearly") === "true";

                if (isYearly && hasYearly) {
                    infoEl.classList.remove("hidden");
                } else {
                    infoEl.classList.add("hidden");
                }

            }

        });

    }

    monthlyBtn.addEventListener("click", function () {
        setBillingPeriod(false);
    });

    yearlyBtn.addEventListener("click", function () {
        setBillingPeriod(true);
    });

    // Default state
    setBillingPeriod(true);

});
`,
stats_circle:`
 document.addEventListener("DOMContentLoaded", function () {

    const section =
        document.querySelector(".stats-circle-section");

    if (!section) return;

    const cards = section.querySelectorAll(".glass-stat-card");

    cards.forEach(function (card) {

        const valueSpan = card.querySelector(".stat-value-num");

        if (!valueSpan) return;

        const numericValue = parseInt(
            card.getAttribute("data-numeric-value") || "0",
            10
        );

        const prefix = card.getAttribute("data-prefix") || "";
        const suffix = card.getAttribute("data-suffix") || "";

        if (isNaN(numericValue) || numericValue <= 0) return;

        const observer = new IntersectionObserver(function (entries) {

            const entry = entries[0];

            if (!entry.isIntersecting) return;

            observer.disconnect();

            let current = 0;

            const duration = 1600;
            const fps = 60;
            const totalFrames = Math.round(duration / (1000 / fps));

            const timer = setInterval(function () {

                current++;

                const eased =
                    1 - Math.pow(1 - current / totalFrames, 3);

                const number = Math.min(
                    Math.floor(eased * numericValue),
                    numericValue
                );

                valueSpan.innerHTML = \`
                    \${prefix ? \`<span class="text-lg font-medium text-white/45">\${prefix}</span>\` : ""}
                    \${number}
                    \${suffix ? \`<span class="ml-0.5 text-base font-medium text-white/45">\${suffix}</span>\` : ""}
                \`;

                if (current >= totalFrames) {

                    clearInterval(timer);

                    valueSpan.innerHTML = \`
                        \${prefix ? \`<span class="text-lg font-medium text-white/45">\${prefix}</span>\` : ""}
                        \${numericValue}
                        \${suffix ? \`<span class="ml-0.5 text-base font-medium text-white/45">\${suffix}</span>\` : ""}
                    \`;

                }

            }, 1000 / fps);

        }, {
            threshold: 0.4
        });

        observer.observe(card);

    });

});
`,
offices_map:`
document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".office-item");
    const iframe = document.querySelector(".office-map");
    const cityLabel = document.querySelector(".office-map-city");
    const mapLink = document.querySelector(".office-map-link");

    if (!buttons.length || !iframe || !cityLabel) return;

    function setActiveOffice(button) {
        // Reset all buttons
        buttons.forEach(function (btn) {
            btn.classList.remove(
                "border-[var(--primary-color-light)]!",
                "bg-primary-light"
            );

            btn.classList.add("border-gray-600/20");

            const details = btn.querySelector(".office-details");
            if (details) {
                details.classList.add("hidden");
            }
        });

        // Active button
        button.classList.remove("border-gray-600/20");

        button.classList.add(
            "border-[var(--primary-color-light)]!",
            "bg-primary-light"
        );

        const activeDetails = button.querySelector(".office-details");
        if (activeDetails) {
            activeDetails.classList.remove("hidden");
        }

        // Update map
        const mapUrl = button.getAttribute("data-map");
        const city = button.getAttribute("data-city") || "";

        if (mapUrl) {
            iframe.src = mapUrl;

            if (mapLink) {
                // Open Google Maps instead of embed
                mapLink.href = mapUrl.replace("&output=embed", "");
            }
        }

        cityLabel.textContent = "Viewing: " + city;
    }

    // Click Events
    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            setActiveOffice(button);
        });
    });

    // Default Active Office
    setActiveOffice(buttons[0]);
});

`,
newsletter_popup:`
document.addEventListener("DOMContentLoaded", function () {

    const wrapper = document.querySelector(".newsletter-popup-wrapper");

    const openBtn = document.querySelector(".newsletter-popup-open");

    const closeBtns = document.querySelectorAll(".newsletter-popup-close");

    if (!wrapper || !openBtn) return;

    function showPopup() {
        wrapper.classList.remove("hidden");
        openBtn.classList.add("hidden");
    }

    function hidePopup() {
        wrapper.classList.add("hidden");
        openBtn.classList.remove("hidden");
    }

    // Default state (true = open, false = closed)
    const defaultOpen = true;

    if (defaultOpen) {
        showPopup();
    } else {
        hidePopup();
    }

    openBtn.addEventListener("click", showPopup);

    closeBtns.forEach(function (button) {
        button.addEventListener("click", hidePopup);
    });

});
`,
features_tabs:`
document.addEventListener("DOMContentLoaded", function () {

    const buttons = document.querySelectorAll(".feature-tab-btn");
    const panels = document.querySelectorAll(".feature-tab-panel");

    if (!buttons.length || !panels.length) return;

    function setActiveTab(index) {

        buttons.forEach(function (button, i) {

            if (i === index) {

                button.classList.add(
                    "bg-primary",
                    "text-white",
                    "shadow-md",
                    "shadow-primary-20"
                );

                button.classList.remove(
                    "text-gray-600",
                    "hover-bg-primary-light"
                );

            } else {

                button.classList.remove(
                    "bg-primary",
                    "text-white",
                    "shadow-md",
                    "shadow-primary-20"
                );

                button.classList.add(
                    "text-gray-600",
                    "hover-bg-primary-light"
                );

            }

        });

        panels.forEach(function (panel, i) {
            panel.classList.toggle("hidden", i !== index);
        });

    }

    // Default active tab
    setActiveTab(0);

    // Click events
    buttons.forEach(function (button, index) {

        button.addEventListener("click", function () {
            setActiveTab(index);
        });

    });

});
`,
clients_carousel: `
document.addEventListener("DOMContentLoaded", () => {

    const autoPlay = true;
    const autoPlaySpeed = 3000;
    const infinite = true;

    const container = document.querySelector("#clients");

    if (!container) return;

    const cards = [...container.querySelectorAll(".client-card")];
    const prevBtn = container.querySelector(".client-prev");
    const nextBtn = container.querySelector(".client-next");

    if (!cards.length) return;

    let current = 0;
    let timer;

    function getVisibleCount() {
        if (window.innerWidth >= 1024) return 4;
        if (window.innerWidth >= 640) return 2;
        return 1;
    }

    function updateSlider() {

        const visible = getVisibleCount();

        cards.forEach(card => card.classList.add("hidden"));

        for (let i = 0; i < visible; i++) {
            const index = (current + i) % cards.length;
            cards[index].classList.remove("hidden");
        }

    }

    function nextSlide() {

        if (infinite) {
            current = (current + 1) % cards.length;
        } else {
            current = Math.min(
                current + 1,
                cards.length - getVisibleCount()
            );
        }

        updateSlider();
    }

    function prevSlide() {

        if (infinite) {
            current = (current - 1 + cards.length) % cards.length;
        } else {
            current = Math.max(current - 1, 0);
        }

        updateSlider();
    }

    prevBtn?.addEventListener("click", () => {
        nextStop();
        prevSlide();
        autoStart();
    });

    nextBtn?.addEventListener("click", () => {
        nextStop();
        nextSlide();
        autoStart();
    });

    window.addEventListener("resize", updateSlider);

    function autoStart() {
        if (!autoPlay || cards.length <= getVisibleCount()) return;

        timer = setInterval(nextSlide, autoPlaySpeed);
    }

    function nextStop() {
        clearInterval(timer);
    }

    updateSlider();
    autoStart();

});
`,
integrations_carousel:`
document.addEventListener("DOMContentLoaded", function () {
    const visible = 3; // Number of visible cards

    const cards = document.querySelectorAll(".integration-card");
    const prevBtn = document.querySelector(".integration-prev");
    const nextBtn = document.querySelector(".integration-next");

    if (!cards.length || !prevBtn || !nextBtn) return;

    let index = 0;
    const totalCards = cards.length;
    const maxIndex = Math.max(0, totalCards - visible);

    function updateCarousel() {
        // Keep index in range
        if (index < 0) index = 0;
        if (index > maxIndex) index = maxIndex;

        // Show only visible cards
        cards.forEach((card, i) => {
            if (i >= index && i < index + visible) {
                card.classList.remove("hidden");
            } else {
                card.classList.add("hidden");
            }
        });

        // Enable / Disable buttons
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === maxIndex;
    }

    prevBtn.addEventListener("click", function () {
        if (index > 0) {
            index--;
            updateCarousel();
        }
    });

    nextBtn.addEventListener("click", function () {
        if (index < maxIndex) {
            index++;
            updateCarousel();
        }
    });

    // Initialize
    updateCarousel();
});
`,
team_slider:`
const visible = 4;

const cards = document.querySelectorAll(".team-slide");
const prevBtn = document.querySelector(".team-prev");
const nextBtn = document.querySelector(".team-next");

if (cards.length) {
  let offset = 0;

  const totalLength = cards.length;
  const maxOffset = Math.max(0, totalLength - visible);

  function updateSlider() {
    cards.forEach((card, index) => {
      if (index >= offset && index < offset + visible) {
        card.classList.remove("hidden");
      } else {
        card.classList.add("hidden");
      }
    });

    if (prevBtn) {
      prevBtn.disabled = offset === 0;
    }

    if (nextBtn) {
      nextBtn.disabled = offset >= maxOffset;
    }
  }

  function handlePrev() {
    if (offset > 0) {
      offset--;
      updateSlider();
    }
  }

  function handleNext() {
    if (offset < maxOffset) {
      offset++;
      updateSlider();
    }
  }

  prevBtn?.addEventListener("click", handlePrev);
  nextBtn?.addEventListener("click", handleNext);

  updateSlider();
}
`,
header_classic:`
 document.querySelectorAll(".has-submenu").forEach((item) => {
    const submenu = item.querySelector(".submenu");

    if (!submenu) return;

    let timeout;

    const showMenu = () => {
        clearTimeout(timeout);
        submenu.classList.add("show");
    };

    const hideMenu = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            submenu.classList.remove("show");
        }, 120);
    };

    item.addEventListener("mouseenter", showMenu);
    item.addEventListener("mouseleave", hideMenu);

    submenu.addEventListener("mouseenter", showMenu);
    submenu.addEventListener("mouseleave", hideMenu);
});
`

}

module.exports = sectionScripts;