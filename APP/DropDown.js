export const createSelectElement = (options, parentId) => {
  const parentElement = document.getElementById(parentId);
  if (!parentElement) return null;

  const selectElement = document.createElement("select");
  selectElement.className = "cesium-button";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Wybierz budynek";
  selectElement.appendChild(defaultOption);

  options.forEach((option) => {
    const optionElement = document.createElement("option");
    optionElement.value = option.value;
    optionElement.textContent = option.textContent;
    selectElement.appendChild(optionElement)
  });

  parentElement.appendChild(selectElement);
  return selectElement;
}
