import os
import xml.etree.ElementTree as ET
import geojson
from pyproj import Transformer

# Transformacja współrzędnych z EPSG:2180 do EPSG:4326
transformer = Transformer.from_crs("EPSG:2180", "EPSG:4326", always_xy=True)

def parse_citygml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    ns = {
        'gml': "http://www.opengis.net/gml",
        'bldg': "http://www.opengis.net/citygml/building/2.0"
    }

    buildings = []

    for building in root.findall(".//bldg:Building", ns):
        data = {
            "id": building.get("gml:id"),
            "geometry": [],
            "attributes": {}
        }

        for geom in building.findall(".//gml:Polygon", ns):
            pos_list = geom.find(".//gml:posList", ns)
            if pos_list is not None:
                coords = list(map(float, pos_list.text.split()))
                transformed_coords = [
                    transformer.transform(coords[i], coords[i+1]) + (coords[i+2],)  # Transformacja XY, zachowanie Z
                    for i in range(0, len(coords), 3)
                ]
                data["geometry"].append(transformed_coords)

        for child in building:
            if child.tag.startswith("{http://www.opengis.net/citygml/building/2.0}"):
                tag_name = child.tag.split('}')[-1]
                data["attributes"][tag_name] = child.text

        buildings.append(data)

    return buildings

def convert_to_geojson(buildings, feature_id="1_3"):
    features = []

    for building in buildings:
        try:
            for polygon in building["geometry"]:
                feature = geojson.Feature(
                    geometry={
                        "type": "Polygon",
                        "coordinates": [polygon]
                    },
                    properties={
                        "name": building["id"]
                    }
                )
                features.append(feature)
        except Exception as e:
            print(f"Error converting geometry: {e}")

    return geojson.FeatureCollection(features, id=feature_id)

def save_geojson(geojson_data, output_file):
    with open(output_file, "w") as f:
        geojson.dump(geojson_data, f, indent=4)

if __name__ == "__main__":
    input_file = "piskorzow_lod1.gml"
    output_geojson = "piskorzow_lod1.geojson"

    if os.path.exists(input_file):
        buildings = parse_citygml(input_file)
        geojson_data = convert_to_geojson(buildings)
        save_geojson(geojson_data, output_geojson)
        print(f"GeoJSON saved to {output_geojson}")
    else:
        print(f"File {input_file} not found.")
