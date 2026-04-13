let members = [];
let currentMember = 0;
let currentCarouselPage = 0;
let currentRecruitmentForm = null;
let currentRecruitmentFields = [];

const memberName = document.getElementById("memberName");
const memberRole = document.getElementById("memberRole");
const memberMeta = document.getElementById("memberMeta");
const memberTags = document.getElementById("memberTags");
const memberStats = document.getElementById("memberStats");
const memberGlow = document.getElementById("memberGlow");
const memberAccent = document.getElementById("memberAccent");
const memberSigil = document.getElementById("memberSigil");
const memberSilhouette = document.getElementById("memberSilhouette");
const memberImage = document.getElementById("memberImage");
const memberCloak = document.getElementById("memberCloak");
const memberWeapon = document.getElementById("memberWeapon");

const membersTrack = document.getElementById("membersTrack");
const prevMembersBtn = document.getElementById("prevMembers");
const nextMembersBtn = document.getElementById("nextMembers");

const memberMainPanel = document.getElementById("memberMainPanel");
const cinemaTransition = document.getElementById("cinemaTransition");

const loreModal = document.getElementById("loreModal");
const formModal = document.getElementById("formModal");
const toast = document.getElementById("toast");
const recruitForm = document.getElementById("recruitForm");
const dynamicFormTitle = document.getElementById("dynamicFormTitle");
const dynamicFormDescription = document.getElementById("dynamicFormDescription");
const dynamicFormMessage = document.getElementById("dynamicFormMessage");

const detailsButton = document.querySelector(".discord-btn");

function getAccentStyles(accent) {
  const normalized = String(accent || "").toLowerCase();

  const map = {
    cyan: {
      glow: "radial-gradient(circle at center, rgba(168,85,247,.26), rgba(125,211,252,.12), transparent 72%)",
      accent: "linear-gradient(180deg, rgba(34,211,238,.90), rgba(59,130,246,.55))"
    },
    gold: {
      glow: "radial-gradient(circle at center, rgba(250,204,21,.20), rgba(168,85,247,.16), transparent 72%)",
      accent: "linear-gradient(180deg, rgba(250,204,21,.72), rgba(168,85,247,.3))"
    },
    pink: {
      glow: "radial-gradient(circle at center, rgba(244,114,182,.24), rgba(192,132,252,.14), transparent 72%)",
      accent: "linear-gradient(180deg, rgba(244,114,182,.72), rgba(192,132,252,.3))"
    },
    purple: {
      glow: "radial-gradient(circle at center, rgba(168,85,247,.30), rgba(216,180,254,.12), transparent 72%)",
      accent: "linear-gradient(180deg, rgba(192,132,252,.82), rgba(124,58,237,.35))"
    }
  };

  if (map[normalized]) return map[normalized];

  if (normalized.startsWith("#")) {
    return {
      glow: `radial-gradient(circle at center, ${normalized}55, rgba(216,180,254,.12), transparent 72%)`,
      accent: `linear-gradient(180deg, ${normalized}, rgba(124,58,237,.35))`
    };
  }

  return map.purple;
}

function getSigil(symbol) {
  const normalized = String(symbol || "").toLowerCase();

  const map = {
    spade: "♠",
    star: "✦",
    moon: "☾",
    diamond: "◆",
    crown: "♛"
  };

  if (String(symbol || "").trim().length <= 2 && !map[normalized]) {
    return String(symbol || "✦");
  }

  return map[normalized] || "✦";
}

