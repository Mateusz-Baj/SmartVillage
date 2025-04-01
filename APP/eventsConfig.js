
export const pickFeatureById = (entity) => {
  if (!entity) return;

  //console.log("Wybrany budynek:", entity);

  const properties = entity.properties;
  const buildingInfo = {
    id: properties?.id?.getValue() || "Brak nazwy",
    height: properties?.height?.getValue() || "Brak danych",
    bheight: properties?.bheight?.getValue() || "Brak danych",
    centroid: properties?.centroid?.getValue() || "Brak danych",
  };
  console.log("Atrybuty:", buildingInfo)
  showBuildingInfo(buildingInfo);
};

// wyśiwetlanie
const showBuildingInfo = (info) => {
  const infoBox = document.getElementById("building-info");
  if (infoBox) {
    infoBox.innerHTML = `
        <h3>${info.id}</h3>
        <p><strong>Wysokość:</strong> ${info.height} m</p>
        <p><strong>Wys. budynku:</strong> ${info.bheight} m</p>
        <p><strong>Centroid:</strong> ${info.centroid} m</p>
      `;
    infoBox.style.display = "block";
  }
};

// Funkcja negująca wyświetlanie 
export const hideBuildingInfo = () => {
  const infoBox = document.getElementById("building-info");
  if (infoBox) {
    infoBox.style.display = "none";
  }
};

