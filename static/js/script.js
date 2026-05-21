/* =============================================
   KAMPUNG TANI — script.js
   ============================================= */

// ---- Mobile Nav Toggle ----
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click (mobile)
  navMenu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ---- Scroll Reveal ----
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  reveals.forEach(el => observer.observe(el));
}

// ---- Add reveal classes dynamically ----
function addRevealClasses() {
  const sections = [
    { selector: '.hero__content', delay: '' },
    { selector: '.hero__image-wrap', delay: 'reveal-delay-1' },
    { selector: '.about__image-wrap', delay: '' },
    { selector: '.about__content', delay: 'reveal-delay-1' },
    { selector: '.importance__title', delay: '' },
    { selector: '.importance__text', delay: 'reveal-delay-1' },
    { selector: '.why__title', delay: '' },
    { selector: '.why__subtitle', delay: 'reveal-delay-1' },
    { selector: '.ai-feature__phone-wrap', delay: '' },
    { selector: '.ai-feature__content', delay: 'reveal-delay-1' },
  ];

  sections.forEach(({ selector, delay }) => {
    const el = document.querySelector(selector);
    if (el) {
      el.classList.add('reveal');
      if (delay) el.classList.add(delay);
    }
  });

  // Cards with staggered delays
  document.querySelectorAll('.why-card').forEach((card, i) => {
    card.classList.add('reveal');
    if (i === 1) card.classList.add('reveal-delay-1');
    if (i === 2) card.classList.add('reveal-delay-2');
  });
}

// ---- Navbar: active link on scroll ----
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar__link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.remove('navbar__link--active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('navbar__link--active');
            }
          });
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach(section => observer.observe(section));
}

// =============================================
// INTEGRASI FORM UPLOAD & DYNAMIC FAQ KAMPUNG TANI
// =============================================

const config = window.KAMPUNG_TANI_CONFIG || {};

