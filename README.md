# 🌍 GeoScope — Explore the World, Instantly

An interactive, responsive web application that provides comprehensive 
geographical, meteorological, and economic information about countries 
worldwide. Built with **Bootstrap 5** and integrated with multiple APIs 
for real-time data.

---

## ✨ Features

### 🗺️ Interactive Map
- **Leaflet.js Integration** — Smooth, interactive world map.
- **Marker Clustering** — Efficiently displays major cities with grouped markers.
- **Country Borders** — Highlighting of selected country boundaries in a custom green theme.
- **Auto-location** — Detects user location on load to centre the map automatically.

### 💡 Insights & Trivia
- **Wikipedia Summaries** — Fetches 50-word previews and high-resolution flags for each country.
- **Fun Facts Explorer** — A dedicated modal showcasing unique trivia and interesting data points.
- **Currency Converter** — Real-time exchange rate calculation between the country's local currency and major globals.

---

## 🛠️ Technologies Used

### Frontend
- **HTML5 & CSS3** — Modern semantic markup and responsive Grid/Flexbox layouts.
- **JavaScript (ES6) & jQuery 3.6.0** — Core logic and simplified AJAX handling.
- **Bootstrap 5.3** — Modern framework for modals, buttons, and toast notifications.
- **Leaflet 1.9.4** — Core mapping engine with MarkerCluster and EasyButton plugins.

### Backend
- **PHP 7.4+** — Server-side processing for API data aggregation.
- **cURL** — Secure server-to-server communication with external APIs.

---

## 📁 File Structure

### Backend Logic (`/php`)
The backend is modularised for fast performance and clean separation of concerns:

| File | Purpose |
| --- | --- |
| `getAllBorders.php` | Optimises initial load by extracting names and shapes from GeoJSON |
| `getCountryBorder.php` | Retrieves coordinate data for the selected country's boundary |
| `getCountryInfo.php` | Aggregates data from RestCountries, OpenWeatherMap, and GeoNames |
| `getWikiSummary.php` | Interfaces with Wikipedia REST API for summaries and article links |
| `getFunFacts.php` | Supplies unique trivia for the Fun Facts modal |
| `getCurrencyData.php` | Fetches live exchange rates for the currency converter |
| `getApiData.php` | Handles reverse geocoding to identify a country from coordinates |

### Data & Assets
- **`/data/countryBorders.geo.json`** — Primary geographical dataset containing global country boundaries.
- **`/assets/css/images/`** — Map-specific marker variations and shadow assets.
- **`/assets/images/`** — Stores favicon only.

---

## 🔌 APIs Used

| API | Purpose |
| --- | --- |
| **RestCountries** | Official country profiles (flag, population, capital) |
| **OpenWeatherMap** | Live weather and 5-day forecasts |
| **GeoNames** | City identification and location services |
| **Open Exchange Rates** | Real-time currency conversion data |
| **Wikipedia REST API** | Encyclopedic summaries and trivia |

---

## 🚀 Getting Started

1. **Clone** `git clone https://github.com/Saadalix/geoscope`
2. **Configure** — Add your API keys to `php/config.php`
3. **Permissions** — Ensure `/data` and `/php` folders have `755` permissions on Linux servers
4. **Deployment note** — When deploying to a Linux host (e.g. IONOS), ensure all file references match folder names exactly — Linux is case-sensitive

---

**Built by [Saad Ali](https://saadali.co.uk)**
