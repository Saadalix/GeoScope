// GAZETTEER
var map;
var countryLayer;
var cityMarkers;
var userHomeCountry = null;

// Tile Layers
var streets = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
  },
);

var satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: "Tiles &copy; Esri",
  },
);

var basemaps = {
  "🗺️ Street": streets,
  "🛰️ Satellite": satellite,
};

function setPreloaderProgress(percent, message) {
  $("#preloaderBar").css("width", percent + "%");
  $("#preloaderStatus").text(message);
}

function hidePreloader() {
  $("#preloader").addClass("fade-out");
  setTimeout(function () {
    $("#preloader").remove();
  }, 700);
}

// INITIALIZE MAP
$(document).ready(function () {
  // Set global AJAX defaults
  $.ajaxSetup({
    type: "POST",
    dataType: "json",
    timeout: 10000,
  });
  // Pre-loader: Step 1
  setPreloaderProgress(10, "Initialising map...");

  map = L.map("map", {
    layers: [streets],
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: true,
    maxBounds: [
      [-90, -180],
      [90, 180],
    ],
    maxBoundsViscosity: 1.0,
  }).setView([20, 0], 2);

  //  Pre-loader: Step 2
  setPreloaderProgress(25, "Map ready...");

  // city marker cluster group
  cityMarkers = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    removeOutsideVisibleBounds: true,
  });

  // overlays AFTER initializing cityMarkers
  var overlays = {
    " 🏙️ Cities": cityMarkers,
  };

  // layer control with overlays
  L.control.layers(basemaps, overlays).addTo(map);
  L.control.scale({ position: "bottomleft" }).addTo(map);

  // cityMarkers to map
  cityMarkers.addTo(map);

  // map click handler using reverse geocoding
  map.on("click", function (e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    $.ajax({
      url: "php/getApiData.php",
      data: { lat: lat, lng: lng },
      success: function (response) {
        if (response.countryCode) {
          $("#countrySelect").val(response.countryCode);
          loadCountry(response.countryCode);
        }
      },
      error: function () {
        showErrorToast("Could not detect country.");
      },
    });
  });

  // Info button - Simpler approach
  L.easyButton(
    "fa-info",
    function () {
      var iso = $("#countrySelect").val();
      if (iso) {
        $("#infoModal").modal("show");

        // loading overlay - d-flex to center it!
        $("#infoLoading").removeClass("d-none").addClass("d-flex");

        // Fetch data
        $.ajax({
          url: "php/getCountryInfo.php",
          data: { iso: iso },
          success: function (data) {
            updateInfoModal(data.country);
            // Hide loading - REMOVE d-flex, ADD d-none
            $("#infoLoading").removeClass("d-flex").addClass("d-none");
          },
          error: function () {
            // Hide loading - REMOVE d-flex, ADD d-none
            $("#infoLoading").removeClass("d-flex").addClass("d-none");
            showErrorToast("Failed to load country information.");
          },
        });
      }
    },
    "Country Info",
  ).addTo(map);

  // Weather button
  L.easyButton(
    "fa-cloud",
    function () {
      var iso = $("#countrySelect").val();
      if (iso) {
        $("#weatherModal").modal("show");
        $("#weatherCurrent").text("Loading...");
        $("#weatherForecast").html(
          '<div class="text-center w-100"><div class="spinner-border text-success"></div></div>',
        );

        $.ajax({
          url: "php/getCountryInfo.php",
          data: { iso: iso },
          success: function (data) {
            var capital = data.country ? data.country.capital : null;
            var country = data.country ? data.country.name : null;

            // Just call the update function to fill in the blanks
            updateWeatherModal(data.weather, data.forecast, capital, country);
          },
          error: function () {
            $("#weatherCurrent").text("Failed to load");
            $("#weatherForecast").html(
              '<p class="text-danger text-center">Failed to load weather data.</p>',
            );
          },
        });
      }
    },
    "Weather",
  ).addTo(map);

  // Currency button
  L.easyButton(
    "fa-dollar-sign",
    function () {
      var iso = $("#countrySelect").val();
      if (iso) {
        $("#currencyModal").modal("show");
        $("#convertBtn")
          .prop("disabled", true)
          .html(
            '<span class="spinner-border spinner-border-sm me-2"></span>Loading...',
          );

        $.ajax({
          url: "php/getCountryInfo.php",
          data: { iso: iso },
          success: function (data) {
            updateCurrencyModal(data.currency);
            $("#convertBtn")
              .prop("disabled", false)
              .html('<i class="fas fa-exchange-alt me-2"></i>Convert');
          },
          error: function () {
            $("#convertBtn")
              .prop("disabled", false)
              .html('<i class="fas fa-exchange-alt me-2"></i>Convert');
            showErrorToast("Failed to load currency data.");
          },
        });
      }
    },
    "Currency",
  ).addTo(map);

  // Wikipedia button
  L.easyButton(
    "fa-book",
    function () {
      var iso = $("#countrySelect").val();
      if (iso) {
        $("#wikiModal").modal("show");
        $("#wikiContent").html(
          '<div class="text-center p-4"><div class="spinner-border text-success" role="status"></div><p class="mt-3">Loading Wikipedia summary...</p></div>',
        );

        $.ajax({
          url: "php/getCountryInfo.php",
          data: { iso: iso },
          success: function (data) {
            updateWikiModal(data.country);
          },
          error: function () {
            $("#wikiContent").html(
              '<p class="text-danger text-center">Failed to load data.</p>',
            );
          },
        });
      }
    },
    "Wikipedia",
  ).addTo(map);

  // Fun Facts button
  L.easyButton(
    "fa-lightbulb",
    function () {
      var iso = $("#countrySelect").val();
      if (iso) {
        $("#funFactsModal").modal("show");
        fetchFunFacts(iso);
      }
    },
    "Fun Facts",
  ).addTo(map);

  $("#countrySelect").on("change", function () {
    var iso = $(this).val();
    if (iso) {
      loadCountry(iso);
    }
  });

  // Currency converter button
  $("#convertBtn").on("click", convertCurrency);

  // Modal back button support
  window.onpopstate = function () {
    // to find the currently open modal
    const $openModal = $(".modal.show");

    if ($openModal.length > 0) {
      // jQuery method to hide it
      $openModal.modal("hide");
    }
  };

  document.querySelectorAll(".modal").forEach(function (modalEl) {
    // aria-hidden warning
    modalEl.addEventListener("hide.bs.modal", function () {
      document.activeElement.blur();
    });

    modalEl.addEventListener("show.bs.modal", function () {
      if (window.location.hash !== "#modal") {
        window.history.pushState({ modal: true }, null, "#modal");
      }
    });

    modalEl.addEventListener("hidden.bs.modal", function () {
      if (window.location.hash === "#modal") {
        window.history.back();
      }
    });
  });

  //  Pre-loader: Step 3
  setPreloaderProgress(40, "Loading country list...");
  loadCountryList();
});

