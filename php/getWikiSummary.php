<?php
header('Content-Type: application/json');
include('config.php');

// 1. Get the country and decode it in case it was sent URL-encoded
$country = isset($_POST['country']) ? urldecode(trim($_POST['country'])) : '';

if (empty($country)) {
    echo json_encode(['error' => 'Country name required']);
    exit;
}

// 2. Wikipedia API prefers Underscores. 
// We replace spaces with underscores AFTER decoding, then rawurlencode for the URL.
$formattedCountry = str_replace(' ', '_', $country);
$wikiUrl = "https://en.wikipedia.org/api/rest_v1/page/summary/" . rawurlencode($formattedCountry);

$ch = curl_init($wikiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true); 
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
// Best practice: Wikipedia API requires a descriptive User-Agent
curl_setopt($ch, CURLOPT_USERAGENT, 'GeoScope/1.0 (saad.alix99@example.com)'); 

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo $response;
} else {
    // Return the formatted name in the error so you can debug what PHP tried to fetch
    echo json_encode([
        'error' => 'Wikipedia summary not found', 
        'code' => $httpCode,
        'attempted_title' => $formattedCountry
    ]);
}
?>
