export let highlightedIds = [];

export const loadHighlightedIds = async (url) => {
  try {
    const response = await fetch(url);
    const json = await response.json();
    highlightedIds = Array.isArray(json) ? json : json.ids || [];
    console.log("Załadowane ID budynków specjalnych:", highlightedIds);
  } catch (err) {
    console.error("Błąd przy ładowaniu ids.json:", err);
  }
};

export const isHighlighted = (id) => highlightedIds.includes(id);

export const showHighlightIframe = (entityId) => {
  const iframe = document.getElementById("highlight-iframe");
  const container = document.getElementById("highlight-iframe-container");
  if (iframe && container) {
    iframe.src = `http://localhost:8080/data/piskorzow/html/${entityId}.html`;
    container.style.display = "block";
  }
};

export const hideHighlightIframe = () => {
  const iframe = document.getElementById("highlight-iframe");
  const container = document.getElementById("highlight-iframe-container");
  if (iframe && container) {
    iframe.src = "";
    container.style.display = "none";
  }
};