// LOAD COUNTRY LIST FOR SELECT
function loadCountryList() {
  $.ajax({
    url: "php/getCountryCodes.php",
    success: function (response) {
      if (response.success && response.data) {
        var select = $("#countrySelect");
        response.data.forEach(function (country) {
          select.append(
            $("<option>", {
              value: country.code,
              text: country.name,
            }),
          );
        });

        //  Pre-loader: Step 4
        setPreloaderProgress(55, "Detecting your location...");
        getUserLocation();
      }
    },
    error: function () {
      showErrorToast("Failed to load country list from server.");
      getUserLocation();
    },
  });
}

// helper function to load default country (UK) if geolocation fails or is denied
function loadDefaultCountry() {
  userHomeCountry = "GB";
  $("#countrySelect").val("GB");
  setPreloaderProgress(85, "Loading default country...");
  loadCountry("GB");
}

// GET USER LOCATION
function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        setPreloaderProgress(70, "Finding your country...");
        $.ajax({
          url: "php/getApiData.php",
          data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          success: function (response) {
            if (response.countryCode) {
              userHomeCountry = response.countryCode;
              $("#countrySelect").val(response.countryCode);
              setPreloaderProgress(85, "Loading your country...");
              loadCountry(response.countryCode);
            } else {
              loadDefaultCountry();
            }
          },
          error: function () {
            loadDefaultCountry();
          },
        });
      },
      function () {
        loadDefaultCountry();
      },
    );
  } else {
    loadDefaultCountry();
  }
}