function getSilhouetteGradient(shape) {
  const normalized = String(shape || "").toLowerCase();

  const map = {
    cyan: "linear-gradient(180deg, rgba(245,221,255,.90), rgba(173,216,255,.95))",
    gold: "linear-gradient(180deg, rgba(255,245,200,.92), rgba(250,204,21,.55))",
    pink: "linear-gradient(180deg, rgba(255,228,240,.92), rgba(244,114,182,.55))",
    purple: "linear-gradient(180deg, rgba(255,245,255,.92), rgba(192,132,252,.55))"
  };

  if (map[normalized]) return map[normalized];

  if (normalized.startsWith("#")) {
    return `linear-gradient(180deg, rgba(255,245,255,.92), ${normalized})`;
  }

  return map.purple;
}

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function cinematicFlash() {
  if (!cinemaTransition) return;

  cinemaTransition.classList.add("active");
  setTimeout(() => {
    cinemaTransition.classList.remove("active");
  }, 550);
}

function hasMemberImage(member) {
  return Boolean(member.image && String(member.image).trim() !== "");
}

function buildMemberMeta(member) {
  const parts = [];

  if (member.age) parts.push(`${member.age} anos`);
  if (member.meta) parts.push(member.meta);

  return parts.join(" • ");
}

function setMember(index) {
  if (!members.length) return;

  currentMember = (index + members.length) % members.length;
  const member = members[currentMember];
  const styles = getAccentStyles(member.accent);

  if (memberMainPanel) {
    memberMainPanel.classList.remove("is-changing");
    void memberMainPanel.offsetWidth;
    memberMainPanel.classList.add("is-changing");
  }

  if (memberName) memberName.textContent = member.name || "Sem nome";
  if (memberRole) memberRole.textContent = member.role || "Sem cargo";
  if (memberMeta) memberMeta.textContent = buildMemberMeta(member);

  if (memberTags) {
    memberTags.innerHTML = (member.tags || [])
      .map(tag => `<span>${tag}</span>`)
      .join("");
  }

  if (memberStats) {
    memberStats.innerHTML = (member.stats || [])
      .map(stat => `<span><strong>${stat.value}</strong> ${stat.label}</span>`)
      .join("");
  }

  if (memberGlow) memberGlow.style.background = styles.glow;
  if (memberAccent) memberAccent.style.background = styles.accent;
  if (memberSigil) memberSigil.innerHTML = `<span>${getSigil(member.symbol)}</span>`;
  if (memberSilhouette) memberSilhouette.style.background = getSilhouetteGradient(member.accent);

  if (hasMemberImage(member)) {
    if (memberImage) {
      memberImage.src = member.image;
      memberImage.alt = member.name || "Imagem do membro";
      memberImage.classList.remove("hidden");
    }

    memberSigil?.classList.add("hidden");
    memberSilhouette?.classList.add("hidden");
    memberCloak?.classList.add("hidden");
    memberWeapon?.classList.add("hidden");
  } else {
    if (memberImage) {
      memberImage.src = "";
      memberImage.alt = "";
      memberImage.classList.add("hidden");
    }

    memberSigil?.classList.remove("hidden");
    memberSilhouette?.classList.remove("hidden");
    memberCloak?.classList.remove("hidden");
    memberWeapon?.classList.remove("hidden");
  }

  updateActiveCard();
  centerActiveCard();
}

function updateActiveCard() {
  if (!membersTrack) return;

  const cards = membersTrack.querySelectorAll(".member-card");
  cards.forEach((card, index) => {
    card.classList.toggle("active", index === currentMember);
  });
}

function renderMemberCards() {
  if (!membersTrack) return;

  membersTrack.innerHTML = "";

  members.forEach((member, index) => {
    const card = document.createElement("div");
    card.className = "member-card";
    card.dataset.index = index;

    const useImage = hasMemberImage(member);

    card.innerHTML = `
      <div class="member-card-clickable" role="button" tabindex="0">
        <div class="member-card-image">
          ${
            useImage
              ? `<img class="member-card-photo" src="${member.image}" alt="${member.name}">`
              : `<div class="card-sigil"><span>${getSigil(member.symbol)}</span></div>`
          }
        </div>

        <div class="member-card-footer">
          <div class="member-card-name">${member.name}</div>

          <div class="member-card-actions">
            <button class="member-card-page" type="button">Ver perfil</button>
          </div>
        </div>
      </div>
    `;

    const clickableArea = card.querySelector(".member-card-clickable");
    const pageBtn = card.querySelector(".member-card-page");

    clickableArea?.addEventListener("click", () => {
      cinematicFlash();
      setMember(index);
    });

    clickableArea?.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        cinematicFlash();
        setMember(index);
      }
    });

    pageBtn?.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!member?.id) {
        showToast("Membro inválido.");
        return;
      }

      window.location.href = `/membro/${member.id}`;
    });

    membersTrack.appendChild(card);
  });

  updateActiveCard();
}

