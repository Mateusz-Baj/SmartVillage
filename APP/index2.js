import { accesToken} from "./cesiumConfig.js";
import { locations } from "./location.js";
import { createSelectElement } from "./DropDown.js";
import { flyToLocation } from "./CesiumView.js";
// Your access token can be found at: https://ion.cesium.com/tokens.
// Replace your_access_token with your Cesium ion access token.
Cesium.Ion.defaultAccessToken = accesToken;
// Initialize the Cesium Viewer in the HTML element with the cesiumContainer ID.
const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
// Fly the camera to San Francisco at the given longitude, latitude, and height.
const buildingTileset = await Cesium.createOsmBuildingsAsync();
viewer.scene.primitives.add(buildingTileset);

const options = Object.keys (locations).map((key) => ({
  value: key,
  textContent: locations[key].cityName
}));

const DropDown = createSelectElement(options,'toolbar')

flyToLocation(viewer,locations[0].coordinate)

if (DropDown) {
  DropDown.addEventListener('change', (event) => {
    const selectIndex = event.target.value;
    const selectedLocation = Object.values(locations)[selectIndex].coordinate;
    flyToLocation(viewer,selectedLocation);
  })
}