// LOAD COUNTRY DATA
var isLoading = false;

function loadCountry(iso) {
  if (isLoading) return;

  isLoading = true;

  // ONLY show the small spinner if the preloader has already been removed
  if ($("#preloader").length === 0) {
    showLoading();
  }

  if (countryLayer) {
    map.removeLayer(countryLayer);
  }
  cityMarkers.clearLayers();

  $.ajax({
    url: "php/getCountryBorder.php",
    data: { iso: iso },
    success: function (response) {
      if (response.success && response.feature) {
        countryLayer = L.geoJSON(response.feature, {
          style: {
            color: "#28a745",
            weight: 3,
            fillColor: "#28a745",
            fillOpacity: 0.2,
            opacity: 1,
          },
          onEachFeature: function (feature, layer) {
            var countryName = feature.properties.name || "Country";
            var countryISO = feature.properties.iso_a2 || iso;

            layer.on("click", function (e) {
              var isHome = countryISO === userHomeCountry;
              var popupContent = "<strong>" + countryName + "</strong>";

              if (isHome) {
                popupContent +=
                  '<br><span class="current-location">Current Location</span>';
              } else {
                popupContent +=
                  "<br><small>Click info button for details</small>";
              }

              L.popup()
                .setLatLng(e.latlng)
                .setContent(popupContent)
                .openOn(map);
            });

            layer.bindTooltip(countryName, {
              permanent: false,
              direction: "center",
              className: "country-tooltip",
            });
          },
        }).addTo(map);

        var bounds = countryLayer.getBounds();
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 6,
        });

        var isHome = iso === userHomeCountry;
        var popupContent =
          "<strong>" +
          (response.feature.properties.name || "Country") +
          "</strong>";

        if (isHome) {
          popupContent +=
            '<br><span class="current-location">Current Location</span>';
        } else {
          popupContent += "<br><small>Click info button for details</small>";
        }

        var latOffset =
          bounds.getCenter().lat +
          (bounds.getNorth() - bounds.getCenter().lat) * 0.5;

        L.popup()
          .setLatLng([latOffset, bounds.getCenter().lng])
          .setContent(popupContent)
          .openOn(map);

        getCountryInfo(iso);
      } else {
        hideLoading();
        isLoading = false;
        showErrorToast("Country border data unavailable.");
      }
    },
    error: function () {
      hideLoading();
      isLoading = false;
      showErrorToast("Failed to load country border.");
    },
  });
}

// GET COUNTRY INFORMATION
function getCountryInfo(iso) {
  $.ajax({
    url: "php/getCountryInfo.php",
    data: { iso: iso },
    success: function (data) {
      // capital marker explicitly using coordinates
      if (
        data.country &&
        data.country.capital &&
        data.country.capitalLat &&
        data.country.capitalLng &&
        data.country.capitalLat !== 0
      ) {
        var capitalIcon = L.ExtraMarkers.icon({
          icon: "fa-star",
          markerColor: "orange-dark",
          shape: "square",
          prefix: "fa",
        });

        var capitalMarker = L.marker(
          [data.country.capitalLat, data.country.capitalLng],
          { icon: capitalIcon },
        ).bindPopup(`<b>${data.country.capital}</b> <small>(Capital)</small>`);

        cityMarkers.addLayer(capitalMarker);
      }

      // other cities (excluding capital)
      if (data.cities) {
        data.cities.forEach(function (city) {
          // Skip if this city matches the capital name
          var isCapitalCity = false;
          if (data.country && data.country.capital && city.name) {
            var cityName = city.name.toLowerCase().trim();
            var capitalName = data.country.capital.toLowerCase().trim();

            isCapitalCity =
              cityName === capitalName ||
              (capitalName.includes(cityName) && cityName.length > 3) ||
              (cityName.includes(capitalName) && capitalName.length > 3);
          }
          if (isCapitalCity) {
            return; // Skip to next city
          }

          var cityIcon = L.ExtraMarkers.icon({
            icon: "fa-city",
            markerColor: "cyan",
            shape: "square",
            prefix: "fa",
          });

          var marker = L.marker([city.lat, city.lng], {
            icon: cityIcon,
          }).bindPopup(`<b>${city.name}</b> <small>(City)</small>`);

          cityMarkers.addLayer(marker);
        });
      }

      hideLoading();
      isLoading = false;

      if ($("#preloader").length) {
        setPreloaderProgress(100, "All done!");
        setTimeout(hidePreloader, 400);
      }
    },
    error: function () {
      hideLoading();
      isLoading = false;

      if ($("#preloader").length) {
        hidePreloader();
      }
      showErrorToast("Failed to load country information.");
    },
  });
}

