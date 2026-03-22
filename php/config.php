<?php
// Set to false in production
define('DEBUG_MODE', true);

if (!DEBUG_MODE) {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// API Keys and Usernames
$weatherKey = "";
$username = "";
?>
