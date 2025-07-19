import { config, initialOrientation, initialPosition } from "./cesiumConfig.js";
import { createSelectElement } from "./DropDown.js";
import { pickFeatureById, hideBuildingInfo } from "./eventsConfig.js";
import { LayerManager } from "./layerManager.js";
import {
  loadHighlightedIds,
  isHighlighted,
  hideHighlightIframe,
  showHighlightIframe,
} from "./highlightConfig.js";

Cesium.Ion.defaultAccessToken = config.cesiumToken;

async function initializeCesium() {
  await loadHighlightedIds("http://localhost:8080/data/piskorzow/ids.json");

  const viewer = new Cesium.Viewer("cesiumContainer", {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    timeline: false,
    geocoder: false,
    homeButton: false,
    fullscreenButton: false,
    sceneModePicker: false,
    animation: false,
    infoBox: false,
    baseLayerPicker: false,
    imageryProvider: false,
    navigationHelpButton: false,
  });

  viewer.scene.camera.setView({
    destination: initialPosition,
    orientation: initialOrientation,
  });

  try {
    const localTerrain = await Cesium.CesiumTerrainProvider.fromUrl(
      config.terrainUrl,
      {
        requestVertexNormals: true,
      }
    );
    viewer.scene.terrainProvider = localTerrain;
  } catch (error) {
    console.error("Błąd terenu:", error);
  }

  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(config.geoJsonUrl, {
      clampToGround: false,
      stroke: Cesium.Color.BLACK,
      strokeWidth: 0.1,
    });

    viewer.dataSources.add(dataSource);
    const features = dataSource.entities.values;

    // Inicjalizacja LayerManager
    const layerManager = new LayerManager(viewer, dataSource);
    //kolorowanie budynków
    features.forEach((entity) => {
      if (entity.polygon && entity.properties) {
        const surfaceType = entity.properties.surface?._value;
        const entityId = entity.properties?.id?._value;
        const isHighlightedBuilding = isHighlighted(entityId);
    
        if (surfaceType === "roof") {
          entity.polygon.material = isHighlightedBuilding
            ? Cesium.Color.LIGHTBLUE // wyróżniony dach
            : Cesium.Color.fromCssColorString("#b22222"); // zwykły dach
        } else if (surfaceType === "wall") {
          entity.polygon.material = isHighlightedBuilding
            ? Cesium.Color.GRAY
            : Cesium.Color.WHITE;
        }
    
        entity.polygon.outline = true;
      }
    });
    

    // Przelot do budynków
    viewer.flyTo(dataSource.entities);

    // Dropdown z listą budynków
    const addedIds = new Set();
const highlightedFeatures = [];

features.forEach((feature) => {
    const entityId = feature.properties?.id?._value;
    if (isHighlighted(entityId) && !addedIds.has(entityId)) {
        highlightedFeatures.push(feature);
        addedIds.add(entityId);
    }
});

const options = highlightedFeatures.map((feature, index) => ({
    value: index,
    textContent: feature.properties?.id?._value || feature.properties?.name?._value || `Budynek ${index + 1}`,
}));

const DropDown = createSelectElement(options, 'toolbar');
DropDown?.addEventListener('change', (event) => {
    const selectedFeature = highlightedFeatures[event.target.value];
    if (selectedFeature) viewer.flyTo(selectedFeature);
});

    // Kolorowanie po kliknięciu
    let selectedEntitiesColor = {};

    const colorFeatureById = (id, isHighlightedBuilding) => {
      const idFeatures = features.filter(
        (f) => f.properties?.id._value === id._value
      );
      selectedEntitiesColor[id._value] = idFeatures.map((f) => ({
        entity: f,
        surface: f.properties?.surface?._value
      }));
      idFeatures.forEach((f) => {
        f.polygon.material = isHighlightedBuilding
          ? Cesium.Color.LIGHTGREEN.withAlpha(0.7)
          : Cesium.Color.LEMONCHIFFON.withAlpha(0.3);
      });
    };

    const resetColors = () => {
      Object.keys(selectedEntitiesColor).forEach((id) => {
        selectedEntitiesColor[id].forEach(({ entity, surface }) => {
          const isHighlightedBuilding = isHighlighted(id);
    
          if (surface === "roof") {
            entity.polygon.material = isHighlightedBuilding
              ? Cesium.Color.LIGHTBLUE
              : Cesium.Color.fromCssColorString("#b22222");
          } else if (surface === "wall") {
            entity.polygon.material = isHighlightedBuilding
              ? Cesium.Color.GRAY
              : Cesium.Color.WHITE;
          }
        });
      });
      selectedEntitiesColor = {};
    };

    document.getElementById("close-iframe-button")?.addEventListener("click", () => {
      hideHighlightIframe();
      resetColors();
    });

    viewer.screenSpaceEventHandler.setInputAction((click) => {
      const pickedObject = viewer.scene.pick(click.position);
      if (Cesium.defined(pickedObject)) {
        const selectedEntity = pickedObject.id;
        const entityId = selectedEntity.properties?.id?._value;
        const isHighlightedBuilding = isHighlighted(entityId);

        if (Object.keys(selectedEntitiesColor).length > 0) {
          resetColors();
        }
        colorFeatureById(selectedEntity.properties?.id, isHighlightedBuilding);
        if (!isHighlightedBuilding) {
          pickFeatureById(selectedEntity);
        } else {
          hideBuildingInfo();
        }
        if (isHighlightedBuilding) {
          showHighlightIframe(entityId);
        } else {
          hideHighlightIframe();
        }
      } else {
        if (Object.keys(selectedEntitiesColor).length > 0) {
          resetColors();
        }
        hideBuildingInfo();
        hideHighlightIframe();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  } catch (error) {
    console.error("Błąd GeoJSON:", error);
  }
}

initializeCesium();