function getCardWidth() {
  if (!membersTrack) return 0;

  const firstCard = membersTrack.querySelector(".member-card");
  if (!firstCard) return 0;

  const gap = 16;
  return firstCard.offsetWidth + gap;
}

function getVisibleCards() {
  const viewport = document.querySelector(".carousel-viewport");
  const cardWidth = getCardWidth();

  if (!viewport || !cardWidth) return 1;

  return Math.max(1, Math.floor(viewport.offsetWidth / cardWidth));
}

function updateCarousel() {
  if (!membersTrack) return;

  const cardWidth = getCardWidth();
  const visibleCards = getVisibleCards();

  const maxPage = Math.max(0, members.length - visibleCards);
  currentCarouselPage = Math.min(currentCarouselPage, maxPage);

  const offset = currentCarouselPage * cardWidth;
  membersTrack.style.transform = `translateX(-${offset}px)`;
}

function centerActiveCard() {
  const visibleCards = getVisibleCards();
  const targetPage = Math.max(0, currentMember - Math.floor(visibleCards / 2));
  currentCarouselPage = targetPage;
  updateCarousel();
}

function openModal(modal) {
  if (modal) modal.classList.add("open");
}

function closeModal(modal) {
  if (modal) modal.classList.remove("open");
}
function renderDynamicRecruitmentForm(form) {
  if (!recruitForm || !dynamicFormTitle || !dynamicFormDescription) return;

  currentRecruitmentForm = form;
  currentRecruitmentFields = Array.isArray(form?.campos) ? form.campos : [];

  dynamicFormTitle.textContent = form?.titulo || "Formulário de Recrutamento";
  dynamicFormDescription.textContent =
    form?.descricao || "Preencha suas informações.";

  recruitForm.innerHTML = "";

  currentRecruitmentFields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = `recruit-field${field.fullWidth ? " full" : ""}`;

    const label = document.createElement("label");
    label.className = "recruit-label";
    label.textContent = field.label || field.id || "Pergunta";
    wrapper.appendChild(label);

    const type = field.type || "text";
    const required = !!field.required;
    const placeholder = field.placeholder || field.label || "";
    const fieldName = field.id || `campo_${Date.now()}`;

    if (type === "textarea") {
      const textarea = document.createElement("textarea");
      textarea.name = fieldName;
      textarea.placeholder = placeholder;
      textarea.required = required;
      textarea.rows = 4;
      wrapper.appendChild(textarea);
    } else if (type === "select") {
      const select = document.createElement("select");
      select.name = fieldName;
      select.required = required;

      const firstOption = document.createElement("option");
      firstOption.value = "";
      firstOption.textContent = placeholder || "Selecione uma opção";
      firstOption.disabled = true;
      firstOption.selected = true;
      select.appendChild(firstOption);

      (field.options || []).forEach((optionValue) => {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        select.appendChild(option);
      });

      wrapper.appendChild(select);
    } else if (type === "radio") {
      const optionsWrap = document.createElement("div");
      optionsWrap.className = "recruit-options";

      (field.options || []).forEach((optionValue, index) => {
        const optionLabel = document.createElement("label");
        optionLabel.className = "recruit-option";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = fieldName;
        input.value = optionValue;
        input.required = required && index === 0;

        const text = document.createElement("span");
        text.textContent = optionValue;

        optionLabel.appendChild(input);
        optionLabel.appendChild(text);
        optionsWrap.appendChild(optionLabel);
      });

      wrapper.appendChild(optionsWrap);
    } else {
      const input = document.createElement("input");
      input.type = type;
      input.name = fieldName;
      input.placeholder = placeholder;
      input.required = required;
      wrapper.appendChild(input);
    }

    recruitForm.appendChild(wrapper);
  });

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "submit-btn";
  submitButton.textContent = "Enviar candidatura";

  recruitForm.appendChild(submitButton);
}

