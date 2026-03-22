<?php
header('Content-Type: application/json');
include('config.php');

// Validate ISO code
$iso = isset($_POST['iso']) ? strtoupper(trim($_POST['iso'])) : '';

if (!preg_match('/^[A-Z]{2}$/', $iso)) {
    echo json_encode(['error' => 'Invalid ISO code']);
    exit;
}

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

// Find the matching feature
foreach ($geoData['features'] as $feature) {
    if (isset($feature['properties']['iso_a2']) && 
        $feature['properties']['iso_a2'] === $iso) {
        
        // Return just the feature
        echo json_encode([
            'success' => true,
            'feature' => $feature
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }
}

// Not found
echo json_encode(['error' => 'Country not found']);
?>