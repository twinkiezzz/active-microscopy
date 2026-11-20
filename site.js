const dialog = document.querySelector("#quote");
const form = document.querySelector("#quote-form");
const modelField = form.elements.namedItem("model");
const nameField = form.elements.namedItem("name");
const feedback = form.querySelector(".form-status");
const fallback = form.querySelector(".copy-fallback");
const recipient = "info@amicro.ru";

document.querySelectorAll("[data-quote]").forEach(button => {
  button.addEventListener("click", () => {
    modelField.value = button.dataset.quote;
    feedback.textContent = "";
    fallback.hidden = true;
    dialog.showModal();
    (modelField.value ? nameField : modelField).focus();
  });
});

document.querySelectorAll("dialog").forEach(panel => {
  panel.querySelector(".dialog-close").addEventListener("click", () => panel.close());
});

function readDraft() {
  const fields = new FormData(form);
  const model = fields.get("model");
  const subject = "Активная микроскопия — " + model;
  const organization = fields.get("company").trim();
  const body = [
    "Здравствуйте!",
    "",
    "Меня интересует проект: " + model,
    "Имя: " + fields.get("name").trim(),
    ...(organization ? ["Организация: " + organization] : []),
    "",
    "Задача исследования:",
    fields.get("message").trim()
  ].join("\r\n");
  return { subject, body };
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const { subject, body } = readDraft();
  window.location.href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
});

form.querySelector("[data-copy]").addEventListener("click", async () => {
  if (!form.reportValidity()) return;
  const { subject, body } = readDraft();
  const text = "Кому: " + recipient + "\nТема: " + subject + "\n\n" + body;
  try {
    await navigator.clipboard.writeText(text);
    fallback.hidden = true;
    feedback.textContent = "Текст письма скопирован.";
  } catch {
    fallback.hidden = false;
    const output = fallback.querySelector("textarea");
    output.value = text;
    output.select();
    feedback.textContent = "Скопируйте выделенный текст.";
  }
});

document.querySelectorAll("[data-open-details]").forEach(link => {
  link.addEventListener("click", () => {
    const details = document.querySelector(link.hash + " details");
    if (details) details.open = true;
  });
});

const viewer = document.querySelector("#viewer");
const viewerTitle = viewer.querySelector("h2");
const viewerImage = viewer.querySelector("img");
const zoom = viewer.querySelector("[data-zoom]");
const viewport = viewer.querySelector(".image-viewport");
document.querySelectorAll("[data-view]").forEach(link => {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const image = link.querySelector("img");
    viewerTitle.textContent = image.alt;
    viewerImage.alt = image.alt;
    viewerImage.src = link.href;
    viewport.classList.remove("is-zoomed");
    zoom.setAttribute("aria-pressed", "false");
    zoom.textContent = "Увеличить";
    viewer.showModal();
  });
});
zoom.addEventListener("click", () => {
  const enlarged = viewport.classList.toggle("is-zoomed");
  zoom.setAttribute("aria-pressed", String(enlarged));
  zoom.textContent = enlarged ? "Уменьшить" : "Увеличить";
  if (!enlarged) viewport.scrollTo(0, 0);
});

const cursorGlow = document.querySelector(".cursor-glow");
const glowMotion = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
let glowFrame = 0;
let glowX = 0;
let glowY = 0;

function hideGlow() {
  if (glowFrame) cancelAnimationFrame(glowFrame);
  glowFrame = 0;
  cursorGlow.classList.remove("is-visible");
}

function moveGlow(event) {
  if (event.pointerType !== "mouse") return;
  glowX = event.clientX;
  glowY = event.clientY;
  if (glowFrame) return;
  glowFrame = requestAnimationFrame(() => {
    glowFrame = 0;
    cursorGlow.style.setProperty("--glow-x", (glowX / window.innerWidth * 100) + "%");
    cursorGlow.style.setProperty("--glow-y", (glowY / window.innerHeight * 100) + "%");
    cursorGlow.classList.add("is-visible");
  });
}

function updateGlow() {
  if (glowMotion.matches) {
    document.addEventListener("pointermove", moveGlow, { passive: true });
    document.documentElement.addEventListener("pointerleave", hideGlow);
    window.addEventListener("blur", hideGlow);
  } else {
    document.removeEventListener("pointermove", moveGlow);
    document.documentElement.removeEventListener("pointerleave", hideGlow);
    window.removeEventListener("blur", hideGlow);
    hideGlow();
  }
}

glowMotion.addEventListener("change", updateGlow);
updateGlow();
