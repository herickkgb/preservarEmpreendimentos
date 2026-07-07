const ADMIN_CONFIG = {
  storageKey: "preservar-enterprises",
};

const form = document.querySelector("#enterpriseForm");
const adminList = document.querySelector("#adminList");
const imageInput = form.elements.imageFiles;
const previewGrid = document.querySelector("#imagePreview .preview-grid");
const clearButton = document.querySelector("#clearForm");
const resetButton = document.querySelector("#resetData");

let currentImages = ["assets/hero-terrenos-baldim.png"];

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function loadEnterprises() {
  const stored = localStorage.getItem(ADMIN_CONFIG.storageKey);

  if (!stored) {
    return window.PRESERVAR_DEFAULT_ENTERPRISES || [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return window.PRESERVAR_DEFAULT_ENTERPRISES || [];
  }
}

function saveEnterprises(enterprises) {
  try {
    localStorage.setItem(ADMIN_CONFIG.storageKey, JSON.stringify(enterprises));
    return true;
  } catch (error) {
    alert(
      "Não foi possível salvar. As fotos parecem estar muito pesadas para esta versão demonstrativa. Tente enviar menos fotos ou imagens menores."
    );
    return false;
  }
}

function resetForm() {
  form.reset();
  form.elements.id.value = "";
  currentImages = ["assets/hero-terrenos-baldim.png"];
  renderPreview();
}

function fillForm(enterprise) {
  form.elements.id.value = enterprise.id;
  form.elements.name.value = enterprise.name;
  form.elements.location.value = enterprise.location;
  form.elements.price.value = enterprise.price;
  form.elements.size.value = enterprise.size;
  form.elements.status.value = enterprise.status;
  form.elements.details.value = enterprise.details;
  form.elements.bullets.value = (enterprise.bullets || []).join("\n");
  form.elements.mapUrl.value = enterprise.mapUrl || "";
  currentImages = enterprise.images?.length ? enterprise.images : [enterprise.image || "assets/hero-terrenos-baldim.png"];
  renderPreview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAdminList() {
  const enterprises = loadEnterprises();

  if (!enterprises.length) {
    adminList.innerHTML = `<p class="empty-state">Nenhum empreendimento cadastrado.</p>`;
    return;
  }

  adminList.innerHTML = enterprises
    .map(
      (enterprise) => `
        <article class="admin-item">
          <img src="${enterprise.image || enterprise.images?.[0]}" alt="${enterprise.name}" />
          <div>
            <strong>${enterprise.name}</strong>
            <span>${enterprise.location}</span>
            <small>${enterprise.price} - ${enterprise.size}</small>
          </div>
          <div class="admin-item-actions">
            <button class="button button-outline" type="button" data-edit="${enterprise.id}">Editar</button>
            <button class="button button-danger" type="button" data-delete="${enterprise.id}">Excluir</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderPreview() {
  previewGrid.innerHTML = currentImages
    .map((image, index) => `<img src="${image}" alt="Prévia ${index + 1}" />`)
    .join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readImageFile(file) {
  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    image.onerror = async () => {
      URL.revokeObjectURL(objectUrl);
      resolve(await readFileAsDataUrl(file));
    };

    image.src = objectUrl;
  });
}

async function readImageFiles(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return currentImages;
  return Promise.all(fileList.map(readImageFile));
}

imageInput.addEventListener("change", async () => {
  currentImages = await readImageFiles(imageInput.files);
  renderPreview();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const enterprises = loadEnterprises();
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const id = String(formData.get("id") || "").trim() || `${slugify(name)}-${Date.now()}`;
  const images = await readImageFiles(imageInput.files);

  const enterprise = {
    id,
    name,
    location: String(formData.get("location") || "").trim(),
    price: String(formData.get("price") || "").trim(),
    size: String(formData.get("size") || "").trim(),
    status: String(formData.get("status") || "").trim(),
    details: String(formData.get("details") || "").trim(),
    bullets: String(formData.get("bullets") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    mapUrl: String(formData.get("mapUrl") || "").trim(),
    image: images[0],
    images,
  };

  const index = enterprises.findIndex((item) => item.id === id);

  if (index >= 0) {
    enterprises[index] = enterprise;
  } else {
    enterprises.unshift(enterprise);
  }

  if (!saveEnterprises(enterprises)) return;
  resetForm();
  renderAdminList();
});

adminList.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const editId = editButton?.dataset.edit;
  const deleteId = deleteButton?.dataset.delete;
  const enterprises = loadEnterprises();

  if (editId) {
    const enterprise = enterprises.find((item) => item.id === editId);
    if (enterprise) fillForm(enterprise);
  }

  if (deleteId) {
    const nextEnterprises = enterprises.filter((item) => item.id !== deleteId);
    if (!saveEnterprises(nextEnterprises)) return;
    renderAdminList();
    resetForm();
  }
});

clearButton.addEventListener("click", resetForm);

resetButton.addEventListener("click", () => {
  if (!saveEnterprises(window.PRESERVAR_DEFAULT_ENTERPRISES || [])) return;
  resetForm();
  renderAdminList();
});

renderAdminList();
renderPreview();
