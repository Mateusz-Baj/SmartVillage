import json
import psycopg2
from shapely.geometry import Polygon

def prepareSQL(lng, lat, delta):
    return f'''
        SELECT DISTINCT SG.id, SG.root_id, TS.building_id,
            ST_AsGeoJSON(ST_Transform(SG.geometry, 4326)) AS jsongeom,
            zmin, TS.objectclass_id
        FROM citydb.surface_geometry SG
        INNER JOIN citydb.thematic_surface TS ON TS.lod2_multi_surface_id=SG.root_id
        INNER JOIN (
            SELECT DISTINCT TSGRND.building_id,
                ST_ZMin(ST_Transform(SGGRND.geometry, 4326)) AS zmin
            FROM citydb.thematic_surface TSGRND
            INNER JOIN surface_geometry SGGRND ON TSGRND.lod2_multi_surface_id=SGGRND.root_id
            WHERE TSGRND.objectclass_id=35
                AND SGGRND.geometry IS NOT NULL
                AND SGGRND.geometry && ST_MakeEnvelope({lng}, {lat}, {lng+delta}, {lat+delta}, 2180)
        ) AS TSGRND2 ON TSGRND2.building_id=TS.building_id
        WHERE TS.building_id=TSGRND2.building_id
            AND TS.objectclass_id IN (33, 34)
            AND SG.geometry IS NOT NULL
        ORDER BY TS.building_id
    '''

def calculate_centroid(coords):
    """Oblicza centroid 2D dla listy współrzędnych"""
    if len(coords) < 3:
        return None
    try:
        polygon = Polygon([(coord[0], coord[1]) for coord in coords])
        return [polygon.centroid.x, polygon.centroid.y]
    except:
        return None

def convertToGeoJson(res, col, row):
    id = 1
    geojson_roof_features = []
    geojson_wall_features = []
    
    # Słownik do przechowywania informacji o budynkach
    building_info = {}
    
    # Najpierw zbierzmy wszystkie dane dla każdego budynku
    for rec in res:
        if rec[3] is not None:
            jsonOb = json.loads(rec[3])
            if jsonOb['type'] == 'Polygon':
                building_id = str(rec[2])
                coords = jsonOb['coordinates'][0]
                heights = [coord[2] for coord in coords if len(coord) > 2]
                
                if building_id not in building_info:
                    building_info[building_id] = {
                        'min': float('inf'),
                        'max': float('-inf'),
                        'ground': rec[4],  # Zmin z zapytania SQL
                        'surfaces': []
                    }
                
                # Oblicz centroid dla tej powierzchni
                surface_centroid = calculate_centroid(coords)
                
                # Dodajemy informacje o powierzchni
                building_info[building_id]['surfaces'].append({
                    'type': rec[5],  # 33 (dach) lub 34 (ściana)
                    'coords': coords,
                    'centroid': surface_centroid
                })
                
                # Aktualizujemy wysokości
                current_min = min(heights)
                current_max = max(heights)
                
                if current_min < building_info[building_id]['min']:
                    building_info[building_id]['min'] = current_min
                
                if current_max > building_info[building_id]['max']:
                    building_info[building_id]['max'] = current_max

    # Teraz przetwarzamy rekordy i tworzymy GeoJSON
    for building_id, info in building_info.items():
        # Oblicz centroid budynku (używamy pierwszej powierzchni jako reprezentatywnej)
        building_centroid = None
        if info['surfaces']:
            # Szukamy powierzchni podłogi (ground) jeśli istnieje
            ground_surfaces = [s for s in info['surfaces'] if s['type'] == 35]  # 35 to podłoga
            if ground_surfaces:
                building_centroid = ground_surfaces[0]['centroid']
            else:
                building_centroid = info['surfaces'][0]['centroid']
        
        # Przetwarzamy wszystkie powierzchnie budynku
        for surface in info['surfaces']:
            if surface['type'] in (33, 34):  # Tylko dachy i ściany
                coordArr = [[coord[0], coord[1], coord[2]] for coord in surface['coords']]
                
                properties = {
                    "name": f"Bld{building_id}",
                    "id": f"BD{building_id}",
                    "height": info['max'],  # Maksymalna wysokość
                    "zmin": info['ground'],  # Wysokość podłogi
                    "bheight": round(info['max'] - info['min'], 3),  # Wysokość budynku
                    "centroid": building_centroid,
                    "surface": "roof" if surface['type'] == 33 else "wall"# Centroid budynku
                }

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [coordArr]
                    },
                    "properties": properties
                }

                if surface['type'] == 33:  # Dach
                    geojson_roof_features.append(feature)
                elif surface['type'] == 34:  # Ściana
                    geojson_wall_features.append(feature)

    geojson_roof_features = geojson_roof_features + geojson_wall_features
    geojsonRoofs = {
        "type": "FeatureCollection", 
        "id1": f"{col}_{row}",
        "features": geojson_roof_features
    }
    return geojsonRoofs

conn = psycopg2.connect(host='localhost', port='5432', dbname='3dcitydb', user='postgres', password='Mbajor')
cursor = conn.cursor()

tileRange = {
    "lng": (6397406.935716629,6399584.732834442),  # X (easting)
    "lat": (5621839.629558323,5624876.281581551),  # Y (northing)
    "delta": 1000
}

lng = tileRange["lng"][0]
delta = tileRange["delta"]
row = 0
col = 0
while lng<tileRange["lng"][1]:
    lat = tileRange["lat"][0]
    while lat<tileRange["lat"][1]:
        if True:
            SQL = prepareSQL(lng, lat, delta)
            cursor.execute(SQL)

            pl = open('a'+str(col)+'_'+str(row)+'.geojson', 'w')
            pl.write(json.dumps(convertToGeoJson(cursor.fetchall(), col, row)))
            pl.close()
        lat += delta
        row +=1 
    lng += delta
    col += 1
    row = 0
conn.close()
