import { config, initialOrientation, initialPosition } from "./cesiumConfig.js";
import { createSelectElement } from "./DropDown.js";
import { pickFeatureById, hideBuildingInfo } from "./eventsConfig.js";
import { imageryViewModels } from "./mapLayers.js";
import { LayerManager } from './layerManager.js';

Cesium.Ion.defaultAccessToken = config.cesiumToken;

async function initializeCesium() {
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
    navigationHelpButton: false,
    imageryProviderViewModels: imageryViewModels
  });

  viewer.scene.camera.setView({
    destination: initialPosition,
    orientation: initialOrientation,
  });

  try {
    const localTerrain = await Cesium.CesiumTerrainProvider.fromUrl(config.terrainUrl, {
      requestVertexNormals: true,
    });
    viewer.scene.terrainProvider = localTerrain;
  } catch (error) {
    console.error("Błąd terenu:", error);
  }

  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(config.geoJsonUrl, {
        clampToGround: false,
        fill: Cesium.Color.BLUE.withAlpha(0.5),
        stroke: Cesium.Color.BLACK,
        strokeWidth: 2,
    });

    viewer.dataSources.add(dataSource);
    
    // Inicjalizacja LayerManager
    const layerManager = new LayerManager(viewer, dataSource);

    dataSource.entities.values.forEach((entity) => {
        if (entity.polygon) {
            entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
        }
    });

    // Przelot do załadowanych budynków
    viewer.flyTo(dataSource.entities);

    // Tworzenie listy wyboru budynków
    const features = dataSource.entities.values;
    const options = features.map((feature, index) => ({
        value: index,
        textContent: feature.properties?.id || `Budynek ${index + 1}`,
    }));

    const DropDown = createSelectElement(options, "toolbar");
    DropDown?.addEventListener("change", (event) => {
        const selectedFeature = features[event.target.value];
        if (selectedFeature) viewer.flyTo(selectedFeature);
    });

    let selectedEntity = null;
    viewer.screenSpaceEventHandler.setInputAction((click) => {
        const pickedObject = viewer.scene.pick(click.position);
        if (Cesium.defined(pickedObject)) {
            if (selectedEntity) {
                selectedEntity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
            }
            selectedEntity = pickedObject.id;
            selectedEntity.polygon.material = Cesium.Color.RED.withAlpha(0.3);
            pickFeatureById(selectedEntity);
        } else {
            if (selectedEntity) {
                selectedEntity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
                selectedEntity = null;
            }
            hideBuildingInfo();
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

} catch (error) {
    console.error("Błąd GeoJSON:", error);
}
}

initializeCesium();