async function loadDynamicRecruitmentForm() {
  if (!dynamicFormTitle || !dynamicFormDescription || !recruitForm) return;

  dynamicFormTitle.textContent = "Carregando formulário...";
  dynamicFormDescription.textContent = "Aguarde...";
  recruitForm.innerHTML = "";
  if (dynamicFormMessage) dynamicFormMessage.textContent = "";

  try {
    const response = await fetch("/api/recruitment/form", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data) {
      dynamicFormTitle.textContent = "Formulário indisponível";
      dynamicFormDescription.textContent =
        data?.error || "Não foi possível carregar o formulário.";
      return;
    }

    renderDynamicRecruitmentForm(data);
  } catch (error) {
    console.error(error);
    dynamicFormTitle.textContent = "Erro ao carregar";
    dynamicFormDescription.textContent =
      "Não foi possível carregar o formulário agora.";
  }
}

async function submitDynamicRecruitmentForm(event) {
  event.preventDefault();

  if (!recruitForm) return;

  const submitButton = recruitForm.querySelector(".submit-btn");
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";
  }

  if (dynamicFormMessage) {
    dynamicFormMessage.textContent = "";
  }

  try {
   const respostas = {};

currentRecruitmentFields.forEach((field) => {
  const fieldName = field.id;

  if (field.type === "radio") {
    const checked = recruitForm.querySelector(`input[name="${fieldName}"]:checked`);
    respostas[fieldName] = checked ? checked.value : "";
    return;
  }

  const input = recruitForm.elements[fieldName];
  respostas[fieldName] = input ? input.value : "";
});
    const response = await fetch("/api/recruitment/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ respostas }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (dynamicFormMessage) {
        dynamicFormMessage.textContent = data?.error || "Erro ao enviar formulário.";
      }
      return;
    }

    recruitForm.reset();

    if (dynamicFormMessage) {
      dynamicFormMessage.textContent = "Candidatura enviada com sucesso.";
    }

    showToast("Formulário enviado com sucesso.");
    closeModal(formModal);
  } catch (error) {
    console.error(error);
    if (dynamicFormMessage) {
      dynamicFormMessage.textContent = "Erro inesperado ao enviar formulário.";
    }
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar candidatura";
    }
  }
}

function splitTags(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split("|")
    .map(item => item.trim())
    .filter(Boolean);
}

function splitStats(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .split("|")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [labelPart, valuePart] = item.split(":");
      return {
        label: (labelPart || "").trim(),
        value: (valuePart || "").trim()
      };
    });
}

function normalizeAccent(value) {
  if (!value) return "purple";

  const normalized = String(value).trim().toLowerCase();

  if (
    normalized === "cyan" ||
    normalized === "gold" ||
    normalized === "pink" ||
    normalized === "purple"
  ) {
    return normalized;
  }

  if (normalized.startsWith("#")) return normalized;

  return "purple";
}

