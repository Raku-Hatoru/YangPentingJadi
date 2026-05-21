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

  if (!form || !input || !dropZone) {
    return;
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
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (previewImage) {
        previewImage.src = event.target?.result || "";
      }
      if (previewName) {
        previewName.textContent = `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      }
      previewWrapper?.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }

  function assignFile(file) {
    if (!file) {
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    updatePreview(file);
  }

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.borderColor = "#15803d";
    dropZone.style.background = "#ecfdf5";
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
    assignFile(file);
  });

  input.addEventListener("change", () => {
    updatePreview(input.files?.[0]);
  });

  resetButton?.addEventListener("click", () => {
    input.value = "";
    updatePreview(null);
    loadingBox?.classList.add("hidden");
    submitButton?.removeAttribute("disabled");
  });

  form.addEventListener("submit", () => {
    if (!input.files || !input.files[0]) {
      return;
    }
    submitButton?.setAttribute("disabled", "disabled");
    loadingBox?.classList.remove("hidden");
  });
}

function setupFaqForm() {
  const input = document.getElementById("faq-question-input");
  const button = document.getElementById("faq-question-button");
  const answerBox = document.getElementById("faq-answer");
  const errorBox = document.getElementById("faq-error");
  const loadingBox = document.getElementById("faq-loading");

  if (!input || !button || !config.askFaqUrl || !config.predictedClass) {
    return;
  }

  async function submitQuestion() {
    const question = input.value.trim();
    answerBox?.classList.add("hidden");
    errorBox?.classList.add("hidden");

    if (!question) {
      if (errorBox) {
        errorBox.textContent = "Silakan isi pertanyaan terlebih dahulu.";
        errorBox.classList.remove("hidden");
      }
      return;
    }

    loadingBox?.classList.remove("hidden");
    button.setAttribute("disabled", "disabled");

    try {
      const response = await fetch(config.askFaqUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question,
          predicted_class: config.predictedClass
        })
      });

      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Gagal mendapatkan jawaban AI.");
      }

      if (answerBox) {
        answerBox.textContent = payload.answer;
        answerBox.classList.remove("hidden");
      }
    } catch (error) {
      if (errorBox) {
        errorBox.textContent = error.message;
        errorBox.classList.remove("hidden");
      }
    } finally {
      loadingBox?.classList.add("hidden");
      button.removeAttribute("disabled");
    }
  }

  button.addEventListener("click", submitQuestion);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitQuestion();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupUploadForm();
  setupFaqForm();
});
