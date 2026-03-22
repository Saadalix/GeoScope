<?php
header('Content-Type: application/json');
include('config.php');

// Load the GeoJSON file
$geoJsonPath = __DIR__ . '/../data/countryBorders.geo.json';

if (!file_exists($geoJsonPath)) {
    echo json_encode(['error' => 'Country borders data not found']);
    exit;
}

$geoData = json_decode(file_get_contents($geoJsonPath), true);

if (!isset($geoData['features'])) {
    echo json_encode(['error' => 'Invalid GeoJSON structure']);
    exit;
}

// Extract codes and names
$countries = [];
foreach ($geoData['features'] as $feature) {
    if (isset($feature['properties']['iso_a2'], $feature['properties']['name'])) {
        $code = $feature['properties']['iso_a2'];
        
        // Skip unrecognized countries
        if ($code === '-99' || $code === 'XK' || empty($code)) {
            continue;
        }
        
        $countries[] = [
            'code' => $code,
            'name' => $feature['properties']['name']
        ];
    }
}

// Sort alphabetically by name
usort($countries, function ($a, $b) {
    return strcasecmp($a['name'], $b['name']);
});

// Return JSON
echo json_encode([
    'success' => true,
    'data' => $countries,
    'count' => count($countries)
], JSON_UNESCAPED_SLASHES);
?>