function setupUploadForm() {
  const form = document.getElementById("prediction-form");
  const input = document.getElementById("file-input");
  const dropZone = document.getElementById("drop-zone");
  const previewWrapper = document.getElementById("preview-wrapper");
  const previewImage = document.getElementById("preview-image");
  const previewName = document.getElementById("preview-name");
  const resetButton = document.getElementById("reset-button");
  const submitButton = document.getElementById("submit-button");
  const loadingBox = document.getElementById("loading-box");

  // Custom camera & gallery buttons
  const btnGallery = document.getElementById("btn-gallery");
  const btnCamera = document.getElementById("btn-camera");

  if (!form || !input) {
    return;
  }

  // Handle dynamic Camera / Gallery triggers on the single input file
  if (btnGallery) {
    btnGallery.addEventListener("click", () => {
      input.removeAttribute("capture");
      input.click();
    });
  }

  if (btnCamera) {
    btnCamera.addEventListener("click", () => {
      input.setAttribute("capture", "environment");
      input.click();
    });
  }

  // Also support clicking directly on dropZone (normal gallery file selector)
  if (dropZone) {
    dropZone.addEventListener("click", (e) => {
      // Prevent click bubble if clicking on gallery/camera buttons nested inside or handled separately
      if (e.target.closest("#btn-gallery") || e.target.closest("#btn-camera")) {
        return;
      }
      input.removeAttribute("capture");
      input.click();
    });

    // Drag and Drop visual feedback
    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.style.borderColor = "var(--green-dark)";
      dropZone.style.background = "var(--cream)";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "";
      dropZone.style.background = "";
    });

    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.style.borderColor = "";
      dropZone.style.background = "";
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        assignFile(file);
      }
    });
  }

  function updatePreview(file) {
    if (!file) {
      previewWrapper?.classList.add("hidden");
      if (previewImage) {
        previewImage.removeAttribute("src");
      }
      if (previewName) {
        previewName.textContent = "";
      }
      if (dropZone) {
        dropZone.style.display = "flex";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (previewImage) {
        previewImage.src = event.target?.result || "";
      }
      if (previewName) {
        previewName.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      }
      previewWrapper?.classList.remove("hidden");
      if (dropZone) {
        dropZone.style.display = "none"; // Clean UI: hide dropZone when image is selected
      }
    };
    reader.readAsDataURL(file);
  }

  function showPopupAlert(message) {
    // Hapus alert lama jika ada
    const existing = document.getElementById("popup-alert");
    if (existing) existing.remove();

    const alert = document.createElement("div");
    alert.id = "popup-alert";
    alert.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.45);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    ">
      <div style="
        background: #fff;
        border-radius: 14px;
        padding: 2rem 2rem 1.5rem;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        text-align: center;
        font-family: var(--font-body);
        animation: popIn 0.2s ease;
      ">
        <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
        <div style="
          font-size: 1rem;
          font-weight: 700;
          color: #9f1239;
          margin-bottom: 0.5rem;
        ">Gambar Belum Dipilih</div>
        <div style="
          font-size: 0.88rem;
          color: #6b7c6e;
          margin-bottom: 1.5rem;
          line-height: 1.6;
        ">${message}</div>
        <button onclick="document.getElementById('popup-alert').remove()" style="
          background: #14432d;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.7rem 2rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
        ">OK, Mengerti</button>
      </div>
    </div>
  `;
    document.body.appendChild(alert);

    // Klik backdrop untuk menutup
    alert.querySelector("div").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) alert.remove();
    });
  }

  function assignFile(file) {
    if (!file) return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    updatePreview(file);
  }

  input.addEventListener("change", () => {
    if (input.files && input.files[0]) {
      updatePreview(input.files[0]);
    }
  });

  resetButton?.addEventListener("click", () => {
    input.value = "";
    updatePreview(null);
    loadingBox?.classList.add("hidden");
    if (submitButton) {
      submitButton.removeAttribute("disabled");
      submitButton.classList.remove("opacity-50");
    }
  });

  form.addEventListener("submit", (e) => {
    if (!input.files || !input.files[0]) {
      e.preventDefault();
      showPopupAlert("Silakan pilih gambar terlebih dahulu.");
      return;
    }
    if (submitButton) {
      submitButton.setAttribute("disabled", "disabled");
      submitButton.style.opacity = "0.6";
    }
    loadingBox?.classList.remove("hidden");
  });
}

function setupFaqAccordion() {
  const searchInput = document.getElementById("faq-search");
  const faqItems = document.querySelectorAll(".faq-item");

  if (!config.askFaqUrl || !config.predictedClass || faqItems.length === 0) {
    return;
  }

  // Real-time Search / Filter Q&A list
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      faqItems.forEach(item => {
        const question = item.getAttribute("data-question").toLowerCase();
        if (question.includes(query)) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // Accordion Logic and On-Demand (Lazy) API Call
  faqItems.forEach(item => {
    const trigger = item.querySelector(".faq-trigger");
    const content = item.querySelector(".faq-content");
    const spinner = item.querySelector(".faq-spinner");
    const answerText = item.querySelector(".faq-answer-text");
    const icon = item.querySelector(".faq-icon");
    const question = item.getAttribute("data-question");

    if (!trigger || !content) return;

    let isLoaded = false;

    trigger.addEventListener("click", async () => {
      const isOpen = !content.classList.contains("hidden");

      // Close all other accordions for a clean presentation
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.querySelector(".faq-content")?.classList.add("hidden");
          const otherIcon = otherItem.querySelector(".faq-icon");
          if (otherIcon) {
            otherIcon.style.transform = "rotate(0deg)";
            otherIcon.classList.remove("text-emerald-700");
          }
        }
      });

      if (isOpen) {
        // Toggle closed
        content.classList.add("hidden");
        if (icon) {
          icon.style.transform = "rotate(0deg)";
          icon.classList.remove("text-emerald-700");
        }
      } else {
        // Toggle open
        content.classList.remove("hidden");
        if (icon) {
          icon.style.transform = "rotate(180deg)";
          icon.classList.add("text-emerald-700");
        }

        // Lazy fetch answer from LLM via /ask_faq if not loaded
        if (!isLoaded) {
          spinner.classList.remove("hidden");
          answerText.textContent = "";

          try {
            const response = await fetch(config.askFaqUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                question: question,
                predicted_class: config.predictedClass
              })
            });

            const payload = await response.json();
            if (!response.ok || payload.error) {
              throw new Error(payload.error || "Gagal mendapatkan respons AI.");
            }

            answerText.textContent = payload.answer;
            isLoaded = true;
          } catch (error) {
            answerText.innerHTML = `<span style="color:#be123c; font-weight:bold;">Error:</span> <span style="color:#f43f5e;">${error.message}</span>`;
          } finally {
            spinner.classList.add("hidden");
          }
        }
      }
    });
  });
}

// ---- Init All ----
document.addEventListener('DOMContentLoaded', () => {
  addRevealClasses();
  initReveal();
  initScrollSpy();
  setupUploadForm();
  setupFaqAccordion();
});
