const dialog = document.querySelector("#quote");
const form = document.querySelector("#quote-form");
const modelField = form.elements.namedItem("model");
const nameField = form.elements.namedItem("name");
const feedback = form.querySelector(".form-status");
const articleNumbers = new Map([["SEM-200", "SEM200"]]);

document.querySelectorAll("[data-quote]").forEach(button => {
  button.addEventListener("click", () => {
    modelField.value = button.dataset.quote;
    feedback.textContent = "";
    dialog.showModal();
    (modelField.value ? nameField : modelField).focus();
  });
});

dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());

form.addEventListener("submit", event => {
  event.preventDefault();
  const fields = new FormData(form);
  const model = fields.get("model");
  const article = articleNumbers.get(model);
  const draft = [
    "Запрос коммерческого предложения на " + model,
    ...(article ? ["Артикул " + article] : []),
    "",
    "Имя: " + fields.get("name").trim(),
    "Организация: " + fields.get("company").trim(),
    "Электронная почта: " + fields.get("email").trim(),
    "",
    "Задача исследования:",
    fields.get("message").trim(),
    "",
    "Просьба уточнить цену, доступную комплектацию и сроки поставки."
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob(["\uFEFF", draft], { type: "text/plain;charset=utf-8" }));
  const download = document.createElement("a");
  download.href = url;
  download.download = "Запрос-КП-" + model + ".txt";
  document.body.append(download);
  download.click();
  download.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = "Запрос подготовлен. Проверьте загрузки браузера.";
});

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("reveal-in");
      reveal.unobserve(entry.target);
    }
  }, { threshold: 0.12 });

  document.querySelectorAll("[data-reveal]").forEach(element => reveal.observe(element));
}
