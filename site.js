function mountConceptPreview() {
  const concept = new URLSearchParams(window.location.search).get("concept");
  const template = document.getElementById("concept-hero-" + concept);
  if (!(template instanceof HTMLTemplateElement)) return;

  document.documentElement.dataset.concept = concept;
  document.querySelector(".hero").replaceWith(template.content.cloneNode(true));
  const navigation = document.getElementById("concept-preview-navigation").content.cloneNode(true);
  const currentLink = [...navigation.querySelectorAll("a")].find(link => link.getAttribute("href") === "?concept=" + concept);
  currentLink.setAttribute("aria-current", "page");
  document.querySelector(".site-header").before(navigation);

  if (concept === "pilot") {
    const process = document.querySelector("#process");
    const steps = process.querySelector(".process-grid");
    const flow = document.getElementById("concept-story-flow").content.firstElementChild.cloneNode(true);
    steps.before(flow);
    flow.append(steps);
    document.querySelector("#catalog").before(process);
  }
}

mountConceptPreview();

const dialog = document.querySelector("#quote");
const form = document.querySelector("#quote-form");
const modelField = form.elements.namedItem("model");
const nameField = form.elements.namedItem("name");
const emailField = form.elements.namedItem("email");
const title = dialog.querySelector("h2");
const submitButton = form.querySelector("[type=submit]");
const copyButton = form.querySelector("[data-copy]");
const quoteFields = form.querySelector("fieldset");
const feedback = form.querySelector(".form-status");
const fallback = form.querySelector(".copy-fallback");
const recipient = "info@amicro.ru";
const endpoint = form.getAttribute("action");
let topic = "Вопрос о микроскопах";

if (endpoint) {
  emailField.closest("label").hidden = false;
  emailField.disabled = false;
  emailField.required = true;
  submitButton.textContent = "Отправить запрос";
  copyButton.hidden = true;
}

document.querySelectorAll("[data-quote]").forEach(button => {
  button.addEventListener("click", () => {
    if (!quoteFields.disabled) {
      const pilot = button.hasAttribute("data-pilot");
      title.textContent = pilot ? "Пилотное партнёрство" : "Обсудить проект";
      topic = pilot ? "Пилотное партнёрство" : "Вопрос о микроскопах";
      modelField.value = button.dataset.quote;
      feedback.textContent = "";
      fallback.hidden = true;
      copyButton.hidden = Boolean(endpoint);
    }
    dialog.showModal();
    (modelField.value ? nameField : modelField).focus();
  });
});

document.querySelectorAll("dialog").forEach(panel => {
  panel.querySelector(".dialog-close").addEventListener("click", () => panel.close());
});

function readDraft(fields = new FormData(form)) {
  const model = fields.get("model");
  const subject = topic + " — " + model;
  const organization = fields.get("company").trim();
  const email = fields.get("email");
  const body = [
    "Здравствуйте!",
    "",
    "Меня интересует проект: " + model,
    "Имя: " + fields.get("name").trim(),
    ...(organization ? ["Организация: " + organization] : []),
    ...(email ? ["Почта для ответа: " + email] : []),
    "",
    "Задача исследования:",
    fields.get("message").trim()
  ].join("\r\n");
  return { subject, body };
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (quoteFields.disabled) return;
  const fields = new FormData(form);
  const { subject, body } = readDraft(fields);
  if (!endpoint) {
    window.location.href = "mailto:" + recipient + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return;
  }

  fields.set("subject", subject);
  fields.set("topic", topic);
  quoteFields.disabled = true;
  copyButton.hidden = true;
  submitButton.textContent = "Отправляем…";
  feedback.textContent = "";
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: fields,
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) throw new Error("Form submission failed");
    form.reset();
    fallback.hidden = true;
    feedback.textContent = "Заявка отправлена. Ответим на указанную почту.";
  } catch {
    copyButton.hidden = false;
    feedback.textContent = "Не удалось подтвердить отправку. Можно повторить или скопировать текст и написать нам на почту.";
  } finally {
    quoteFields.disabled = false;
    submitButton.textContent = "Отправить запрос";
  }
});

copyButton.addEventListener("click", async () => {
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

function createStoryProgress() {
  const flow = document.querySelector(".story-flow");
  if (!flow) return null;

  const steps = [...flow.querySelectorAll(".process-grid li")];
  const stepName = flow.querySelector("[data-story-step-name]");
  const stepCounter = flow.querySelector("[data-story-step-counter]");
  const meter = flow.querySelector(".story-meter > span");
  let current = -1;

  return () => {
    const activationLine = window.innerHeight * .48;
    let step = 0;
    for (let index = 1; index < steps.length; index++) {
      if (steps[index].getBoundingClientRect().top > activationLine) break;
      step = index;
    }
    if (step === current) return;

    if (current >= 0) steps[current].removeAttribute("aria-current");
    steps[step].setAttribute("aria-current", "step");
    stepName.textContent = steps[step].querySelector("h3").textContent;
    stepCounter.textContent = "Этап " + (step + 1) + " из " + steps.length;
    const progress = (step + 1) / steps.length;
    meter.style.transform = "scaleX(" + progress + ")";
    current = step;
  };
}

const scrollProgress = document.querySelector(".scroll-progress");
const updateStoryProgress = createStoryProgress();
let scrollFrame = 0;

function renderScrollProgress() {
  scrollFrame = 0;
  const root = document.documentElement;
  const distance = root.scrollHeight - root.clientHeight;
  const fraction = distance > 0 ? Math.max(0, Math.min(1, window.scrollY / distance)) : 0;
  updateStoryProgress?.();
  scrollProgress.style.transform = "scaleX(" + fraction + ")";
}

function updateScrollProgress() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(renderScrollProgress);
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress, { passive: true });
if ("ResizeObserver" in window) new ResizeObserver(updateScrollProgress).observe(document.body);
renderScrollProgress();

function bindScrollReveals() {
  const preference = matchMedia("(prefers-reduced-motion: no-preference)");
  if (!preference.matches || !("IntersectionObserver" in window)) return;

  const pending = new Set();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) reveal(entry.target);
    }
  });

  function reveal(target) {
    if (!pending.delete(target)) return;
    observer.unobserve(target);
    target.classList.add("has-revealed");
    target.classList.remove("is-reveal-pending");
  }

  requestAnimationFrame(() => {
    if (!preference.matches) return;
    const belowViewport = [...document.querySelectorAll("[data-scroll-reveal]")]
      .filter(target => target.getBoundingClientRect().top > window.innerHeight);
    for (const target of belowViewport) {
      target.classList.add("is-reveal-pending");
      pending.add(target);
      observer.observe(target);
    }
  });

  document.addEventListener("focusin", event => {
    const target = event.target.closest?.(".is-reveal-pending");
    if (target) reveal(target);
  });
  preference.addEventListener("change", () => {
    if (!preference.matches) pending.forEach(reveal);
  });
}

bindScrollReveals();

const spotlightMedia = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const spotlightSelector = ".image-link, .button-primary";
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
