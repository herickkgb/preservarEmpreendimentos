const CONFIG = {
  // Substitua pelo WhatsApp da empresa com DDI e DDD, somente números.
  whatsappNumber: "5531999999999",
  storageKey: "preservar-enterprises",
};

const header = document.querySelector("[data-header]");
const leadForm = document.querySelector("#leadForm");
const enterpriseGrid = document.querySelector("#enterpriseGrid");
const enterpriseSelect = document.querySelector("#enterpriseSelect");
const whatsappLinks = document.querySelectorAll("[data-whatsapp-link]");
const modal = document.querySelector("#enterpriseModal");
const modalContent = document.querySelector("#modalContent");
const menuToggle = document.querySelector("[data-menu-toggle]");
const menuCloseButtons = document.querySelectorAll("[data-menu-close]");
const mainNav = document.querySelector("#mainNav");

function setMenuOpen(isOpen) {
  document.body.classList.toggle("menu-open", isOpen);
  menuToggle?.setAttribute("aria-expanded", String(isOpen));
  menuToggle?.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
}

function loadEnterprises() {
  const stored = localStorage.getItem(CONFIG.storageKey);

  if (!stored) {
    return window.PRESERVAR_DEFAULT_ENTERPRISES || [];
  }

  try {
    return JSON.parse(stored);
  } catch {
    return window.PRESERVAR_DEFAULT_ENTERPRISES || [];
  }
}

function buildWhatsappUrl(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function defaultMessage() {
  return "Olá, vi os empreendimentos da Preservar e gostaria de receber informações sobre disponibilidade, valores e formas de pagamento.";
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function enterpriseMessage(enterprise) {
  return [
    "Olá, vi este empreendimento no site da Preservar e gostaria de mais informações.",
    `Nome: ${enterprise.name}`,
    `Localização: ${enterprise.location}`,
    `Valor: ${enterprise.price}`,
    `Tamanho: ${enterprise.size}`,
    "Pode me enviar disponibilidade, formas de pagamento e orientação para visita?",
  ].join("\n");
}

function renderEnterpriseCard(enterprise) {
  const cover = enterprise.image || enterprise.images?.[0] || "assets/hero-terrenos-baldim.png";
  const bullets = enterprise.bullets || [];
  const bulletMarkup = bullets.map((item) => `<li>${item}</li>`).join("");
  const mapButton = enterprise.mapUrl
    ? `<a class="text-link" href="${enterprise.mapUrl}" target="_blank" rel="noopener">Abrir mapa</a>`
    : "";

  return `
    <article class="enterprise-card">
      <button class="enterprise-cover" type="button" data-open-enterprise="${enterprise.id}">
        <img src="${cover}" alt="${enterprise.name}" />
        <span>Ver fotos e detalhes</span>
      </button>
      <div class="enterprise-card-body">
        <p class="enterprise-location">${enterprise.location}</p>
        <h3>${enterprise.name}</h3>
        <div class="enterprise-meta">
          <span>${enterprise.price}</span>
          <span>${enterprise.size}</span>
          <span>${enterprise.status}</span>
        </div>
        <p>${enterprise.details}</p>
        <ul>${bulletMarkup}</ul>
        <div class="enterprise-actions">
          <button class="button button-primary" type="button" data-open-enterprise="${enterprise.id}">Consultar disponibilidade</button>
          ${mapButton}
        </div>
      </div>
    </article>
  `;
}

function renderGallery(images, name) {
  const safeImages = images?.length ? images : ["assets/hero-terrenos-baldim.png"];
  const thumbnails = safeImages
    .map(
      (image, index) => `
        <button class="gallery-thumb ${index === 0 ? "is-active" : ""}" type="button" data-gallery-src="${image}">
          <img src="${image}" alt="${name} - foto ${index + 1}" />
        </button>
      `
    )
    .join("");

  return `
    <div class="modal-gallery">
      <img class="gallery-main" src="${safeImages[0]}" alt="${name}" />
      <div class="gallery-thumbs">${thumbnails}</div>
    </div>
  `;
}

function openEnterpriseModal(enterprise) {
  const bullets = enterprise.bullets || [];
  const bulletMarkup = bullets.map((item) => `<li>${item}</li>`).join("");
  const mapAction = enterprise.mapUrl
    ? `<a class="button button-outline" href="${enterprise.mapUrl}" target="_blank" rel="noopener">Abrir mapa</a>`
    : "";

  modalContent.innerHTML = `
    ${renderGallery(enterprise.images || [enterprise.image], enterprise.name)}
    <div class="modal-details">
      <p class="section-kicker">${enterprise.location}</p>
      <h2 id="modalTitle">${enterprise.name}</h2>
      <div class="modal-summary">
        <div>
          <small>Valor</small>
          <strong>${enterprise.price}</strong>
        </div>
        <div>
          <small>Tamanho</small>
          <strong>${enterprise.size}</strong>
        </div>
        <div>
          <small>Situação</small>
          <strong>${enterprise.status}</strong>
        </div>
      </div>
      <p>${enterprise.details}</p>
      <ul class="modal-bullets">${bulletMarkup}</ul>
      <div class="modal-contact">
        <div class="modal-contact-head">
          <span>Contato direto</span>
          <div>
            <h3>Receba condições e orientação de visita</h3>
            <p>Envie seu contato para falar com a equipe sobre disponibilidade e negociação.</p>
          </div>
        </div>
        <form class="modal-lead-form" data-modal-form>
          <input name="name" type="text" placeholder="Seu nome" required />
          <input name="phone" type="tel" placeholder="Seu WhatsApp" required />
          <textarea name="message" rows="3" placeholder="Ex: quero confirmar disponibilidade e formas de pagamento."></textarea>
          <button class="button button-primary full" type="submit">Consultar pelo WhatsApp</button>
        </form>
        <div class="modal-actions">
          ${mapAction}
        </div>
      </div>
    </div>
  `;

  modal.dataset.enterpriseId = enterprise.id;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal-close").focus();
}

function closeEnterpriseModal() {
  modal.setAttribute("aria-hidden", "true");
  modalContent.innerHTML = "";
  document.body.classList.remove("modal-open");
  delete modal.dataset.enterpriseId;
}

function renderSite() {
  const enterprises = loadEnterprises();

  if (enterpriseGrid) {
    enterpriseGrid.innerHTML = enterprises.length
      ? enterprises.map(renderEnterpriseCard).join("")
      : `<p class="empty-state">Nenhum empreendimento cadastrado ainda. Acesse o painel admin para adicionar.</p>`;
  }

  if (enterpriseSelect) {
    enterpriseSelect.innerHTML = `<option value="">Selecione uma opção</option>`;
    enterprises.forEach((enterprise) => {
      const option = document.createElement("option");
      option.value = enterprise.id;
      option.textContent = enterprise.name;
      enterpriseSelect.appendChild(option);
    });
  }
}

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();
renderSite();

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("menu-open"));
  });
}

