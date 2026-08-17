// api/get-weather.js
// Vercel Serverless Function. Erreichbar unter: /api/get-weather
//
// Holt Wetterdaten von Open-Meteo (kostenlos, kein API-Key nötig) für Rohrdorf
// und bereitet sie so auf, wie sie im "Buddel Wetter" Widget gebraucht werden.
//
// Warum Open-Meteo statt wetter.com direkt?
// wetter.com hat keine öffentliche kostenlose API und die Seite ist reines
// JS/Tracking-HTML, das sich jederzeit ändern kann -> sehr wartungsanfällig.
// Open-Meteo liefert die gleichen Kennzahlen (Temp, Niederschlag, Sonnenstunden)
// stabil und lizenzfrei für nicht-kommerzielle Nutzung.

const LAT = 47.7971;
const LON = 12.1701; // Rohrdorf, Bayern (gleiche Koordinaten wie auf wetter.com)

function mapWeatherCodeToIcon(code) {
  if (code === 0) return "sun";
  if ([1, 2].includes(code)) return "sun-cloud";
  if (code === 3) return "cloud";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "rain-light";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "thunder";
  return "cloud";
}

function mapWeatherCodeToLabel(code) {
  if (code === 0) return "Sonnig";
  if ([1, 2].includes(code)) return "Leicht bewölkt";
  if (code === 3) return "Bewölkt";
  if ([45, 48].includes(code)) return "Neblig";
  if ([51, 53, 55, 56, 57].includes(code)) return "Nieselregen";
  if ([61, 63, 65, 66, 67].includes(code)) return "Regen";
  if ([80, 81, 82].includes(code)) return "Regenschauer";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Schnee";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  return "Wechselhaft";
}

// Eigene Gießindex-Logik, angelehnt an die Kategorien von wetter.com
// (nicht gießen / wenig gießen / mäßig gießen / viel gießen).
function calcGiessindex(precipitationSum, tempMax) {
  if (precipitationSum >= 5) return "nicht gießen";
  if (precipitationSum >= 2) return "wenig gießen";
  if (tempMax >= 25) return "viel gießen";
  if (tempMax >= 18) return "mäßig gießen";
  return "wenig gießen";
}

// Bodenfrost-Einschätzung anhand der Tiefsttemperatur
function calcBodenfrost(tempMin) {
  if (tempMin <= 0) return { status: "ja", label: "Bodenfrost" };
  if (tempMin <= 3) return { status: "moeglich", label: "Bodenfrost möglich" };
  return { status: "nein", label: "Kein Bodenfrost" };
}

module.exports = async (req, res) => {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,weather_code` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunshine_duration` +
      `&timezone=Europe%2FBerlin&forecast_days=1`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo Fehler: ${response.status}`);
    }

    const data = await response.json();

    const currentTemp = Math.round(data.current.temperature_2m);
    const currentCode = data.current.weather_code;

    const tempMax = Math.round(data.daily.temperature_2m_max[0]);
    const tempMin = Math.round(data.daily.temperature_2m_min[0]);
    const precipProbability = Math.round(
      data.daily.precipitation_probability_max[0]
    );
    const precipSum = data.daily.precipitation_sum[0];
    const sunshineHours =
      Math.round((data.daily.sunshine_duration[0] / 3600) * 10) / 10;

    const bodenfrost = calcBodenfrost(tempMin);

    const result = {
      ort: "Rohrdorf",
      aktualisiert: new Date().toISOString(),
      icon: mapWeatherCodeToIcon(currentCode),
      wetterLabel: mapWeatherCodeToLabel(currentCode),
      temperaturAktuell: currentTemp,
      temperaturMax: tempMax,
      temperaturMin: tempMin,
      niederschlagProzent: precipProbability,
      sonnenstunden: sunshineHours,
      giessindex: calcGiessindex(precipSum, tempMax),
      bodenfrostStatus: bodenfrost.status,
      bodenfrostLabel: bodenfrost.label,
    };

    // CORS erlauben, damit der Notion HTML-Block (andere Origin) zugreifen darf
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=900");
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
