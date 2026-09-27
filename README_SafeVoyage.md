# 🛡️ SafeVoyage

### Intelligent Travel Safety & Itinerary-Aware Risk Monitoring

> **SafeVoyage turns travel advisories, weather signals, itinerary data, and traveller context into actionable safety information.**

SafeVoyage is a full-stack travel-safety platform designed to help travellers understand risks **before and during a journey**. Instead of showing generic destination warnings, the system correlates safety advisories with the traveller's **specific itinerary, location, date, and time window**.

The project combines a React frontend, Node.js/Express backend, MongoDB persistence, live weather and routing integrations, AI-assisted safety explanations, interactive maps, emergency SOS workflows, and SMS notification support.

---

## ✨ Why SafeVoyage?

Most travel applications answer:

> **"Is this destination safe?"**

SafeVoyage is designed to answer a more useful question:

> **"Is my planned activity safe at this location, on this date, and at this time?"**

### Example

If a traveller has:

`Day 2 → 3:00 PM → Marina Beach`

and the system has an active coastal advisory affecting Marina Beach during that time, SafeVoyage can mark that itinerary activity as **AFFECTED** and surface the relevant reason and recommendation.

This itinerary-aware correlation is the core engineering idea behind the project.

---

## 🚀 Key Features

| Feature | What it does |
|---|---|
| 🧭 **Itinerary Risk Matching** | Correlates advisories with planned activities using location, category, date and time |
| 📊 **Trip Risk Engine** | Produces a transparent 0–100 composite risk score |
| 🌦️ **Live Weather** | Retrieves current weather information through OpenWeather integration |
| 🗺️ **Safety Map** | Displays safety zones, risk areas, hospitals, police stations and shelters |
| 🚨 **Safety Alerts** | Converts advisory data into clear, traveller-focused warnings |
| 🤖 **AI Safety Assistant** | Uses configured AI providers to explain travel-safety information using application context |
| 🆘 **Emergency SOS** | Provides an emergency workflow with location-sharing support |
| 📱 **SMS Alerts** | Supports Fast2SMS and optional Twilio integration |
| 👨‍👩‍👧‍👦 **Traveller Management** | Supports multiple travellers and vulnerability-aware risk considerations |
| 🗓️ **Multi-Day Itinerary** | Organizes activities by day, time, place and category |
| 🔐 **Authentication** | User registration, login and JWT-based session handling |
| 🗄️ **MongoDB Persistence** | Stores authenticated user application data |
| 🌙 **Dark/Light Theme** | Responsive application experience with theme switching |

---

## 🧠 Core Engineering Concept

The most important component is the **itinerary-aware safety correlation layer**.

Conceptually:

```text
Travel Plan
    │
    ├── Destination
    ├── Activity
    ├── Location
    ├── Date
    └── Time
          │
          ▼
Safety Signals
    │
    ├── Active Advisories
    ├── Weather
    ├── Risk Zones
    └── Traveller Context
          │
          ▼
┌──────────────────────────────┐
│   Safety Correlation Engine  │
│                              │
│ Location Match               │
│ Category Match               │
│ Date Match                   │
│ Time Window Match            │
└──────────────────────────────┘
          │
          ▼
     Risk Assessment
          │
     ┌────┴────┐
     ▼         ▼
  CLEAR     AFFECTED
              │
              ▼
       Alert + Recommendation
```

The system is designed so that AI does not replace the deterministic safety logic. The AI layer receives application context and helps explain it in a user-friendly way.

---

## 📊 Risk Scoring Model

SafeVoyage uses a transparent composite model rather than presenting an unexplained AI-generated score.

### Current model

```text
Weather Risk       → 0–25
Health Risk        → 0–25
Safety Risk        → 0–25
Advisory Risk      → 0–25
                    ─────
Maximum            → 100
```

Risk levels:

```text
0–30    LOW
31–60   MODERATE
61–80   HIGH
81–100  CRITICAL
```

