<?php
header('Content-Type: application/json');
include('config.php');

$iso = isset($_POST['iso']) ? strtoupper(trim($_POST['iso'])) : '';

if (!preg_match('/^[A-Z]{2}$/', $iso)) {
    echo json_encode(['error' => 'Invalid ISO code']);
    exit;
}

// Get country data from RestCountries
$countryUrl = "https://restcountries.com/v3.1/alpha/{$iso}";
$ch = curl_init($countryUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
$countryResponse = curl_exec($ch);
curl_close($ch);

$countryData = json_decode($countryResponse, true);

if (empty($countryData) || !is_array($countryData)) {
    echo json_encode(['error' => 'Country not found']);
    exit;
}

$country = $countryData[0];
$facts = [];

// Fact 1: Official Name
if (isset($country['name']['official'])) {
    $facts[] = [
        'icon' => 'fa-flag',
        'title' => 'Official Name',
        'content' => $country['name']['official']
    ];
}

// Fact 2: Native Name
if (isset($country['name']['nativeName']) && is_array($country['name']['nativeName'])) {
    $nativeNames = [];
    foreach ($country['name']['nativeName'] as $lang => $nameData) {
        if (isset($nameData['official'])) {
            $nativeNames[] = $nameData['official'];
        }
    }
    if (!empty($nativeNames)) {
        $facts[] = [
            'icon' => 'fa-language',
            'title' => 'Native Name',
            'content' => implode(', ', array_unique($nativeNames))
        ];
    }
}

// Fact 3: Region & Subregion
if (isset($country['region']) && isset($country['subregion'])) {
    $facts[] = [
        'icon' => 'fa-globe-americas',
        'title' => 'Location',
        'content' => $country['subregion'] . ', ' . $country['region']
    ];
}

// Fact 4: Driving Side
if (isset($country['car']['side'])) {
    $side = ucfirst($country['car']['side']);
    $facts[] = [
        'icon' => 'fa-car',
        'title' => 'Driving Side',
        'content' => 'Vehicles drive on the ' . $side . ' side of the road'
    ];
}

// Fact 5: Weekend Days
if (isset($country['startOfWeek'])) {
    $weekStart = ucfirst($country['startOfWeek']);
    $facts[] = [
        'icon' => 'fa-calendar',
        'title' => 'Week Starts On',
        'content' => $weekStart
    ];
}

// Fact 6: Landlocked or Coastal
if (isset($country['landlocked'])) {
    $landStatus = $country['landlocked'] ? 'Landlocked (no access to ocean)' : 'Has ocean coastline';
    $facts[] = [
        'icon' => 'fa-water',
        'title' => 'Geographic Status',
        'content' => $landStatus
    ];
}

// Fact 7: UN Member
if (isset($country['unMember'])) {
    $unStatus = $country['unMember'] ? 'Member of the United Nations' : 'Not a UN member';
    $facts[] = [
        'icon' => 'fa-globe',
        'title' => 'United Nations',
        'content' => $unStatus
    ];
}

// Fact 8: Independent
if (isset($country['independent'])) {
    $indStatus = $country['independent'] ? 'Independent nation' : 'Not fully independent';
    $facts[] = [
        'icon' => 'fa-landmark',
        'title' => 'Independence Status',
        'content' => $indStatus
    ];
}

// Fact 9: Calling Code
if (isset($country['idd']['root']) && isset($country['idd']['suffixes'])) {
    $callingCode = $country['idd']['root'];
    if (!empty($country['idd']['suffixes'])) {
        $callingCode .= $country['idd']['suffixes'][0];
    }
    $facts[] = [
        'icon' => 'fa-phone',
        'title' => 'International Calling Code',
        'content' => $callingCode
    ];
}

// Fact 10: Internet TLD
if (isset($country['tld']) && !empty($country['tld'])) {
    $facts[] = [
        'icon' => 'fa-globe',
        'title' => 'Internet Domain',
        'content' => implode(', ', $country['tld'])
    ];
}

// Fact 11: Border Countries Count
if (isset($country['borders']) && is_array($country['borders'])) {
    $borderCount = count($country['borders']);
    if ($borderCount > 0) {
        $facts[] = [
            'icon' => 'fa-map',
            'title' => 'Bordering Countries',
            'content' => 'Shares borders with ' . $borderCount . ' ' . ($borderCount === 1 ? 'country' : 'countries')
        ];
    } else {
        $facts[] = [
            'icon' => 'fa-map',
            'title' => 'Bordering Countries',
            'content' => 'Island nation with no land borders'
        ];
    }
}

// Fact 12: FIFA Code
if (isset($country['fifa'])) {
    $facts[] = [
        'icon' => 'fa-futbol',
        'title' => 'FIFA Code',
        'content' => $country['fifa'] . ' (Football/Soccer)'
    ];
}

echo json_encode(['facts' => $facts]);
?>