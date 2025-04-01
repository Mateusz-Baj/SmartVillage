
export class LayerManager {
    constructor(viewer, dataSource) {
      this.viewer = viewer;
      this.dataSource = dataSource;
      this.adresyLayer = null;
      this.initLayersTree();
      this.osm = null
      this.orto = null
    }
  
    initLayersTree() {
      const layersContainer = document.createElement('div');
      layersContainer.id = 'layersContainer';
      layersContainer.innerHTML = `
        <div class="layers-panel">
          <h5>Zarządzanie warstwami</h5>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="geojsonToggle" checked>
            <label class="form-check-label" for="geojsonToggle">Warstwa budynków</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="adresyToggle">
            <label class="form-check-label" for="adresyToggle">Punkty adresowe</label>
          </div>
          <div class="form-check">
          <input class="form-check-input" type="checkbox" id="openstretmap">
            <label class="form-check-label" for="adresyToggle">Open Stret Map</label>
          </div>
        </div>
      `;
      document.getElementById('cesiumContainer').appendChild(layersContainer);
  
      // Obsługa warstwy budynków
      document.getElementById('geojsonToggle').addEventListener('change', (e) => {
        this.dataSource.show = e.target.checked;
      });
  
      // Obsługa warstwy adresowej
      document.getElementById('adresyToggle').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!this.adresyLayer) {
            this.adresyLayer = this.viewer.imageryLayers.addImageryProvider(
              new Cesium.WebMapServiceImageryProvider({
                url: 'https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej',
                layers: 'prg-ulice',
                parameters: {
                  transparent: false,
                  format: 'image/jpeg',
                  SERVICE: 'WMS',
                  VERSION: '1.3.0',
                  REQUEST: 'GetMap',
                  CRS: 'EPSG:2180'
                },
                enablePickFeatures: false,
                rectangle: Cesium.Rectangle.fromDegrees(14.0, 49.0, 24.0, 55.0) // Ogranicz do Polski
              })
            );
          } else {
            this.adresyLayer.show = true;
          }
        } else if (this.adresyLayer) {
          this.adresyLayer.show = false;
        }
      });
    
    // Open stret map
      document.getElementById('openstretmap').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!this.osm) {
            this.osm = this.viewer.imageryLayers.addImageryProvider(
              new Cesium.OpenStreetMapImageryProvider({
                url: 'https://a.tile.openstreetmap.org/',
                enablePickFeatures: false,
                rectangle: Cesium.Rectangle.fromDegrees(14.0, 49.0, 24.0, 55.0) // Ogranicz do Polski
              })
            );
          } else {
            this.osm.show = true;
          }
        } else if (this.osm) {
          this.osm.show = false;
        }
      });
      //orto
      document.getElementById('adresyToggle').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!this.orto) {
            this.orto = this.viewer.imageryLayers.addImageryProvider(
              new Cesium.WebMapServiceImageryProvider({
                url: 'https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution',
                layers: "ORTOFOTOMAPA",
                parameters: {
                  transparent: false,
                  format: 'image/jpeg',
                  tileMatrixSetID: "EPSG:3857",
                  tileWidth: 256,
                  tileHeight: 256
                },
                enablePickFeatures: false,
                rectangle: Cesium.Rectangle.fromDegrees(14.0, 49.0, 24.0, 55.0) // Ogranicz do Polski
              })
            );
          } else {
            this.orto.show = true;
          }
        } else if (this.orto) {
          this.orto.show = false;
        }
      });
    }
    addLayer(name, callback) {
      const container = document.querySelector('.layers-panel');
      const id = `layer-${Math.random().toString(36).substr(2, 9)}`;
      
      const layerDiv = document.createElement('div');
      layerDiv.className = 'form-check';
      layerDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" id="${id}" checked>
        <label class="form-check-label" for="${id}">${name}</label>
      `;
      container.appendChild(layerDiv);
  
      document.getElementById(id).addEventListener('change', (e) => {
        callback(e.target.checked);
      });
    }
  }