The implementation is intentionally inspectable in:

```text
frontend/src/utils/riskEngine.js
```

This makes the scoring logic easier to test, explain and improve.

---

## 🤖 AI Safety Assistant

SafeVoyage supports multiple AI providers through a unified backend service.

Supported integrations in the current codebase include:

- Groq
- Google Gemini
- OpenAI

The AI service is designed around **grounded application context**.

It can receive information such as:

- destination
- trip dates
- itinerary
- travellers
- active advisories
- affected activities
- weather
- risk assessment

The application explicitly instructs the AI layer to interpret available safety data rather than invent safety conditions.

Implementation:

```text
backend/services/aiService.js
```

---

## 🌦️ Live Data & External Integrations

### Weather

SafeVoyage can use OpenWeather to retrieve:

- temperature
- feels-like temperature
- weather condition
- humidity
- wind speed
- rainfall
- precipitation-related indicators

Implementation:

```text
backend/services/weatherService.js
```

### Routing

The backend supports Google Maps Routes API v2 for route calculation, with routing fallback logic in the service layer.

Implementation:

```text
backend/services/routesService.js
```

### SMS

Emergency and safety notifications support:

- Fast2SMS
- Twilio as an alternative provider
- demo/fallback notification behavior

Implementation:

```text
backend/services/smsService.js
```

---

## 🏗️ Architecture

```text
┌───────────────────────────────────────────┐
│                React + Vite               │
│                                           │
│ Dashboard • Maps • Alerts • AI • SOS     │
│ Itinerary • Weather • Profile • Settings │
└─────────────────────┬─────────────────────┘
                      │ REST API
                      ▼
┌───────────────────────────────────────────┐
│              Node.js + Express            │
│                                           │
│ Auth • Trips • Itinerary • Alerts        │
│ Weather • Routes • AI • Emergency        │
│ Contacts • Notifications • Profile       │
└───────────────┬───────────┬───────────────┘
                │           │
                ▼           ▼
        ┌────────────┐  ┌──────────────────┐
        │  MongoDB   │  │ External APIs    │
        │            │  │                  │
        │ User data  │  │ Weather          │
        │ Trips      │  │ Google Routes    │
        │ Itinerary  │  │ AI Providers     │
        │ Alerts     │  │ SMS Providers    │
        └────────────┘  └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

- React 18
- Vite
- React Router
- Leaflet
- Lucide React
- JavaScript / JSX
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- bcryptjs
- CORS
- dotenv
- REST APIs

### Integrations

- OpenWeather
- Google Maps Routes API
- Google Maps
- Groq
- Google Gemini
- OpenAI
- Fast2SMS
- Twilio

---

## 📁 Project Structure

```text
SafeVoyage/
├── backend/
│   ├── data/
│   │   ├── mongo.js
│   │   └── store.js
│   │
│   ├── routes/
│   │   ├── ai.js
│   │   ├── alerts.js
│   │   ├── auth.js
│   │   ├── contacts.js
│   │   ├── emergency.js
│   │   ├── itinerary.js
│   │   ├── notifications.js
│   │   ├── profile.js
│   │   ├── routes.js
│   │   ├── travellers.js
│   │   ├── trip.js
│   │   └── weather.js
│   │
│   ├── services/
│   │   ├── aiService.js
│   │   ├── routesService.js
│   │   ├── safetyService.js
│   │   ├── smsService.js
│   │   └── weatherService.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## ⚙️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/SafeVoyage.git
cd SafeVoyage
```

### 2. Start MongoDB

Make sure MongoDB is running locally.

The default development database configuration is:

```text
mongodb://localhost:27017/SafeVoyage
```

### 3. Configure backend environment

```bash
cd backend
copy .env.example .env
```

Then add your own API credentials to `.env`.

### 4. Install backend dependencies

```bash
npm install
```

### 5. Start backend

```bash
npm start
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

### 6. Start frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Environment Variables

Never commit real API keys or secrets.

### Backend `.env`

