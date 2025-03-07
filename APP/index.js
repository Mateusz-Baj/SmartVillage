import { accesToken } from "./cesiumConfig.js";
import { createSelectElement } from "./DropDown.js";
import { flyToLocation } from "./CesiumView.js";

// Ustawienie tokena Cesium Ion
Cesium.Ion.defaultAccessToken = accesToken;

// Inicjalizacja Cesium Viewer z globalnym terenem
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),  // Globalny teren
});

// Konfiguracja lokalnego dostawcy terenu
const localTerrain = new Cesium.CesiumTerrainProvider({
  url: 'http://localhost:8000/',
  requestVertexNormals: true,
  requestWaterMask: true
});

// Ustawienie lokalnego terenu jako dostawcy terenu
viewer.scene.terrainProvider = localTerrain;

// Dodanie budynków OSM
//const buildingTileset = await Cesium.createOsmBuildingsAsync();
//viewer.scene.primitives.add(buildingTileset);

// Wczytanie pliku GeoJSON
const geoJsonUrl = "./piskorzow_lod1_3.geojson";  // Ścieżka do pliku GeoJSON
Cesium.GeoJsonDataSource.load(geoJsonUrl, {
  clampToGround: false, 
}).then((dataSource) => {
  viewer.dataSources.add(dataSource);
  viewer.flyTo(dataSource);

  // Pobranie lokalizacji budynków z GeoJSON do listy wyboru
  const features = dataSource.entities.values;
  const options = features.map((feature, index) => ({
    value: index,
    textContent: feature.name || `Budynek ${index + 1}`
  }));

  const DropDown = createSelectElement(options, 'toolbar');

  if (DropDown) {
    DropDown.addEventListener('change', (event) => {
      const selectedFeature = features[event.target.value];
      if (selectedFeature) {
        viewer.flyTo(selectedFeature);
      }
    });
  }
}).catch((error) => {
  console.error("Błąd wczytywania GeoJSON:", error);
});
