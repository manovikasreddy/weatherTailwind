# 🌤️ WeatherDrift — React + Tailwind CSS Weather App

A beautiful animated weather app — search **any city, town or village worldwide**.  
Powered by **Open-Meteo API** (free, no API key needed).

---

## 🚀 Full Setup from Scratch

### Step 1 — Unzip & enter the folder
```bash
unzip weather-app.zip
cd weather-app
```

### Step 2 — Install all npm packages
```bash
npm install
```

### Step 3 — Install Tailwind CSS + PostCSS + Autoprefixer
```bash
npm install -D tailwindcss postcss autoprefixer
```

### Step 4 — Initialize Tailwind (skip if files already exist)
```bash
npx tailwindcss init -p
```

### Step 5 — Run the dev server
```bash
npm run dev
```

Open: **http://localhost:5173**

---

## ⚡ One-liner install
```bash
npm install && npm install -D tailwindcss postcss autoprefixer
```
Then:
```bash
npm run dev
```

---

## 🛠️ Or use the setup script
```bash
bash setup.sh
npm run dev
```

---

## ✅ Files already pre-configured

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Content paths + custom fonts & animations |
| `postcss.config.js`  | PostCSS with Tailwind + Autoprefixer |
| `src/index.css`      | @tailwind base/components/utilities |
| `vite.config.js`     | Vite + React plugin |

---

## 🌍 Features
- Search any city, town or village worldwide
- Real-time weather (temp, humidity, wind, UV, pressure)
- Dynamic backgrounds per weather condition
- 12-hour + 7-day forecast
- °C / °F toggle
- Glassmorphism UI + smooth animations

---

## 📁 Structure
```
weather-app/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── setup.sh
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```