```env
PORT=5000

MONGODB_URI=mongodb://localhost:27017/SafeVoyage
MONGODB_DB_NAME=SafeVoyage

JWT_SECRET=your_secure_secret

OPENWEATHER_API_KEY=

GOOGLE_MAPS_API_KEY=

GROQ_API_KEY=
GEMINI_API_KEY=
OPENAI_API_KEY=

FAST2SMS_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Frontend `.env`

```env
VITE_GOOGLE_MAPS_API_KEY=
VITE_WEATHER_API_KEY=
VITE_GEMINI_API_KEY=
```

---

## 🧪 API Health Check

After starting the backend:

```http
GET /api/health
```

Example response:

```json
{
  "status": "online",
  "app": "SafeVoyage API",
  "demoReady": true,
  "version": "1.0.0"
}
```

---

## 🔌 Backend API Modules

| Module | Purpose |
|---|---|
| `/api/auth` | Registration and authentication |
| `/api/profile` | User profile operations |
| `/api/travellers` | Traveller management |
| `/api/trip` | Trip management |
| `/api/itinerary` | Itinerary activities |
| `/api/alerts` | Safety advisories and alerts |
| `/api/weather` | Weather information |
| `/api/notifications` | Notification workflows |
| `/api/emergency` | Emergency/SOS operations |
| `/api/contacts` | Emergency contacts |
| `/api/ai` | AI safety assistant |
| `/api/routes` | Route calculation |

---

## 🧩 Engineering Highlights

### 1. Separation of concerns

Frontend UI, API routes, business services and persistence logic are separated instead of placing everything inside a single component or server file.

### 2. Deterministic + AI architecture

Critical safety matching is handled by application logic. AI is used for contextual assistance and explanation.

### 3. Provider abstraction

External services are isolated into service modules, making it easier to replace or extend providers.

### 4. Persistent user data

MongoDB is used for authenticated user data rather than relying only on browser state.

### 5. Defensive API behavior

The application includes validation, API error handling, authentication checks and fallback behavior for unavailable integrations.

---

## 📸 Suggested Repository Screenshots

For a professional GitHub presentation, add screenshots/GIFs showing:

1. Landing page
2. Main risk dashboard
3. Itinerary risk matching
4. Safety map
5. Weather panel
6. AI assistant
7. Emergency SOS
8. Family/co-traveller management

Recommended structure:

```text
docs/
└── screenshots/
    ├── landing.png
    ├── dashboard.png
    ├── itinerary.png
    ├── safety-map.png
    ├── weather.png
    ├── ai-assistant.png
    └── emergency-sos.png
```

---

## 🎯 Product Direction

SafeVoyage can be extended toward:

- Real-time geofencing
- Push notifications
- Government advisory feeds
- More structured disaster/weather data
- Offline emergency information
- Multilingual safety alerts
- Route-level hazard detection
- Historical risk analytics
- Automated itinerary alternatives
- Production-grade role-based access
- Automated test coverage
- Observability and audit logging

---

## ⚠️ Current Project Status

**Status:** Functional full-stack prototype / hackathon project

The current repository demonstrates the complete application flow and integrations, but it should not be presented as a certified emergency-response or production safety system.

Risk scores and safety recommendations are application-level decision-support outputs and should not replace official emergency instructions.

---

## 👨‍💻 Built With

**React • Vite • Node.js • Express • MongoDB • Leaflet • REST APIs • AI APIs • Weather APIs • Maps APIs • SMS APIs**

---

## ⭐ If You Find This Project Interesting

Star the repository and explore the implementation.

For recruiters and engineering reviewers, the most relevant areas to inspect first are:

```text
frontend/src/utils/riskEngine.js
backend/services/aiService.js
backend/services/safetyService.js
backend/services/routesService.js
backend/services/weatherService.js
backend/services/smsService.js
backend/routes/
```

---

## 📄 License

Add a license before publishing the repository if you intend others to reuse or distribute the code.
