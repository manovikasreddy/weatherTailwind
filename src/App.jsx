import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Weather condition map from WMO codes ─────────────────────────────────────
function getConditionFromCode(code, isDay = 1) {
  if (code === 0) return isDay ? 'sunny' : 'night'
  if ([1, 2].includes(code)) return 'partly_cloudy'
  if (code === 3) return 'cloudy'
  if ([45, 48].includes(code)) return 'foggy'
  if ([51, 53, 55, 61, 63, 80, 81].includes(code)) return 'rainy'
  if ([65, 82].includes(code)) return 'heavy_rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snowy'
  if ([95, 96, 99].includes(code)) return 'stormy'
  return isDay ? 'sunny' : 'night'
}

const WEATHER_CONDITIONS = {
  sunny: { label: 'Sunny', emoji: '☀️', bg: 'from-amber-400 via-orange-400 to-rose-400', orb1: 'bg-yellow-300', orb2: 'bg-orange-400' },
  partly_cloudy: { label: 'Partly Cloudy', emoji: '⛅', bg: 'from-sky-400 via-blue-400 to-indigo-400', orb1: 'bg-sky-300', orb2: 'bg-indigo-300' },
  cloudy: { label: 'Cloudy', emoji: '☁️', bg: 'from-slate-500 via-slate-400 to-slate-600', orb1: 'bg-slate-300', orb2: 'bg-slate-500' },
  rainy: { label: 'Rainy', emoji: '🌧️', bg: 'from-blue-700 via-blue-500 to-cyan-600', orb1: 'bg-blue-400', orb2: 'bg-cyan-400' },
  heavy_rain: { label: 'Heavy Rain', emoji: '🌊', bg: 'from-blue-900 via-blue-700 to-cyan-700', orb1: 'bg-blue-500', orb2: 'bg-cyan-500' },
  stormy: { label: 'Stormy', emoji: '⛈️', bg: 'from-gray-800 via-slate-700 to-purple-900', orb1: 'bg-purple-500', orb2: 'bg-slate-400' },
  snowy: { label: 'Snowy', emoji: '❄️', bg: 'from-sky-200 via-blue-200 to-indigo-300', orb1: 'bg-sky-300', orb2: 'bg-indigo-200' },
  foggy: { label: 'Foggy', emoji: '🌫️', bg: 'from-gray-400 via-gray-300 to-stone-400', orb1: 'bg-gray-300', orb2: 'bg-stone-300' },
  night: { label: 'Clear Night', emoji: '🌙', bg: 'from-indigo-900 via-blue-900 to-slate-900', orb1: 'bg-indigo-500', orb2: 'bg-blue-600' },
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function StatCard({ label, value, unit, icon }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1 hover:bg-white/15 transition-all duration-300 hover:scale-105">
      <div className="text-2xl">{icon}</div>
      <div className="text-white/60 text-xs font-body uppercase tracking-widest">{label}</div>
      <div className="text-white font-display font-bold text-xl">
        {value}<span className="text-sm font-body font-normal text-white/70 ml-1">{unit}</span>
      </div>
    </div>
  )
}

function HourlyCard({ hour, temp, condition }) {
  const cond = WEATHER_CONDITIONS[condition] || WEATHER_CONDITIONS.sunny
  return (
    <div className="glass-card flex flex-col items-center gap-2 px-4 py-3 min-w-[72px] hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-default">
      <span className="text-white/60 text-xs font-body">{hour}</span>
      <span className="text-xl">{cond.emoji}</span>
      <span className="text-white font-semibold text-sm">{temp}°</span>
    </div>
  )
}

function ForecastRow({ day, high, low, condition }) {
  const cond = WEATHER_CONDITIONS[condition] || WEATHER_CONDITIONS.sunny
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-white/10 transition-all duration-200 group">
      <span className="text-white/80 font-body w-16 text-sm">{day}</span>
      <span className="text-xl group-hover:scale-110 transition-transform duration-200">{cond.emoji}</span>
      <div className="flex items-center gap-3 text-sm font-body">
        <span className="text-white/50">{low}°</span>
        <div className="w-16 h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-300 to-orange-300"
            style={{ width: `${Math.min(100, Math.max(10, ((high - low) / 30) * 100))}%` }} />
        </div>
        <span className="text-white font-semibold">{high}°</span>
      </div>
    </div>
  )
}

