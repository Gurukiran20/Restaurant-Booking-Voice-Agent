/* const axios = require('axios');

const getWeatherForDate = async (date, location) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const city = location || process.env.WEATHER_DEFAULT_CITY || 'Bangalore,IN';

  if (!apiKey) {
    throw new Error('WEATHER_API_KEY is not set');
  }

  // OpenWeather 5-day / 3-hour forecast
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  const response = await axios.get(url);
  const list = response.data.list || [];

  const targetDate = new Date(date).toISOString().split('T')[0];

  // find closest forecast entry for the given date
  let bestMatch = list.find((item) => item.dt_txt.startsWith(targetDate));

  if (!bestMatch) {
    // fallback: use first entry
    bestMatch = list[0];
  }

  const condition = bestMatch.weather[0].main.toLowerCase(); // clear, rain, clouds, etc.
  const description = bestMatch.weather[0].description;
  const temp = bestMatch.main.temp;

  let seatingSuggestion = 'indoor';
  let voiceSuggestion = `The weather looks okay on that day. Indoor seating is available.`;

  if (condition.includes('rain') || condition.includes('storm') || condition.includes('snow')) {
    seatingSuggestion = 'indoor';
    voiceSuggestion = `It might rain on that day. I'd recommend our cozy indoor area.`;
  } else {
    seatingSuggestion = 'outdoor';
    voiceSuggestion = `The weather looks great on that day! Would you prefer outdoor seating?`;
  }

  return {
    condition,
    description,
    temperature: temp,
    seatingSuggestion,
    voiceSuggestion,
    raw: {
      dt_txt: bestMatch.dt_txt,
    },
  };
};

module.exports = { getWeatherForDate }; */


const axios = require('axios');

const getWeatherForDate = async (date, location) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const city = location || process.env.WEATHER_DEFAULT_CITY || 'Bangalore,IN';

  if (!apiKey) {
    throw new Error('WEATHER_API_KEY is not set');
  }

  // 5-day / 3-hour forecast
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  const response = await axios.get(url);
  const list = response.data.list || [];

  const targetDate = new Date(date).toISOString().split('T')[0];

  // pick the first forecast item for that date (or fall back to first item)
  let bestMatch = list.find((item) => item.dt_txt.startsWith(targetDate));
  if (!bestMatch) {
    bestMatch = list[0];
  }

  const owMain = bestMatch.weather[0].main.toLowerCase(); // e.g. "clear", "rain", "clouds"
  const description = bestMatch.weather[0].description;   // e.g. "light rain"
  const temp = bestMatch.main.temp;                       // °C

  // Map OpenWeather condition → simple category
  let conditionCategory = 'sunny';
  if (
    owMain.includes('rain') ||
    owMain.includes('drizzle') ||
    owMain.includes('thunder')
  ) {
    conditionCategory = 'rainy';
  } else if (owMain.includes('snow')) {
    conditionCategory = 'snowy';
  } else if (owMain.includes('cloud')) {
    conditionCategory = 'cloudy';
  } else if (owMain.includes('clear')) {
    conditionCategory = 'sunny';
  }

  // Decide seating + voice suggestion
  let seatingSuggestion = 'indoor';
  let voiceSuggestion =
    'The weather looks okay on that day. Indoor seating is available.';

  if (conditionCategory === 'rainy' || conditionCategory === 'snowy') {
    seatingSuggestion = 'indoor';
    voiceSuggestion =
      "It might rain on that day. I'd recommend our cozy indoor area.";
  } else if (conditionCategory === 'sunny') {
    seatingSuggestion = 'outdoor';
    voiceSuggestion =
      'The weather looks great on that day! Would you prefer outdoor seating?';
  } else if (conditionCategory === 'cloudy') {
    // cloudy → soft suggestion, still okay for outdoor
    seatingSuggestion = 'outdoor';
    voiceSuggestion =
      'It looks partly cloudy on that day, but still good for outdoor dining if you like.';
  }

  return {
    // high-level category for UI / logic
    condition: conditionCategory,         // "sunny" / "rainy" / "cloudy" / "snowy"
    rawCondition: owMain,                 // original OpenWeather "clear" / "clouds" / "rain" ...
    description,                          // e.g. "light rain"
    temperature: temp,                    // °C
    seatingSuggestion,                    // "indoor" | "outdoor"
    voiceSuggestion,
    raw: {
      dt_txt: bestMatch.dt_txt,
    },
  };
};

module.exports = { getWeatherForDate };