// FETCH FUN FACTS
function fetchFunFacts(iso) {
  $("#funFactsList").html(
    '<div class="text-center p-4"><div class="spinner-border text-success" role="status"></div><p class="mt-3 text-muted">Loading fun facts...</p></div>',
  );

  $.ajax({
    url: "php/getFunFacts.php",
    data: { iso: iso },
    success: function (data) {
      updateFunFactsModal(data.facts);
    },
    error: function () {
      $("#funFactsList").html(
        '<div class="text-center p-4"><i class="fas fa-exclamation-triangle text-danger" style="font-size: 3rem;"></i><p class="text-danger mt-3">Failed to load fun facts.</p></div>',
      );
    },
  });
}

// UPDATE MODALS
function updateInfoModal(country) {
  if (!country) return;
  $("#infoFlag").attr("src", country.flag || "");
  $("#infoCountry").text(country.name || "-");
  $("#infoCapital").text(country.capital || "-");
  $("#infoContinent").text(country.continent || "-");
  $("#infoArea").text(country.area || "-");
  $("#infoPopulation").text(country.population || "-");
  $("#infoLanguages").text(country.languages || "-");
  $("#infoTimezone").text(country.timezone || "-");
}

// UPDATE WEATHER MODAL
function updateWeatherModal(weather, forecast, capital, country) {
  if (capital && country) {
    $("#weatherCapitalHeading").html(
      "<strong>" + capital + ", " + country + "</strong>",
    );
  } else if (capital) {
    $("#weatherCapitalHeading").html("<strong>" + capital + "</strong>");
  } else {
    $("#weatherCapitalHeading").text("Weather");
  }

  // Display weather data
  $("#weatherCurrent").text(weather || "-");

  // Display 5-day forecast
  var forecastHtml = "";
  if (forecast && forecast.length > 0) {
    forecast.slice(0, 5).forEach(function (day) {
      forecastHtml += '<div class="col text-center p-2">';
      forecastHtml += "<small>" + day.date + "</small><br>";
      forecastHtml +=
        '<img src="https://openweathermap.org/img/wn/' +
        day.icon +
        '.png" width="40"><br>';
      forecastHtml += "<strong>" + day.temp + "°C</strong>";
      forecastHtml += "</div>";
    });
  }
  $("#weatherForecast").html(forecastHtml);
}

function updateCurrencyModal(currency) {
  if (!currency) return;

  var currencies = [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CNY",
    "AUD",
    "CAD",
    "CHF",
    "INR",
    "MXN",
  ];

  // country currency if missing
  if (currency.code && !currencies.includes(currency.code)) {
    currencies.push(currency.code);
  }

  // Generate and sort options
  var options = "";
  currencies.sort().forEach(function (curr) {
    options += `<option value="${curr}">${curr}</option>`;
  });

  // Update the UI
  $("#currencyFrom").html(options).val(currency.code);
  $("#currencyTo").html(options).val("USD");

  // CRITICAL: Reset the result and amount fields for the new country
  $("#currencyAmount").val(1);
  $("#currencyResult").val("");

  // Trigger the conversion automatically so they see data immediately
  convertCurrency();
}