function renderMemberDetailsModal(member) {
  if (!loreModal) return;

  const role = String(member.role || "membro").toLowerCase().trim();

  const roleMap = {
    lider: { label: "Líder", className: "role-lider" },
    vice_lider: { label: "Vice-líder", className: "role-vice" },
    veterano: { label: "Veterano", className: "role-veterano" },
    membro: { label: "Membro", className: "role-membro" }
  };

  const roleData = roleMap[role] || roleMap.membro;

  const tagsHtml = (member.tags || []).length
    ? member.tags
        .map(
          (tag) => `
            <span class="member-modal-tag">${tag}</span>
          `
        )
        .join("")
    : `<span class="member-modal-empty">Sem tags</span>`;

  const statsHtml = (member.stats || []).length
    ? member.stats
        .map(
          (stat) => `
            <div class="member-modal-stat">
              <span class="member-modal-stat-value">${stat.value || "-"}</span>
              <span class="member-modal-stat-label">${stat.label || "Sem título"}</span>
            </div>
          `
        )
        .join("")
    : `<span class="member-modal-empty">Sem estatísticas</span>`;

  const imageHtml = hasMemberImage(member)
    ? `
      <div class="member-modal-image-wrap">
        <img src="${member.image}" alt="${member.name}" class="member-modal-image" />
        <div class="member-modal-image-overlay"></div>
      </div>
    `
    : `
      <div class="member-modal-image-wrap member-modal-image-fallback">
        <div class="member-modal-sigil">${getSigil(member.symbol)}</div>
      </div>
    `;

  loreModal.innerHTML = `
    <div class="modal-content member-modal-content member-modal-luxury ${roleData.className}">
      <button class="close-modal" data-close="loreModal">×</button>

      <div class="member-modal-shell">
        <div class="member-modal-side-ornament">
          <div class="member-modal-side-line"></div>
          <div class="member-modal-side-symbol">${getSigil(member.symbol)}</div>
          <div class="member-modal-side-line"></div>
        </div>

        <div class="member-modal-main-wrap">
          <div class="member-modal-top">
            <div class="member-modal-heading">
              <p class="member-modal-kicker">Arquivo de Membro</p>
              <h3 class="member-modal-name">${member.name}</h3>

              <div class="member-modal-meta-row">
                <span class="member-modal-role-badge ${roleData.className}">
                  ${roleData.label}
                </span>
                <span class="member-modal-age">
                  ${member.age ? member.age + " anos" : "Idade não informada"}
                </span>
              </div>

              <div class="member-modal-summary">
                <strong>Meta:</strong> ${member.meta || "Sem meta informada."}
              </div>
            </div>

            <div class="member-modal-top-image">
              ${imageHtml}
            </div>
          </div>

          <div class="member-modal-grid">
            <div class="member-modal-main">
              <section class="member-modal-section">
                <h4>Personalidade</h4>
                <p>${member.personality || "Não informado."}</p>
              </section>

              <section class="member-modal-section">
                <h4>Hábitos</h4>
                <p>${member.habits || "Não informado."}</p>
              </section>

              <section class="member-modal-section">
                <h4>Gostos</h4>
                <p>${member.likes || "Não informado."}</p>
              </section>

              <section class="member-modal-section">
                <h4>Hobbies</h4>
                <p>${member.hobbies || "Não informado."}</p>
              </section>
            </div>

            <aside class="member-modal-side">
              <section class="member-modal-side-card">
                <h4>Tags</h4>
                <div class="member-modal-tags">
                  ${tagsHtml}
                </div>
              </section>

              <section class="member-modal-side-card">
                <h4>Estatísticas</h4>
                <div class="member-modal-stats">
                  ${statsHtml}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  `;

  loreModal.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-close");
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) closeModal(target);
    });
  });

  openModal(loreModal);
}

