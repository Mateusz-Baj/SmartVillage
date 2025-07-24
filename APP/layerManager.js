export class LayerManager {
  constructor(viewer, dataSource) {
    this.viewer = viewer;
    this.dataSource = dataSource;
    this.adresyLayer = null;
    this.initLayersTree();
    this.osm = null;
    this.orto = null;
    this.row = null;
  }

  initLayersTree() {
    const layersContainer = document.createElement("div");
    layersContainer.id = "layersContainer";
    layersContainer.innerHTML = `
        <div class="layers-panel">
          <h5>Zarządzanie warstwami</h5>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="geojsonToggle" checked>
            <label class="form-check-label" for="geojsonToggle">Warstwa budynków</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="openstretmap">
            <label class="form-check-label" for="adresyToggle">Open Stret Map</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="adresyToggle">
            <label class="form-check-label" for="adresyToggle">Ulice</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="orto">
            <label class="form-check-label" for="orto">Ortofotomapa</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="row">
            <label class="form-check-label" for="row">Ścieżka rowerowa</label>
          </div>
        </div>
      `;
    document.getElementById("cesiumContainer").appendChild(layersContainer);

    // Obsługa warstwy budynków
    document.getElementById("geojsonToggle").addEventListener("change", (e) => {
      this.dataSource.show = e.target.checked;
    });

    // Obsługa warstwy adresowej
    document.getElementById("adresyToggle").addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!this.adresyLayer) {
          this.adresyLayer = this.viewer.imageryLayers.addImageryProvider(
            new Cesium.WebMapServiceImageryProvider({
              url: "https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej",
              layers: "prg-ulice",
              parameters: {
                service: "WMS",
                version: "1.3.0",
                request: "GetMap",
                styles: "default",
                format: "image/png",
                transparent: true,
              },
              crs: "EPSG:4326",
              tilingScheme: new Cesium.GeographicTilingScheme(),
              rectangle: Cesium.Rectangle.fromDegrees(14.0, 49.0, 24.0, 55.0),
              enablePickFeatures: false,
            })
          );
        } else {
          this.adresyLayer.show = true;
        }
        this.viewer.imageryLayers.raiseToTop(this.adresyLayer);
      } else if (this.adresyLayer) {
        this.adresyLayer.show = false;
      }
    });

    // Open stret map
    document.getElementById("openstretmap").addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!this.osm) {
          this.osm = this.viewer.imageryLayers.addImageryProvider(
            new Cesium.OpenStreetMapImageryProvider({
              url: "https://a.tile.openstreetmap.org/",
              enablePickFeatures: false,
              rectangle: Cesium.Rectangle.fromDegrees(14.0, 49.0, 24.0, 55.0), // Ogranicz do Polski
            })
          );
        } else {
          this.osm.show = true;
        }
        this.viewer.imageryLayers.raiseToTop(this.osm);
      } else if (this.osm) {
        this.osm.show = false;
      }
    });
    //orto
    document.getElementById("orto").addEventListener("change", (e) => {
      if (e.target.checked) {
        if (!this.orto) {
          this.orto = this.viewer.imageryLayers.addImageryProvider(
            new Cesium.WebMapTileServiceImageryProvider({
              url: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution",
              layer: "ORTOFOTOMAPA",
              style: "default",
              format: "image/jpeg",
              tileMatrixSetID: "EPSG:3857",
              maximumLevel: 18,
              credit: new Cesium.Credit("GUGiK"),
              tileWidth: 256,
              tileHeight: 256,
              enablePickFeatures: false,
            })
          );
        } else {
          this.orto.show = true;
        }
        this.viewer.imageryLayers.raiseToTop(this.orto);
      } else if (this.orto) {
        this.orto.show = false;
      }
    });
    // scierzka rowerowa
    document.getElementById("row").addEventListener("change", async (e) => {
      if (e.target.checked) {
        if (!this.row) {
          try {
            const response = await fetch(
              "http://localhost:8080/data/piskorzow/row.json"
            );
            const json = await response.json();

            const feature = json.find(
              (f) =>
                f.polyline &&
                f.polyline.positions &&
                f.polyline.positions.cartesian
            );
            const rawPositions = feature.polyline.positions.cartesian;

            const positions = [];
            for (let i = 0; i < rawPositions.length; i += 3) {
              positions.push(
                new Cesium.Cartesian3(
                  rawPositions[i],
                  rawPositions[i + 1],
                  rawPositions[i + 2]
                )
              );
            }

            // długosc sciezki
            let totalDistance = 0;
            const segmentDistances = [];
            for (let i = 1; i < positions.length; i++) {
              const dist = Cesium.Cartesian3.distance(
                positions[i - 1],
                positions[i]
              );
              totalDistance += dist;
              segmentDistances.push(dist);
            }

            totalDistance = totalDistance / 1000;

            const lineDataSource = new Cesium.CustomDataSource(
              "SciezkaRowerowa"
            );
            lineDataSource.entities.add({
              id: feature.id,
              polyline: {
                positions,
                width: 3,
                material: Cesium.Color.RED.withAlpha(0.8),
                clampToGround: true,
              },
            });

            //suwak i etykieta
            this.slider = document.createElement("input");
            this.slider.type = "range";
            this.slider.min = 0;
            this.slider.max = positions.length - 2;
            this.slider.value = 0;
            this.slider.step = 1;
            this.slider.style.width = "300px";
            this.slider.style.position = "absolute";
            this.slider.style.bottom = "20px";
            this.slider.style.left = "20px";
            this.slider.style.zIndex = "999";
            document.body.appendChild(this.slider);

            this.distanceLabel = document.createElement("div");
            this.distanceLabel.style.position = "absolute";
            this.distanceLabel.style.bottom = "50px";
            this.distanceLabel.style.left = "20px";
            this.distanceLabel.style.color = "black";
            this.distanceLabel.style.backgroundColor = "OldLace";
            this.distanceLabel.style.padding = "5px";
            this.distanceLabel.style.borderRadius = "3px";
            this.distanceLabel.innerHTML = `Całkowita długość: ${totalDistance.toFixed(
              2
            )} km`;
            document.body.appendChild(this.distanceLabel);

            // suwak
            this.slider.addEventListener("input", (e) => {
              const segmentIndex = parseInt(e.target.value);
              let partialDistance = 0;

              for (let i = 0; i <= segmentIndex; i++) {
                partialDistance += segmentDistances[i];
              }

              partialDistance = partialDistance / 1000;

              // podswietlanie scierzki
              if (this.highlightedSegment) {
                lineDataSource.entities.remove(this.highlightedSegment);
              }

              this.highlightedSegment = lineDataSource.entities.add({
                polyline: {
                  positions: positions.slice(0, segmentIndex + 2),
                  width: 5,
                  material: Cesium.Color.GOLD,
                  clampToGround: true,
                },
              });

              this.distanceLabel.innerHTML = `Długość: ${partialDistance.toFixed(
                2
              )} km / ${totalDistance.toFixed(2)} km`;
            });

            this.row = lineDataSource;
            this.viewer.dataSources.add(this.row);
          } catch (err) {
            console.error("Błąd ładowania ścieżki rowerowej:", err);
          }
        } else {
          this.row.show = true;
          if (this.slider) this.slider.style.display = "block";
          if (this.distanceLabel) this.distanceLabel.style.display = "block";
        }
      } else if (this.row) {
        this.row.show = false;
        if (this.slider) this.slider.style.display = "none";
        if (this.distanceLabel) this.distanceLabel.style.display = "none";
      }
    });
  }
  addLayer(name, callback) {
    const container = document.querySelector(".layers-panel");
    const id = `layer-${Math.random().toString(36).substr(2, 9)}`;

    const layerDiv = document.createElement("div");
    layerDiv.className = "form-check";
    layerDiv.innerHTML = `
        <input class="form-check-input" type="checkbox" id="${id}" checked>
        <label class="form-check-label" for="${id}">${name}</label>
      `;
    container.appendChild(layerDiv);

    document.getElementById(id).addEventListener("change", (e) => {
      callback(e.target.checked);
    });
  }
}
