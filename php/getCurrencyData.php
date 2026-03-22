<?php
header('Content-Type: application/json');
include('config.php');

$base = isset($_POST['base']) ? strtoupper(trim($_POST['base'])) : 'USD';

if (!preg_match('/^[A-Z]{3}$/', $base)) {
    echo json_encode(['error' => 'Invalid currency code']);
    exit;
}

$exchangeUrl = "https://open.er-api.com/v6/latest/{$base}";

$ch = curl_init($exchangeUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    echo $response;
} else {
    echo json_encode(['error' => 'Failed to fetch exchange rates']);
}
?>