export default function App() {
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [sugLoading, setSugLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [unit, setUnit] = useState('C')
  const [animKey, setAnimKey] = useState(0)
  const debounceRef = useRef(null)

  const toF = (c) => Math.round(c * 9 / 5 + 32)
  const displayTemp = (c) => unit === 'C' ? Math.round(c) : toF(c)

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); return }
    setSugLoading(true)
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
      )
      const data = await res.json()
      setSuggestions(data.results || [])
    } catch {
      setSuggestions([])
    } finally {
      setSugLoading(false)
    }
  }, [])

  const fetchWeather = useCallback(async (lat, lon, cityName, country, admin1) => {
    setLoading(true)
    setError(null)
    setAnimKey(k => k + 1)
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,uv_index,is_day` +
        `&hourly=temperature_2m,weather_code` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=7`

      const res = await fetch(url)
      const data = await res.json()
      const c = data.current
      const condition = getConditionFromCode(c.weather_code, c.is_day)

      const nowIdx = Math.max(0, data.hourly.time.findIndex(t => t >= data.current.time.slice(0, 13)))
      const hourlySlice = data.hourly.time.slice(nowIdx, nowIdx + 12).map((t, i) => ({
        label: i === 0 ? 'Now' : new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        temp: data.hourly.temperature_2m[nowIdx + i],
        condition: getConditionFromCode(data.hourly.weather_code[nowIdx + i], 1),
      }))

      const forecast = data.daily.time.map((t, i) => {
        const d = new Date(t + 'T00:00:00')
        return {
          day: i === 0 ? 'Today' : DAYS[d.getDay()],
          high: data.daily.temperature_2m_max[i],
          low: data.daily.temperature_2m_min[i],
          condition: getConditionFromCode(data.daily.weather_code[i], 1),
        }
      })

      setWeather({ city: cityName, country, region: admin1, temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m, wind: c.wind_speed_10m, pressure: Math.round(c.surface_pressure), uv: c.uv_index ?? '—', condition, hourly: hourlySlice, forecast })
    } catch {
      setError('Failed to load weather. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchWeather(17.385, 78.4867, 'Hyderabad', 'India', 'Telangana') }, [fetchWeather])

  const handleSearch = (e) => {
    const val = e.target.value
    setSearch(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current)
      if (suggestions.length > 0) {
        // Pick first suggestion immediately
        selectCity(suggestions[0])
      } else if (search.trim().length > 1) {
        // Fetch and auto-pick first result
        setSugLoading(true)
        try {
          const res = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(search.trim())}&count=1&language=en&format=json`
          )
          const data = await res.json()
          if (data.results && data.results.length > 0) {
            selectCity(data.results[0])
          } else {
            setSuggestions([])
          }
        } catch {
          setSuggestions([])
        } finally {
          setSugLoading(false)
        }
      }
    }
  }

  const selectCity = (place) => {
    setSearch('')
    setSuggestions([])
    fetchWeather(place.latitude, place.longitude, place.name, place.country, place.admin1)
  }

  const cond = weather ? (WEATHER_CONDITIONS[weather.condition] || WEATHER_CONDITIONS.sunny) : WEATHER_CONDITIONS.sunny

  return (
    <div className={`min-h-screen bg-gradient-to-br ${cond.bg} transition-all duration-1000 relative`}>
      <div className={`orb w-96 h-96 ${cond.orb1} top-[-100px] left-[-100px]`} />
      <div className={`orb w-72 h-72 ${cond.orb2} bottom-[-80px] right-[-80px]`} style={{ animationDelay: '3s' }} />
      <div className="orb w-48 h-48 bg-white/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '1.5s' }} />
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 min-h-screen flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="font-display text-white text-3xl font-black tracking-tight gradient-text">WeatherDrift</h1>
            <p className="text-white/50 text-xs font-body mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
            className="glass-card px-4 py-2 text-white font-semibold text-sm hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer">
            Switch to °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>

        {/* Search */}
        <div className="relative animate-slide-up z-40" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="glass-card flex items-center gap-3 px-5 py-3.5">
            <span className="text-white/60 text-lg">{sugLoading ? '⏳' : '🔍'}</span>
            <input value={search} onChange={handleSearch} onKeyDown={handleKeyDown}
              placeholder="Type city & press Enter, or click a suggestion..."
              className="bg-transparent flex-1 text-white placeholder-white/40 outline-none font-body text-sm" />
            {search && (
              <button onClick={() => { setSearch(''); setSuggestions([]) }}
                className="text-white/40 hover:text-white transition-colors text-lg cursor-pointer">✕</button>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full glass-card-dark overflow-hidden z-[999] shadow-2xl border border-white/20">
              <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-white/40 text-xs font-body">Click a city or press Enter for top result</span>
                <span className="text-white/30 text-xs bg-white/10 px-2 py-0.5 rounded">↵ Enter</span>
              </div>
              {suggestions.map((place, i) => (
                <button key={i} onClick={() => selectCity(place)}
                  className={`w-full text-left px-5 py-3.5 hover:bg-white/15 font-body transition-all duration-150 cursor-pointer flex items-start gap-3 border-b border-white/5 last:border-0 ${i === 0 ? "bg-white/10" : ""}`}>
                  <span className="mt-0.5 text-sm">{i === 0 ? "⭐" : "📍"}</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-semibold flex items-center gap-2">
                      {place.name}
                      {i === 0 && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/60">Best match</span>}
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">
                      {[place.admin1, place.country].filter(Boolean).join(', ')}
                      {place.population ? ` • Pop. ${place.population.toLocaleString()}` : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {search.length > 2 && !sugLoading && suggestions.length === 0 && (
            <div className="absolute top-full mt-2 w-full glass-card-dark px-5 py-4 z-[999]">
              <p className="text-white/50 text-sm font-body">No places found for "{search}". Try a different spelling.</p>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {!suggestions.length && loading && (
          <div className="glass-card p-8 flex flex-col gap-4">
            <div className="shimmer h-5 w-40 rounded-xl" />
            <div className="shimmer h-24 w-32 rounded-2xl" />
            <div className="shimmer h-5 w-48 rounded-xl" />
            <div className="grid grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
          </div>
        )}

        {/* Error */}
        {!suggestions.length && !loading && error && (
          <div className="glass-card p-8 flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">🔍</div>
            <div className="text-white font-display text-xl font-bold">Something went wrong</div>
            <div className="text-white/60 font-body text-sm max-w-xs">{error}</div>
            <button onClick={() => fetchWeather(17.385, 78.4867, 'Hyderabad', 'India', 'Telangana')}
              className="glass-card px-6 py-2.5 text-white text-sm font-semibold hover:bg-white/20 cursor-pointer">
              Go to Hyderabad
            </button>
          </div>
        )}

        {/* Main card */}
        {!suggestions.length && !loading && !error && weather && (
          <div key={animKey} className="glass-card p-6 flex flex-col gap-5 animate-slide-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-white/60 text-sm">📍</span>
                  <span className="text-white font-body font-semibold">{weather.city}</span>
                  {weather.region && <span className="text-white/50 text-sm font-body">{weather.region},</span>}
                  <span className="text-white/50 text-sm font-body">{weather.country}</span>
                </div>
                <div className="font-display text-8xl font-black text-white mt-1 count-anim leading-none">{displayTemp(weather.temp)}°</div>
                <div className="text-white/80 font-body mt-1 text-base">{cond.label}</div>
                <div className="text-white/50 font-body text-sm mt-0.5">Feels like {displayTemp(weather.feels)}°</div>
              </div>
              <div className="text-7xl animate-float">{cond.emoji}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Humidity" value={weather.humidity} unit="%" icon="💧" />
              <StatCard label="Wind" value={Math.round(weather.wind)} unit="km/h" icon="🌬️" />
              <StatCard label="UV Index" value={weather.uv} unit="" icon="🔆" />
              <StatCard label="Pressure" value={weather.pressure} unit="hPa" icon="🧭" />
            </div>
          </div>
        )}

        {/* Hourly */}
        {!suggestions.length && !loading && !error && weather?.hourly && (
          <div className="animate-slide-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
            <div className="text-white/60 text-xs font-body uppercase tracking-widest mb-3 px-1">Next 12 Hours</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weather.hourly.map((h, i) => <HourlyCard key={i} hour={h.label} temp={displayTemp(h.temp)} condition={h.condition} />)}
            </div>
          </div>
        )}

        {/* 7-day */}
        {!suggestions.length && !loading && !error && weather?.forecast && (
          <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="text-white/60 text-xs font-body uppercase tracking-widest mb-3 px-1">7-Day Forecast</div>
            <div className="flex flex-col divide-y divide-white/10">
              {weather.forecast.map((f, i) => <ForecastRow key={i} day={f.day} condition={f.condition} high={displayTemp(f.high)} low={displayTemp(f.low)} />)}
            </div>
          </div>
        )}

        {/* Quick cities */}
        {!suggestions.length && !loading && (
          <div className="animate-slide-up" style={{ animationDelay: '0.25s', opacity: 0 }}>
            <div className="text-white/60 text-xs font-body uppercase tracking-widest mb-3 px-1">Quick Cities</div>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Hyderabad', lat: 17.385, lon: 78.4867, country: 'India', admin1: 'Telangana' },
                { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India', admin1: 'Maharashtra' },
                { name: 'Delhi', lat: 28.6139, lon: 77.2090, country: 'India', admin1: 'Delhi' },
                { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', admin1: 'England' },
                { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'USA', admin1: 'New York' },
                { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', admin1: 'Tokyo' },
                { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', admin1: 'Dubai' },
                { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'Australia', admin1: 'NSW' },
              ].map(c => (
                <button key={c.name} onClick={() => fetchWeather(c.lat, c.lon, c.name, c.country, c.admin1)}
                  className={`glass-card px-4 py-2 text-sm font-body transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer
                    ${weather?.city === c.name ? 'bg-white/25 text-white font-semibold' : 'text-white/70 hover:bg-white/15 hover:text-white'}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-center text-white/30 text-xs font-body mt-auto pb-2">
          WeatherDrift • Powered by Open-Meteo API • Any city worldwide 🌍
        </div>
      </div>
    </div>
  )
}
