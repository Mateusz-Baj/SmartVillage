export const config = {
  cesiumToken: ""Your acces Token"",
  terrainUrl: "http://localhost:8080/data/piskorzow/nmt",
  geoJsonUrl: "http://localhost:8080/data/piskorzow/piskorzow_lod2.geojson", //ctrl +shift + R
}


export const initialPosition = Cesium.Cartesian3.fromDegrees(
  16.59,
  50.65,
  5000,
);
export const initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(
  -10,
  -26,
  0,
)
