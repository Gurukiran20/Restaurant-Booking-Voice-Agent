# Restaurant Booking Voice Agent

An intelligent **voice-enabled restaurant booking system** built using **MERN + Web Speech API + Weather API**.  
This project was developed as part of the **Vaiu AI Software Developer Internship Assignment**.

The agent collects booking details through **natural voice conversation**, fetches **real-time weather**, and stores confirmed bookings in a **MongoDB** database. 
A modern dashboard allows viewing all bookings in one place.

---

##  Features

## User Interface 

<img width="1885" height="854" alt="image" src="https://github.com/user-attachments/assets/b3d075a1-9d23-4758-8fe9-91df4ea2ac61" />


## Booking Summary

<img width="530" height="345" alt="image" src="https://github.com/user-attachments/assets/79288dc1-c4e2-48a5-b2af-9eefd68c1585" />

## Admin Dashboard

<img width="1689" height="737" alt="image" src="https://github.com/user-attachments/assets/3b255ee4-3319-45dc-91bf-1b79f48799ca" />

## contact Us page 

<img width="1561" height="382" alt="image" src="https://github.com/user-attachments/assets/b4877e11-8bfb-4579-a7f9-1a00c1d3dd85" />


### 🎙 Voice Interaction  
- Completely hands-free restaurant booking  
- Speech-to-Text using **Web Speech API**  
- Text-to-Speech responses  
- Automatically fills form fields from users’ voice  

###  Weather Integration (OpenWeather API)  
- Fetches real-time weather for selected city & date  
- Suggests **Indoor / Outdoor** seating based on weather  
  - Rain → Indoor  
  - Clear sky → Outdoor  
  - Cloudy → Depends on temp  

###  Booking Management  
- Create booking (voice/manual)  
- Auto-generate booking ID  
- Stores all bookings in MongoDB  
- Summarizes booking details after creation  

###  Admin Dashboard  
- View all bookings in table format  
- Includes: name, date, time, cuisine, seating, weather, location  

###  Tech Stack  
#### Frontend  
- React.js  
- Web Speech API  
- Modern UI (Custom CSS)

#### Backend  
- Node.js  
- Express.js  
- MongoDB  
- OpenWeatherMap API

---

## Project Structure

<img width="666" height="710" alt="image" src="https://github.com/user-attachments/assets/0f4c7a06-5b32-4be6-9f7f-66ce15cbe72c" />

---

### backend setup

cd backend

npm install

npm run dev (to run backend)

#### Create .env file inside backend:

MONGO_URI=your_mongodb_connection_string

WEATHER_API_KEY=your_openweather_api_key

PORT=5000

OPENAI_API_KEY=your openAI_API_key 


### Frontend setup

cd ../frontend

npm install

npm start

---

#### Weather API

This project uses OpenWeatherMap 5-Day Forecast API

https://openweathermap.org/api

Used for: Fetching temperature, Weather description, Suggesting indoor/outdoor seating


#### API Endpoints

POST /api/bookings

Create a new booking

GET /api/bookings

Fetch all bookings

GET /api/bookings/:id

Fetch specific booking

DELETE /api/bookings/:id

Cancel a booking
