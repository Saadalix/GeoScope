<?php

header('Content-Type: application/json');
require_once('config.php');

// Validate inputs
$lat = filter_var($_POST['lat'] ?? null, FILTER_VALIDATE_FLOAT);
$lng = filter_var($_POST['lng'] ?? null, FILTER_VALIDATE_FLOAT);

if ($lat === false || $lng === false) {
    echo json_encode(['error' => 'Invalid coordinates']);
    exit;
}

// Call GeoNames API
$url = "https://secure.geonames.org/countryCodeJSON?lat=$lat&lng=$lng&username=$username";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Handle errors
if ($httpCode !== 200 || !$response) {
    echo json_encode(['error' => 'GeoNames API unreachable']);
    exit;
}

$data = json_decode($response, true);

if (isset($data['status'])) {
    echo json_encode(['error' => $data['status']['message']]);
} elseif (!isset($data['countryCode'])) {
    echo json_encode(['error' => 'No country found', 'countryCode' => null]);
} else {
    echo json_encode($data);
}
?>