function updateWikiModal(country) {
  if (!country || !country.name) return;

  // encodeURIComponent to handle spaces and special characters safely
  var countryName = country.name.trim();
  var encodedName = encodeURIComponent(countryName);

  $("#wikiContent").html(
    '<div class="text-center p-4"><div class="spinner-border text-success" role="status"></div><p class="mt-3">Loading Wikipedia summary...</p></div>',
  );

  $.ajax({
    url: "php/getWikiSummary.php",
    data: { country: encodedName },
    success: function (data) {
      if (data && data.extract) {
        var html = "";

        // Flag from country data
        if (country.flag) {
          html += `<div class="text-center mb-3">`;
          html += `<img src="${country.flag}" id="wikiFlag" class="rounded shadow-sm" style="max-width: 140px; max-height: 90px; min-height: 80px; border: 0.5px solid black; object-fit: cover;" alt="${countryName} flag">`;
          html += `</div>`;
        }

        // Truncate to 50 words
        var words = data.extract.split(/\s+/);
        var truncated = words.slice(0, 50).join(" ");
        if (words.length > 50) {
          truncated += "...";
        }

        html += `<p>${truncated}</p>`;
        $("#wikiContent").html(html);

        var pageUrl =
          data.content_urls && data.content_urls.desktop
            ? data.content_urls.desktop.page
            : "https://en.wikipedia.org/wiki/" + encodedName;

        $("#wikiLink").attr("href", pageUrl);
      } else {
        $("#wikiContent").html(
          '<p class="text-muted">No summary available.</p>',
        );
        $("#wikiLink").attr(
          "href",
          "https://en.wikipedia.org/wiki/" + encodedName,
        );
      }
    },
    error: function () {
      $("#wikiContent").html(
        '<p class="text-danger">Failed to load summary.</p>',
      );
      $("#wikiLink").attr(
        "href",
        "https://en.wikipedia.org/wiki/" + encodedName,
      );
    },
  });
}

// UPDATE FUN FACTS MODAL
function updateFunFactsModal(facts) {
  var html = "";

  if (facts && facts.length > 0) {
    html += '<div class="row g-3">';

    facts.forEach(function (fact, index) {
      // Alternate colors for visual interest
      var cardClass = index % 2 === 0 ? "border-success" : "border-secondary";

      html += '<div class="col-md-6">';
      html += '<div class="card h-100 ' + cardClass + '">';
      html += '<div class="card-body">';

      // Icon and title
      html += '<h6 class="card-title text-success mb-2">';
      html += '<i class="fas ' + fact.icon + ' me-2"></i>';
      html += fact.title;
      html += "</h6>";

      // Content
      html += '<p class="card-text mb-0">' + fact.content + "</p>";

      html += "</div>";
      html += "</div>";
      html += "</div>";
    });

    html += "</div>";

    // Footer with emoji
    html += '<div class="text-center mt-4">';
    html += '<p class="text-muted mb-0">';
    html += '<i class="fas fa-info-circle me-2"></i>';
    html += "<small>These facts are sourced from RestCountries API</small>";
    html += "</p>";
    html += "</div>";
  } else {
    html = '<div class="text-center p-4">';
    html +=
      '<i class="fas fa-lightbulb text-muted" style="font-size: 3rem;"></i>';
    html +=
      '<p class="text-muted mt-3">No fun facts available for this country.</p>';
    html += "</div>";
  }

  $("#funFactsList").html(html);
}

// CURRENCY CONVERTER
function convertCurrency() {
  var from = $("#currencyFrom").val();
  var to = $("#currencyTo").val();
  var amount = parseFloat($("#currencyAmount").val());

  if (!amount || amount <= 0) {
    showErrorToast("Please enter a valid amount.");
    return;
  }

  $.ajax({
    url: "php/getCurrencyData.php",
    data: { base: from },
    success: function (data) {
      if (data.rates && data.rates[to]) {
        var result = (amount * data.rates[to]).toFixed(2);
        $("#currencyResult").val(result + " " + to);
      } else {
        showErrorToast("Exchange rate not available.");
      }
    },
    error: function () {
      showErrorToast("Failed to get exchange rate.");
    },
  });
}

// LOADING SPINNER
function showLoading() {
  isLoading = true;
  $("#loadingSpinner").addClass("active").show();
}

function hideLoading() {
  isLoading = false;
  $("#loadingSpinner").removeClass("active").hide();
}

// ERROR TOAST (jQuery compatible)
function showErrorToast(message) {
  if (!message || message.trim() === "") return;

  $("#errorMessage").text(message);

  $("#errorToast")
    .toast({
      autohide: true,
      delay: 5000,
    })
    .toast("show");
}
