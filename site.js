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

const scrollProgress = document.querySelector(".scroll-progress");
let scrollFrame = 0;

function renderScrollProgress() {
  scrollFrame = 0;
  const root = document.documentElement;
  const distance = root.scrollHeight - root.clientHeight;
  const fraction = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
  scrollProgress.style.transform = "scaleX(" + fraction + ")";
}

function updateScrollProgress() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollProgress);
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress, { passive: true });
if ("ResizeObserver" in window) new ResizeObserver(updateScrollProgress).observe(document.body);
renderScrollProgress();

const spotlightMedia = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const spotlightSelector = ".hero-model, .image-link, .button-primary";
let spotlightTarget = null;
let spotlightFrame = 0;
let spotlightX = 0;
let spotlightY = 0;

function clearSpotlight() {
  if (spotlightFrame) cancelAnimationFrame(spotlightFrame);
  spotlightFrame = 0;
  spotlightTarget?.classList.remove("has-spotlight");
  spotlightTarget = null;
}

document.addEventListener("pointermove", event => {
  if (!spotlightMedia.matches || event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
  const target = event.target.closest(spotlightSelector);
  if (!target) { clearSpotlight(); return; }
  if (target !== spotlightTarget) {
    clearSpotlight();
    spotlightTarget = target;
  }
  spotlightX = event.clientX;
  spotlightY = event.clientY;
  if (spotlightFrame) return;
  spotlightFrame = requestAnimationFrame(() => {
    spotlightFrame = 0;
    if (!spotlightTarget) return;
    const rect = spotlightTarget.getBoundingClientRect();
    spotlightTarget.style.setProperty("--spotlight-x", (spotlightX - rect.left) + "px");
    spotlightTarget.style.setProperty("--spotlight-y", (spotlightY - rect.top) + "px");
    spotlightTarget.classList.add("has-spotlight");
  });
}, { passive: true });

document.documentElement.addEventListener("pointerleave", clearSpotlight);
window.addEventListener("blur", clearSpotlight);
window.addEventListener("scroll", clearSpotlight, { passive: true });
spotlightMedia.addEventListener("change", clearSpotlight);
