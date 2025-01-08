import os
import json
import xml.etree.ElementTree as ET
import geojson
from shapely.geometry import shape, mapping

# 1. Parsowanie pliku CityGML - tylko budynki
def parse_citygml(file_path):
    tree = ET.parse(file_path)
    root = tree.getroot()

    # Namespace używany w CityGML
    ns = {
        'gml': "http://www.opengis.net/gml",
        'bldg': "http://www.opengis.net/citygml/building/2.0"
    }

    buildings = []

    # Iteracja przez budynki w CityGML
    for building in root.findall(".//bldg:Building", ns):
        data = {
            "id": building.get("gml:id"),
            "geometry": [],
            "attributes": {}
        }

        # Pobranie geometrii
        for geom in building.findall(".//gml:Polygon", ns):
            pos_list = geom.find(".//gml:posList", ns)
            if pos_list is not None:
                coords = pos_list.text.split()
                coords = [(float(coords[i]), float(coords[i+1]), float(coords[i+2])) for i in range(0, len(coords), 3)]
                data["geometry"].append(coords)

        # Pobranie atrybutów budynku (jeśli są dostępne)
        for child in building:
            if child.tag.startswith("{http://www.opengis.net/citygml/building/2.0}"):
                tag_name = child.tag.split('}')[-1]
                data["attributes"][tag_name] = child.text

        buildings.append(data)

    return buildings

# 2. Eksport do JSON
def export_to_json(data, output_file):
    with open(output_file, "w") as f:
        json.dump(data, f, indent=4)

# 3. Konwersja do GeoJSON
def convert_to_geojson(buildings):
    features = []

    for building in buildings:
        for geom in building["geometry"]:
            try:
                polygon = {
                    "type": "Polygon",
                    "coordinates": [geom]  # Zachowanie współrzędnych 3D
                }
                feature = geojson.Feature(
                    geometry=polygon,
                    properties=building["attributes"]
                )
                features.append(feature)
            except Exception as e:
                print(f"Error converting geometry: {e}")

    return geojson.FeatureCollection(features)

# 4. Zapis GeoJSON
def save_geojson(geojson_data, output_file):
    with open(output_file, "w") as f:
        geojson.dump(geojson_data, f)

# Przykładowe użycie
if __name__ == "__main__":
    input_file = "0215/0215_M-33-47-a-b-3-3.gml"
    output_json = "j.json"
    output_geojson = "gj.geojson"

    if os.path.exists(input_file):
        # Parsowanie CityGML - tylko budynki
        buildings = parse_citygml(input_file)

        # Eksport do JSON
        export_to_json(buildings, output_json)
        print(f"JSON saved to {output_json}")

        # Konwersja do GeoJSON
        geojson_data = convert_to_geojson(buildings)
        save_geojson(geojson_data, output_geojson)
        print(f"GeoJSON saved to {output_geojson}")
    else:
        print(f"File {input_file} not found.")