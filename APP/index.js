import {config, initialOrientation, initialPosition} from './cesiumConfig.js';
import {createSelectElement} from './DropDown.js';
import {pickFeatureById, hideBuildingInfo} from './eventsConfig.js';
import {LayerManager} from './layerManager.js';
import {loadHighlightedIds, isHighlighted, hideHighlightIframe, showHighlightIframe} from "./highlightConfig.js";

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
        console.error('Błąd terenu:', error);
    }

    try {
        const highlightedIds = await loadHighlightedIds();

        const dataSource = await Cesium.GeoJsonDataSource.load(
            config.geoJsonUrl,
            {
                clampToGround: false,
                fill: Cesium.Color.BLUE.withAlpha(0.5),
                stroke: Cesium.Color.BLACK,
                strokeWidth: 2,
            }
        );

        viewer.dataSources.add(dataSource);
        const features = dataSource.entities.values;

        // Inicjalizacja LayerManager
        const layerManager = new LayerManager(viewer, dataSource);

        // Kolorowanie budynków
        features.forEach((entity) => {
            if (entity.polygon) {
                const entityId = entity.properties?.id?._value;
                if (isHighlighted(entityId)) {
                    entity.polygon.material = Cesium.Color.ORANGE.withAlpha(0.5);
                } else {
                    entity.polygon.material = Cesium.Color.BLUE.withAlpha(0.5);
                }
            }
        });

        // Przelot do budynków
        viewer.flyTo(dataSource.entities);

        // Dropdown z listą budynków
        const options = features.map((feature, index) => ({
            value: index,
            textContent: feature.properties?.id || `Budynek ${index + 1}`,
        }));

        const DropDown = createSelectElement(options, 'toolbar');
        DropDown?.addEventListener('change', (event) => {
            const selectedFeature = features[event.target.value];
            if (selectedFeature) viewer.flyTo(selectedFeature);
        });

        // Kolorowanie po kliknięciu
        let selectedEntitiesColor = {};

        const colorFeatureById = (id, isHighlightedBuilding) => {
            const idFeatures = features.filter((f) => f.properties?.id._value === id._value);
            idFeatures.forEach((f) => {
              selectedEntitiesColor[id._value] = f.polygon.material; // Zapisz oryginalny kolor
              f.polygon.material = isHighlightedBuilding 
                ? Cesium.Color.GREEN.withAlpha(0.7)  // Kolor dla budynków z ids.json
                : Cesium.Color.RED.withAlpha(0.3);    // Domyślny kolor dla innych budynków
            });
          };

        const resetColors = () => {
            Object.keys(selectedEntitiesColor).forEach((id) => {
                const idFeatures = features.filter(
                    (f) => f.properties?.id._value === id
                );
                idFeatures.forEach((f) => {
                    f.polygon.material = selectedEntitiesColor[id];
                });
            });
            selectedEntitiesColor = {};
        };

        viewer.screenSpaceEventHandler.setInputAction((click) => {
            const pickedObject = viewer.scene.pick(click.position);
            if (Cesium.defined(pickedObject)) {
              const selectedEntity = pickedObject.id;
              const entityId = selectedEntity.properties?.id?._value;
              const isHighlightedBuilding = isHighlighted(entityId); // Sprawdź, czy budynek jest na liście
          
              if (Object.keys(selectedEntitiesColor).length > 0) {
                resetColors(); // Resetuj poprzednie podświetlenia
              }
          
              // Podświetl budynek odpowiednim kolorem
              colorFeatureById(selectedEntity.properties?.id, isHighlightedBuilding);
          
              // Wyświetl informacje (tylko jeśli to NIE jest budynek z ids.json)
              if (!isHighlightedBuilding) {
                pickFeatureById(selectedEntity);
              } else {
                hideBuildingInfo(); // Ukryj standardowy infobox
              }
          
              // Pokazuj iframe tylko dla budynków z ids.json
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
        console.error('Błąd GeoJSON:', error);
    }
}

initializeCesium();
