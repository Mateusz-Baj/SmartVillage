export const imageryViewModels = [
      new Cesium.ProviderViewModel({
        name: "OpenStreetMap",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
        tooltip: "OpenStreetMap - darmowa mapa świata",
        creationFunction: () => new Cesium.OpenStreetMapImageryProvider({
          url: "https://a.tile.openstreetmap.org/",
        })
      }),
      new Cesium.ProviderViewModel({
        name: "Earth at Night",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/blackMarble.png"),
        tooltip: "Zdjęcie Ziemi nocą z satelity NASA",
        creationFunction: () => Cesium.IonImageryProvider.fromAssetId(3812)
      }),
      new Cesium.ProviderViewModel({
        name: "Natural Earth II",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/naturalEarthII.png"),
        tooltip: "Natural Earth II - mapa ogólnogeograficzna",
        creationFunction: () => Cesium.TileMapServiceImageryProvider.fromUrl(
          Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
        )
      }),
      new Cesium.ProviderViewModel({
        name: "Bing Map",
        creationFunction: () => new Cesium.BingMapsImageryProvider.fromUrl(
          "https://dev.virtualearth.net", {
            key: "get-yours-at-https://www.bingmapsportal.com/",
            mapStyle: Cesium.BingMapsStyle.AERIAL
        })
      }),
      new Cesium.ProviderViewModel({
        name: "Orto",
        iconUrl: "http://localhost:8080/data/piskorzow/grafiki/WMTS_thumb.png",
        tooltip: "Ortofotomapa - WMTS",
        category: "Moje",
        creationFunction: () => new Cesium.WebMapTileServiceImageryProvider({
          url: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMTS/StandardResolution",
          layer: "ORTOFOTOMAPA",
          style: "default",
          format: "image/jpeg",
          tileMatrixSetID: "EPSG:3857",
          maximumLevel: 18,
          credit: new Cesium.Credit('GUGiK'),
          tileWidth: 256,
          tileHeight: 256
        })
      }),
      new Cesium.ProviderViewModel({
        name: "arcgis",
        iconUrl: Cesium.buildModuleUrl("Widgets/Images/ImageryProviders/openStreetMap.png"),
        tooltip: "Ortofotomapa - wms",
        category: "Moje",
        creationFunction: () => new Cesium.WebMapServiceImageryProvider({
          url : 'https://sampleserver1.arcgisonline.com/ArcGIS/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/WMSServer',
          layers : '0'        
        })
      }),
    ];