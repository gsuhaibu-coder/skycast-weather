
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const message = document.getElementById("message");

const cityName = document.getElementById("cityName");
const currentDate = document.getElementById("currentDate");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feels = document.getElementById("feels");
const rain = document.getElementById("rain");

const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const aqi = document.getElementById("aqi");
const aqiDescription = document.getElementById("aqiDescription");

const hourlyContainer = document.getElementById("hourlyContainer");
const forecastContainer = document.getElementById("forecastContainer");
const alertsContainer = document.getElementById("alertsContainer");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");

let selectedUnit = "C";
let currentWeather = null;
let hourlyWeather = null;
let dailyWeather = null;
let currentAirQuality = null;
let currentTimezone = "auto";

// Convert Celsius to selected temperature unit
function formatTemperature(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--";
    }

    const converted = selectedUnit === "F"
        ? Number(value) * 9 / 5 + 32
        : Number(value);

    return `${Math.round(converted)}°${selectedUnit}`;
}

// Weather descriptions and icons
function getWeatherInfo(code) {
    const weatherCodes = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Fog", "🌫️"],
        48: ["Depositing Rime Fog", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Moderate Drizzle", "🌦️"],
        55: ["Heavy Drizzle", "🌧️"],
        56: ["Freezing Drizzle", "🌧️"],
        57: ["Heavy Freezing Drizzle", "🌧️"],
        61: ["Light Rain", "🌧️"],
        63: ["Moderate Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        66: ["Freezing Rain", "🌧️"],
        67: ["Heavy Freezing Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Moderate Snow", "🌨️"],
        75: ["Heavy Snow", "❄️"],
        77: ["Snow Grains", "🌨️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Moderate Showers", "🌧️"],
        82: ["Heavy Showers", "⛈️"],
        85: ["Snow Showers", "🌨️"],
        86: ["Heavy Snow Showers", "❄️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm with Hail", "⛈️"]
    };

    return weatherCodes[code] || ["Unknown Weather", "🌤️"];
}

function showMessage(text) {
    message.textContent = text;
}

function formatTime(timeString) {
    if (!timeString) return "--:--";

    const parts = timeString.split("T");
    const timePart = parts[1] || parts[0];
    const [hourString, minuteString] = timePart.split(":");

    let hour = Number(hourString);
    const minute = minuteString || "00";
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${hour}:${minute} ${period}`;
}

// Display current weather
function displayCurrentWeather() {
    if (!currentWeather) return;

    const info = getWeatherInfo(currentWeather.weather_code);

    temperature.textContent =
        formatTemperature(currentWeather.temperature_2m);

    feels.textContent =
        `Feels like ${formatTemperature(currentWeather.apparent_temperature)}`;

    humidity.textContent =
        `${currentWeather.relative_humidity_2m}%`;

    wind.textContent =
        `${Math.round(currentWeather.wind_speed_10m)} km/h`;

    weatherIcon.textContent = info[1];
    weatherDescription.textContent = info[0];

    if (currentWeather.time) {
        const date = new Date(currentWeather.time);
        currentDate.textContent = date.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }
}

// Display hourly forecast
function displayHourly() {
    hourlyContainer.innerHTML = "";

    if (!hourlyWeather || !hourlyWeather.time) {
        hourlyContainer.textContent = "Hourly forecast unavailable.";
        return;
    }

    const currentTime = currentWeather?.time;
    const today = currentTime ? currentTime.slice(0, 10) : "";
    const currentHour = currentTime
        ? Number(currentTime.slice(11, 13))
        : 0;

    let startIndex = hourlyWeather.time.findIndex(time =>
        time >= currentTime
    );

    if (startIndex < 0) startIndex = 0;

    const selectedHours = [];

    for (let i = startIndex; i < hourlyWeather.time.length; i++) {
        if (hourlyWeather.time[i].slice(0, 10) !== today) {
            break;
        }

        if (Number(hourlyWeather.time[i].slice(11, 13)) >= currentHour) {
            selectedHours.push(i);
        }

        if (selectedHours.length === 12) break;
    }

    if (selectedHours.length === 0) {
        hourlyContainer.textContent = "No hourly forecast available.";
        return;
    }

    selectedHours.forEach(i => {
        const info = getWeatherInfo(hourlyWeather.weather_code[i]);
        const time = formatTime(hourlyWeather.time[i]);
        const rainChance = hourlyWeather.precipitation_probability[i] ?? 0;

        const card = document.createElement("div");
        card.className = "hourly-card";

        card.innerHTML = `
            <h3>${time}</h3>
            <div class="hourly-icon">${info[1]}</div>
            <p class="hourly-temperature">
                ${formatTemperature(hourlyWeather.temperature_2m[i])}
            </p>
            <p>Rain: ${rainChance}%</p>
        `;

        hourlyContainer.appendChild(card);
    });
}

// Display seven-day forecast
function displayForecast() {
    forecastContainer.innerHTML = "";

    if (!dailyWeather || !dailyWeather.time) {
        forecastContainer.textContent = "Forecast unavailable.";
        return;
    }

    for (let i = 0; i < Math.min(7, dailyWeather.time.length); i++) {
        const info = getWeatherInfo(dailyWeather.weather_code[i]);

        const date = new Date(`${dailyWeather.time[i]}T12:00:00`);
        const day = i === 0
            ? "Today"
            : date.toLocaleDateString("en-US", { weekday: "short" });

        const card = document.createElement("div");
        card.className = "forecast-card";

        card.innerHTML = `
            <h3>${day}</h3>
            <div class="forecast-icon">${info[1]}</div>
            <p>${info[0]}</p>
            <p>Max: ${formatTemperature(dailyWeather.temperature_2m_max[i])}</p>
            <p>Min: ${formatTemperature(dailyWeather.temperature_2m_min[i])}</p>
        `;

        forecastContainer.appendChild(card);
    }
}

// Display sunrise and sunset
function displaySunTimes() {
    if (!dailyWeather) return;

    sunrise.textContent = formatTime(dailyWeather.sunrise?.[0]);
    sunset.textContent = formatTime(dailyWeather.sunset?.[0]);
}

// Air quality descriptions
function getAQIInfo(value) {
    if (value <= 50) return ["Good", "good"];
    if (value <= 100) return ["Moderate", "moderate"];
    if (value <= 150) return ["Unhealthy for sensitive groups", "unhealthy"];
    if (value <= 200) return ["Unhealthy", "unhealthy"];
    if (value <= 300) return ["Very unhealthy", "danger"];
    return ["Hazardous", "danger"];
}

// Display air quality
function displayAirQuality() {
    if (!currentAirQuality || currentAirQuality.us_aqi == null) {
        aqi.textContent = "--";
        aqiDescription.textContent = "Air quality unavailable";
        return;
    }

    const value = Math.round(currentAirQuality.us_aqi);
    const info = getAQIInfo(value);

    aqi.textContent = value;
    aqiDescription.textContent = info[0];
}

// Generate condition-based weather advisories
function displayAdvisories() {
    alertsContainer.innerHTML = "";

    if (!currentWeather || !hourlyWeather) {
        alertsContainer.textContent = "Weather advisories unavailable.";
        return;
    }

    const alerts = [];

    const code = currentWeather.weather_code;
    const windSpeed = currentWeather.wind_speed_10m;

    const currentTime = currentWeather.time;
    let hourIndex = hourlyWeather.time.findIndex(time =>
        time >= currentTime
    );

    if (hourIndex < 0) hourIndex = 0;

    const rainChance =
        hourlyWeather.precipitation_probability[hourIndex] ?? 0;

    if ([95, 96, 99].includes(code)) {
        alerts.push({
            type: "danger",
            title: "Thunderstorm conditions",
            description: "Thunderstorm conditions are reported. Consider staying indoors and avoiding exposed areas."
        });
    }

    if (rainChance >= 70) {
        alerts.push({
            type: "warning",
            title: "High chance of rain",
            description: `Rain probability is around ${rainChance}%. Consider carrying an umbrella.`
        });
    }

    if (windSpeed >= 50) {
        alerts.push({
            type: "warning",
            title: "Strong winds",
            description: `Wind speed is around ${Math.round(windSpeed)} km/h. Take care around trees and loose objects.`
        });
    }

    if (currentAirQuality && currentAirQuality.us_aqi >= 151) {
        alerts.push({
            type: "warning",
            title: "Poor air quality",
            description: "Air quality is unhealthy. Sensitive people should consider limiting prolonged outdoor activity."
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            type: "good",
            title: "No major weather advisory",
            description: "No conditions meeting this page's advisory thresholds were detected in the available data."
        });
    }

    alerts.forEach(alert => {
        const card = document.createElement("div");
        card.className = `alert-card ${alert.type}`;

        const heading = document.createElement("h3");
        heading.textContent = alert.title;

        const description = document.createElement("p");
        description.textContent = alert.description;

        card.appendChild(heading);
        card.appendChild(description);
        alertsContainer.appendChild(card);
    });
}

// Refresh temperatures after switching units
function updateTemperatureDisplays() {
    displayCurrentWeather();
    displayHourly();
    displayForecast();

    celsiusBtn.classList.toggle("active", selectedUnit === "C");
    fahrenheitBtn.classList.toggle("active", selectedUnit === "F");
}

celsiusBtn.addEventListener("click", () => {
    selectedUnit = "C";
    updateTemperatureDisplays();
});

fahrenheitBtn.addEventListener("click", () => {
    selectedUnit = "F";
    updateTemperatureDisplays();
});

// Load weather using coordinates
async function loadWeather(latitude, longitude, placeName = "Your location") {
    searchBtn.disabled = true;
    locationBtn.disabled = true;
    searchBtn.textContent = "Loading...";
    showMessage("Getting weather information...");

    hourlyContainer.innerHTML = "<p class='muted'>Loading hourly forecast...</p>";
    forecastContainer.innerHTML = "<p class='muted'>Loading seven-day forecast...</p>";
    alertsContainer.innerHTML = "<p class='muted'>Checking conditions...</p>";

    try {
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
            `&hourly=temperature_2m,weather_code,precipitation_probability` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto&forecast_days=7`;

        const airURL =
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
            `&current=us_aqi,european_aqi,pm2_5,pm10&timezone=auto`;

        const [weatherResponse, airResponse] = await Promise.all([
            fetch(weatherURL),
            fetch(airURL)
        ]);

        if (!weatherResponse.ok) {
            throw new Error("Could not retrieve weather information. Please try again.");
        }

        const weatherData = await weatherResponse.json();

        if (!weatherData.current || !weatherData.hourly || !weatherData.daily) {
            throw new Error("Weather information is incomplete.");
        }

        currentWeather = weatherData.current;
        hourlyWeather = weatherData.hourly;
        dailyWeather = weatherData.daily;
        currentTimezone = weatherData.timezone || "auto";

        if (airResponse.ok) {
            const airData = await airResponse.json();
            currentAirQuality = airData.current || null;
        } else {
            currentAirQuality = null;
        }

        cityName.textContent = placeName;
        updateTemperatureDisplays();
        displaySunTimes();
        displayAirQuality();
        displayAdvisories();

        showMessage("");
    } catch (error) {
        showMessage(error.message);
        hourlyContainer.textContent = "Hourly forecast unavailable.";
        forecastContainer.textContent = "Seven-day forecast unavailable.";
        alertsContainer.textContent = "Weather advisories unavailable.";
    } finally {
        searchBtn.disabled = false;
        locationBtn.disabled = false;
        searchBtn.textContent = "Search";
    }
}

// Search for a city
async function getWeatherByCity(city) {
    showMessage("Searching for city...");

    try {
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const response = await fetch(geoURL);

        if (!response.ok) {
            throw new Error("City search service is unavailable.");
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            throw new Error("City not found. Check the spelling and try again.");
        }

        const location = data.results[0];
        const placeName = `${location.name}, ${location.country}`;

        await loadWeather(location.latitude, location.longitude, placeName);
    } catch (error) {
        showMessage(error.message);
    }
}

// Search form
searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (city) {
        getWeatherByCity(city);
    }
});

// Use current device location
locationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showMessage("Location detection is not supported by this browser.");
        return;
    }

    locationBtn.disabled = true;
    showMessage("Requesting your location...");

    navigator.geolocation.getCurrentPosition(
        position => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            loadWeather(latitude, longitude, "Your current location");
        },
        error => {
            locationBtn.disabled = false;

            if (error.code === error.PERMISSION_DENIED) {
                showMessage("Location permission was denied. Allow location access in your browser settings.");
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                showMessage("Your location could not be determined.");
            } else {
                showMessage("Location request timed out. Please try again.");
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000
        }
    );
});

// Start with Kigali
getWeatherByCity("Kigali");
