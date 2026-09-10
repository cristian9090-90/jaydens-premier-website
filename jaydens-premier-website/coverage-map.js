/**
 * coverage-map.js
 * ---------------------------------------------------------------
 * Renders the "Areas we serve" map: New Jersey counties colored by
 * whether Jayden's Premier Construction currently covers them, plus
 * a pin at the business ZIP code. Both come from /api/coverage,
 * which the admin panel (Coverage tab) writes to.
 *
 * Requires Leaflet (CSS + JS) to already be loaded on the page —
 * see the <link>/<script> tags added in index_publico.html.
 *
 * If /api/coverage isn't reachable yet (admin panel not deployed),
 * falls back to DEFAULT_COVERAGE from data.js so the map still shows
 * something sensible instead of breaking.
 * ---------------------------------------------------------------
 */
(function () {
  "use strict";

  // Public, stable, CORS-enabled GeoJSON of every US county (Census-derived,
  // FIPS-keyed). We filter it down to New Jersey (state FIPS "34") client-side.
  const US_COUNTIES_GEOJSON_URL =
    "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json";

  // NJ county name -> FIPS code (state 34 + county code), alphabetical.
  const NJ_COUNTY_FIPS = {
    Atlantic: "34001", Bergen: "34003", Burlington: "34005", Camden: "34007",
    "Cape May": "34009", Cumberland: "34011", Essex: "34013", Gloucester: "34015",
    Hudson: "34017", Hunterdon: "34019", Mercer: "34021", Middlesex: "34023",
    Monmouth: "34025", Morris: "34027", Ocean: "34029", Passaic: "34031",
    Salem: "34033", Somerset: "34035", Sussex: "34037", Union: "34039",
    Warren: "34041"
  };

  async function fetchCoverage() {
    try {
      const res = await fetch("/api/coverage");
      if (!res.ok) throw new Error("not available");
      return await res.json();
    } catch {
      // Admin panel/API not live yet — use the fallback baked into data.js.
      return typeof DEFAULT_COVERAGE !== "undefined"
        ? DEFAULT_COVERAGE
        : { counties: ["Passaic"], zip: "07522" };
    }
  }

  async function fetchPin(zip) {
    try {
      const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
      if (!res.ok) throw new Error("zip lookup failed");
      const data = await res.json();
      const place = data.places && data.places[0];
      if (!place) return null;
      return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
    } catch {
      return null;
    }
  }

  async function fetchNJCounties() {
    const res = await fetch(US_COUNTIES_GEOJSON_URL);
    const all = await res.json();
    const njFipsSet = new Set(Object.values(NJ_COUNTY_FIPS));
    return {
      ...all,
      features: all.features.filter((f) => njFipsSet.has(f.id))
    };
  }

  function fipsToName(fips) {
    return Object.keys(NJ_COUNTY_FIPS).find((name) => NJ_COUNTY_FIPS[name] === fips) || "";
  }

  async function initCoverageMap() {
    const mapEl = document.getElementById("coverage-map");
    const summaryEl = document.getElementById("coverage-summary");
    if (!mapEl || typeof L === "undefined") return;

    const [coverage, njCounties] = await Promise.all([fetchCoverage(), fetchNJCounties()]);
    const covered = new Set((coverage.counties || []).map((c) => c.trim()));

    if (summaryEl) {
      const list = Array.from(covered);
      summaryEl.textContent = list.length
        ? `Currently serving: ${list.join(", ")} County${list.length > 1 ? "ies" : ""}, NJ`
        : "Service area coming soon.";
    }

    const map = L.map(mapEl, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      attributionControl: false
    });

    const countyLayer = L.geoJSON(njCounties, {
      style: (feature) => {
        const name = fipsToName(feature.id);
        const isCovered = covered.has(name);
        return {
          fillColor: isCovered ? "#14284D" : "#F7F6F3",
          fillOpacity: isCovered ? 0.85 : 1,
          color: "#C9C6BA",
          weight: 1
        };
      },
      onEachFeature: (feature, layer) => {
        const name = fipsToName(feature.id);
        layer.bindTooltip(name + " County", { sticky: true });
      }
    }).addTo(map);

    map.fitBounds(countyLayer.getBounds(), { padding: [8, 8] });

    if (coverage.zip) {
      const pin = await fetchPin(coverage.zip);
      if (pin) {
        const icon = L.divIcon({
          className: "coverage-map-pin",
          html: '<i class="ti ti-map-pin-filled"></i>',
          iconSize: [26, 26],
          iconAnchor: [13, 26]
        });
        L.marker([pin.lat, pin.lng], { icon }).addTo(map);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", initCoverageMap);
})();