async function loadMembers() {
  try {
    const response = await fetch("/api/public-members", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Falha ao carregar membros");
    }

    const data = await response.json();

    members = (data || []).map((member) => ({
      id: member.id,
      name: member.nome || "Sem nome",
      age: member.idade ?? null,
      role: member.cargo || "membro",
      meta: member.meta || "",
      personality: member.personalidade || "",
      habits: member.habitos || "",
      likes: member.gostos || "",
      hobbies: member.hobbies || "",
      tags: member.tags
        ? String(member.tags)
            .split("|")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      stats: member.stats
        ? String(member.stats)
            .split("|")
            .map((item) => {
              const [label, value] = item.split(":");
              return {
                label: (label || "").trim(),
                value: (value || "").trim(),
              };
            })
            .filter((item) => item.label || item.value)
        : [],
      symbol: member.sigil || "star",
      image: member.imagem_url || "",
      accent: normalizeAccent(member.accent_color),
      ordem: member.ordem ?? 0,
    }));

    members.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    renderMemberCards();

    if (members.length > 0) {
      currentMember = 0;
      setMember(0);
      updateCarousel();

    } else {
      if (memberName) memberName.textContent = "Nenhum membro encontrado";
      if (memberRole) memberRole.textContent = "";
      if (memberMeta) memberMeta.textContent = "";
    }
  } catch (error) {
    console.error("Erro ao carregar membros:", error);

    if (memberName) memberName.textContent = "Erro ao carregar membros";
    if (memberRole) memberRole.textContent = "";
    if (memberMeta) memberMeta.textContent = "";
  }
}

if (detailsButton) {
  detailsButton.addEventListener("click", () => {
    if (!members.length) {
      showToast("Nenhum membro carregado.");
      return;
    }

    renderMemberDetailsModal(members[currentMember]);
  });
}

if (prevMembersBtn) {
  prevMembersBtn.addEventListener("click", () => {
    cinematicFlash();
    setMember(currentMember - 1);
  });
}

if (nextMembersBtn) {
  nextMembersBtn.addEventListener("click", () => {
    cinematicFlash();
    setMember(currentMember + 1);
  });
}

const goMembersBtn = document.getElementById("goMembers");
if (goMembersBtn) {
  goMembersBtn.addEventListener("click", () => {
    cinematicFlash();
    document.getElementById("members")?.scrollIntoView({ behavior: "smooth" });
  });
}

const openLoreModalBtn = document.getElementById("openLoreModal");
if (openLoreModalBtn && loreModal) {
  openLoreModalBtn.addEventListener("click", () => {
    openModal(loreModal);
  });
}

const openFormModalBtn = document.getElementById("openFormModal");
if (openFormModalBtn && formModal) {
  openFormModalBtn.addEventListener("click", async () => {
    openModal(formModal);
    await loadDynamicRecruitmentForm();
  });
}

document.querySelectorAll("[data-close]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-close");
    const target = targetId ? document.getElementById(targetId) : null;
    if (target) closeModal(target);
  });
});

[loreModal, formModal].forEach((modal) => {
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(loreModal);
    closeModal(formModal);
  }
});

if (recruitForm) {
  recruitForm.addEventListener("submit", submitDynamicRecruitmentForm);
}

window.addEventListener("resize", updateCarousel);

const mouseGlow = document.getElementById("mouseGlow");
if (mouseGlow) {
  window.addEventListener("mousemove", (event) => {
    mouseGlow.style.left = `${event.clientX}px`;
    mouseGlow.style.top = `${event.clientY}px`;
  });
}

const particlesRoot = document.getElementById("particles");
if (particlesRoot) {
  for (let i = 0; i < 26; i++) {
    const particle = document.createElement("span");
    const size = 2 + (i % 4);
    particle.style.left = `${6 + ((i * 9) % 88)}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.animationDuration = `${6 + (i % 7)}s`;
    particle.style.animationDelay = `${(i % 7) * 0.5}s`;
    particlesRoot.appendChild(particle);
  }
}

const bgSlides = document.querySelectorAll(".bg-slide");
let bgIndex = 0;

function cycleMembersBackground() {
  if (!bgSlides.length) return;

  bgSlides.forEach((slide) => slide.classList.remove("active"));
  bgSlides[bgIndex].classList.add("active");
  bgIndex = (bgIndex + 1) % bgSlides.length;
}

cycleMembersBackground();
setInterval(cycleMembersBackground, 4500);

loadMembers();
