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
      dropZone.classList.add("border-emerald-500", "bg-emerald-50");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("border-emerald-500", "bg-emerald-50");
    });

    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.classList.remove("border-emerald-500", "bg-emerald-50");
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
        dropZone.classList.remove("hidden");
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
        dropZone.classList.add("hidden"); // Clean UI: hide dropZone when image is selected
      }
    };
    reader.readAsDataURL(file);
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
    submitButton?.removeAttribute("disabled");
  });

  form.addEventListener("submit", (e) => {
    if (!input.files || !input.files[0]) {
      e.preventDefault();
      alert("Silakan pilih gambar terlebih dahulu.");
      return;
    }
    submitButton?.setAttribute("disabled", "disabled");
    submitButton?.classList.add("opacity-50");
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
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
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
            answerText.innerHTML = `<span class="text-rose-600 font-bold">Error:</span> <span class="text-rose-500">${error.message}</span>`;
          } finally {
            spinner.classList.add("hidden");
          }
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupUploadForm();
  setupFaqAccordion();
});
