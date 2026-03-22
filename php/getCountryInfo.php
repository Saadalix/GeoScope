<?php

header('Content-Type: application/json');
require_once('config.php');

$iso = isset($_POST['iso']) ? strtoupper(trim($_POST['iso'])) : '';

if (!preg_match('/^[A-Z]{2}$/', $iso)) {
    echo json_encode(['error' => 'Invalid ISO code']);
    exit;
}

$result = [
    'country' => null,
    'weather' => null,
    'forecast' => [],
    'currency' => null,
    'cities' => []
];


// GET COUNTRY DATA (Rest Countries API)
$countryUrl = "https://restcountries.com/v3.1/alpha/{$iso}";
$ch = curl_init($countryUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$countryResponse = curl_exec($ch);
curl_close($ch);

$countryData = json_decode($countryResponse, true);

if (!empty($countryData) && is_array($countryData)) {
    $country = $countryData[0];
    
    $result['country'] = [
        'flag' => $country['flags']['png'] ?? '', 
        'name' => $country['name']['common'] ?? 'Unknown',
        'capital' => !empty($country['capital']) ? $country['capital'][0] : 'Unknown',
        'continent' => $country['continents'][0] ?? 'Unknown',
        'area' => isset($country['area']) ? number_format($country['area']) . ' km²' : 'Unknown',
        'population' => isset($country['population']) ? number_format($country['population']) : 'Unknown',
        'languages' => !empty($country['languages']) ? implode(', ', array_values($country['languages'])) : 'Unknown',
        'timezone' => !empty($country['timezones']) ? $country['timezones'][0] : 'Unknown',
        'capitalLat' => $country['capitalInfo']['latlng'][0] ?? 0,
        'capitalLng' => $country['capitalInfo']['latlng'][1] ?? 0
    ];
    
    // GET CURRENCY DATA
    if (!empty($country['currencies'])) {
        $currencyCode = array_key_first($country['currencies']);
        $currencyData = $country['currencies'][$currencyCode];
        
        // Get exchange rate
        $exchangeUrl = "https://open.er-api.com/v6/latest/{$currencyCode}";
        $ch = curl_init($exchangeUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $exchangeResponse = curl_exec($ch);
        curl_close($ch);
        
        $exchangeData = json_decode($exchangeResponse, true);
        $rate = $exchangeData['rates']['USD'] ?? 'N/A';
        
        $result['currency'] = [
            'name' => $currencyData['name'] ?? 'Unknown',
            'code' => $currencyCode,
            'exchangeRate' => is_numeric($rate) ? "1 {$currencyCode} = " . number_format($rate, 4) . " USD" : 'N/A'
        ];
    }
    
    // GET WEATHER DATA (OpenWeatherMap)
    if ($result['country']['capitalLat'] != 0 && !empty($weatherKey)) {
        $weatherUrl = "https://api.openweathermap.org/data/2.5/forecast?lat={$result['country']['capitalLat']}&lon={$result['country']['capitalLng']}&appid={$weatherKey}&units=metric";
        
        $ch = curl_init($weatherUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $weatherResponse = curl_exec($ch);
        curl_close($ch);
        
        $weatherData = json_decode($weatherResponse, true);
        
        if (!empty($weatherData['list'])) {
            $current = $weatherData['list'][0];
            $result['weather'] = round($current['main']['temp']) . '°C - ' . $current['weather'][0]['description'];
            
            // Get 5-day forecast
            $forecastDays = [];
            foreach ($weatherData['list'] as $item) {
                $date = date('D, M d', $item['dt']);
                if (!isset($forecastDays[$date])) {
                    $forecastDays[$date] = [
                        'date' => $date,
                        'temp' => round($item['main']['temp']),
                        'icon' => $item['weather'][0]['icon']
                    ];
                }
                if (count($forecastDays) >= 5) break;
            }
            $result['forecast'] = array_values($forecastDays);
        }
    }
    
    // GET CITIES DATA (GeoNames)
    $citiesUrl = "http://api.geonames.org/searchJSON?country={$iso}&featureClass=P&maxRows=10&orderby=population&username={$username}";
    
    $ch = curl_init($citiesUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $citiesResponse = curl_exec($ch);
    curl_close($ch);
    
    $citiesData = json_decode($citiesResponse, true);
    
if (!empty($citiesData['geonames'])) {
        foreach ($citiesData['geonames'] as $city) {
            $result['cities'][] = [
                'name' => $city['name'],
                'lat' => (float)$city['lat'],
                'lng' => (float)$city['lng'],
                'population' => number_format($city['population'] ?? 0)
            ];
        }
    }
    
    echo json_encode($result);
}
?>