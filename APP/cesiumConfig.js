export const config = {
  cesiumToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ZmM0MzgxZC1lNzRkLTQ0MTAtYjBkZi1lMGY3YTU3OGNmNjkiLCJpZCI6MjQ1NDczLCJpYXQiOjE3Mjc4NTgyMDd9.JZGqwt9SJ82KlmejZW6nloj14cCdJaZuOobiFd7UH_A",
  terrainUrl: "http://localhost:8080/data/piskorzow/nmt",
  geoJsonUrl: "http://localhost:8080/data/piskorzow/piskorzow_lod1_3.geojson",
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
