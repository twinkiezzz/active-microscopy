const quote = document.querySelector("#quote");
const form = quote.querySelector("form");
const feedback = quote.querySelector(".feedback");

document.querySelectorAll("[data-quote]").forEach(button => {
  button.addEventListener("click", () => {
    feedback.textContent = "";
    quote.showModal();
  });
});
quote.querySelector(".close").addEventListener("click", () => quote.close());

form.addEventListener("submit", event => {
  event.preventDefault();
  const fields = new FormData(form);
  const draft = [
    "Запрос коммерческого предложения на SEM-200",
    "Артикул SEM200",
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
  const url = URL.createObjectURL(new Blob(["\uFEFF", draft], {type: "text/plain;charset=utf-8"}));
  const link = document.createElement("a");
  link.href = url;
  link.download = "Запрос-КП-SEM-200.txt";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.textContent = "Текст запроса подготовлен. Проверьте загрузки браузера.";
});