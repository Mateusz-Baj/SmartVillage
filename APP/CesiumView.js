export function flyToLocation(viewier,coordinate) {
    viewier.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(...coordinate),
        orientation: {
          heading: Cesium.Math.toRadians(0.0),
          pitch: Cesium.Math.toRadians(-15.0),
        }
    })
}