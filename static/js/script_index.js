document.addEventListener("DOMContentLoaded", () => {

    // ELEMENTS REFERENCES

    const form = document.getElementById("prediction-form");
    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");
    const previewWrapper = document.getElementById("preview-wrapper");
    const previewImage = document.getElementById("preview-image");
    const previewName = document.getElementById("preview-name");
    const resetButton = document.getElementById("reset-button");
    const loadingBox = document.getElementById("loading-box");
    const submitButton = document.getElementById("submit-button");

    // Safety check
    if (!form || !uploadZone || !fileInput) return;
    // CLICK UPLOAD ZONE
    uploadZone.addEventListener("click", () => {
        fileInput.click();
    });

    // DRAG OVER
    uploadZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadZone.classList.add("drag-over");
    });

    // DRAG LEAVE
    uploadZone.addEventListener("dragleave", () => {
        uploadZone.classList.remove("drag-over");
    });

    // DROP FILE            
    uploadZone.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) {
            assignFile(file);
        }
    });

    // INPUT CHANGE
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file) {
            updatePreview(file);
        }
    });

    // ASSIGN FILE
    function assignFile(file) {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInput.files = transfer.files;
        updatePreview(file);
    }

    // UPDATE PREVIEW
    function updatePreview(file) {
        if (!file) return;
        // Validasi image
        if (!file.type.startsWith("image/")) {
            alert("File harus berupa gambar.");
            return;
        }

        // Validasi ukuran maksimal 16MB
        const maxSize = 16 * 1024 * 1024;
        if (file.size > maxSize) {
            alert("Ukuran gambar maksimal 16MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImage) {
                previewImage.src = e.target.result;
            }
            if (previewName) {
                previewName.textContent =
                    `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
            }
            if (previewWrapper) {
                previewWrapper.classList.remove("hidden");
            }
        };
        reader.readAsDataURL(file);
    }

    // RESET FILE
    resetButton?.addEventListener("click", () => {
        fileInput.value = "";
        if (previewWrapper) {
            previewWrapper.classList.add("hidden");
        }
        if (previewImage) {
            previewImage.src = "";
        }
        if (previewName) {
            previewName.textContent = "";
        }
        if (loadingBox) {
            loadingBox.classList.add("hidden");
        }
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.style.opacity = "1";
        }
    });

    // FORM SUBMIT
    form.addEventListener("submit", (e) => {
        const file = fileInput.files[0];
        if (!file) {
            e.preventDefault();
            alert("Silakan upload gambar terlebih dahulu.");
            return;
        }

        // Disable button agar tidak double submit
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.style.opacity = "0.6";
            submitButton.innerText = "Sedang Menganalisis...";
        }
        // Show loading
        if (loadingBox) {
            loadingBox.classList.remove("hidden");
        }
    });
});