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

document.querySelectorAll("[data-quote]").forEach(link => {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
    event.preventDefault();
    if (!quoteFields.disabled) {
      const pilot = link.hasAttribute("data-pilot");
      title.textContent = pilot ? "Пилотное партнёрство" : "Обсудить проект";
      topic = pilot ? "Пилотное партнёрство" : "Вопрос о микроскопах";
      modelField.value = link.dataset.quote;
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

const modes = document.querySelector("#modes details");
function openLinkedModes() {
  if (location.hash === "#modes") modes.open = true;
}
document.querySelector("[data-open-details]").addEventListener("click", () => { modes.open = true; });
window.addEventListener("hashchange", openLinkedModes);
openLinkedModes();

const viewer = document.querySelector("#viewer");
const viewerTitle = viewer.querySelector("h2");
const viewerImage = viewer.querySelector("img");
const zoom = viewer.querySelector("[data-zoom]");
const viewport = viewer.querySelector(".image-viewport");
document.querySelectorAll("[data-view]").forEach(link => {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !viewer.showModal) return;
    event.preventDefault();
    const image = link.querySelector("img");
    viewerTitle.textContent = image.alt;
    viewerImage.alt = image.alt;
    viewerImage.src = link.href;
    viewport.classList.remove("is-zoomed");
    zoom.setAttribute("aria-pressed", "false");
    zoom.textContent = "Увеличить";
    viewer.showModal();
    viewport.scrollTo(0, 0);
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