menuCloseButtons.forEach((button) => {
  button.addEventListener("click", () => setMenuOpen(false));
});

if (mainNav) {
  mainNav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (link) setMenuOpen(false);
  });
}

if (enterpriseGrid) {
  enterpriseGrid.addEventListener("click", (event) => {
    const opener = event.target.closest("[data-open-enterprise]");
    if (!opener) return;

    const enterprise = loadEnterprises().find((item) => item.id === opener.dataset.openEnterprise);
    if (enterprise) openEnterpriseModal(enterprise);
  });
}

if (modal) {
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) {
      closeEnterpriseModal();
      return;
    }

    const thumb = event.target.closest("[data-gallery-src]");
    if (thumb) {
      const mainImage = modal.querySelector(".gallery-main");
      mainImage.src = thumb.dataset.gallerySrc;
      modal.querySelectorAll(".gallery-thumb").forEach((button) => button.classList.remove("is-active"));
      thumb.classList.add("is-active");
      return;
    }

    const modalForm = event.target.closest("[data-modal-form]");
    if (modalForm && event.type === "click") return;
  });

  modal.addEventListener("submit", (event) => {
    const modalForm = event.target.closest("[data-modal-form]");
    if (!modalForm) return;

    event.preventDefault();
    const enterprise = loadEnterprises().find((item) => item.id === modal.dataset.enterpriseId);
    const data = new FormData(modalForm);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();
    const text = [
      `Olá, meu nome é ${name}.`,
      enterprise ? `Vi o empreendimento ${enterprise.name} no site e tenho interesse.` : "Tenho interesse em um empreendimento da Preservar.",
      enterprise ? `Localização: ${enterprise.location}.` : "",
      enterprise ? `Valor: ${enterprise.price}.` : "",
      enterprise ? `Tamanho: ${enterprise.size}.` : "",
      phone ? `Meu WhatsApp: ${phone}.` : "",
      "Gostaria de receber disponibilidade, formas de pagamento e informações para visita.",
      message ? `Mensagem: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsappUrl(text), "_blank", "noopener");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeEnterpriseModal();
    }

    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      setMenuOpen(false);
    }
  });
}

whatsappLinks.forEach((link) => {
  link.setAttribute("href", buildWhatsappUrl(defaultMessage()));
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener");
});

if (leadForm) {
  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const enterprises = loadEnterprises();
    const data = new FormData(leadForm);
    const selectedId = String(data.get("enterprise") || "");
    const selected = enterprises.find((enterprise) => enterprise.id === selectedId);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const message = String(data.get("message") || "").trim();

    const text = [
      `Olá, meu nome é ${name}.`,
      selected ? `Vi o empreendimento ${selected.name} no site da Preservar e tenho interesse.` : "Tenho interesse nos empreendimentos da Preservar.",
      selected ? `Localização: ${selected.location}.` : "",
      selected ? `Valor: ${selected.price}.` : "",
      selected ? `Tamanho: ${selected.size}.` : "",
      phone ? `Meu WhatsApp: ${phone}.` : "",
      "Gostaria de receber disponibilidade, formas de pagamento e informações para visita.",
      message ? `Mensagem: ${message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(buildWhatsappUrl(text), "_blank", "noopener");
  });
}
