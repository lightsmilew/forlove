import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { loadAmap } from '../utils/amapLoader'

const USER_COLORS = ['#e8759a', '#6c9bcf']
const MEET_ICONS = { 武汉大学: '🌸', 湖北大学: '🏫' }
const MEET_LAYOUT = {
  武汉大学: { side: 'left', color: '#e8759a' },
  湖北大学: { side: 'right', color: '#6c9bcf' },
}
const DEFAULT_CENTER = [114.345, 30.556]

function groupTrajectories(locations) {
  const groups = {}
  for (const loc of locations) {
    if (loc.lat == null || loc.lng == null) continue
    if (!isValidWuhanCoord(loc.lat, loc.lng)) continue
    if (!groups[loc.username]) groups[loc.username] = []
    groups[loc.username].push(loc)
  }
  for (const username of Object.keys(groups)) {
    groups[username].sort(
      (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt)
    )
  }
  return groups
}

function isValidWuhanCoord(lat, lng) {
  return lat >= 29 && lat <= 32 && lng >= 113 && lng <= 116
}

function fitMeetPlaces(map, meetPlaces, AMap) {
  if (!meetPlaces?.length) {
    map.setCenter(DEFAULT_CENTER)
    map.setZoom(12)
    return
  }

  if (meetPlaces.length === 1) {
    map.setCenter([meetPlaces[0].lng, meetPlaces[0].lat])
    map.setZoom(14)
    return
  }

  const lngs = meetPlaces.map((p) => p.lng)
  const lats = meetPlaces.map((p) => p.lat)
  const sw = new AMap.LngLat(Math.min(...lngs), Math.min(...lats))
  const ne = new AMap.LngLat(Math.max(...lngs), Math.max(...lats))
  map.setBounds(new AMap.Bounds(sw, ne), false, [120, 120, 120, 120])
  if (map.getZoom() > 12) map.setZoom(12)
}

function fitAllPoints(map, meetPlaces, locations, AMap) {
  const points = meetPlaces.map((p) => [p.lng, p.lat])
  locations.forEach((loc) => {
    if (isValidWuhanCoord(loc.lat, loc.lng)) {
      points.push([loc.lng, loc.lat])
    }
  })

  if (points.length === 0) {
    fitMeetPlaces(map, meetPlaces, AMap)
    return
  }

  const lngs = points.map((p) => p[0])
  const lats = points.map((p) => p[1])
  const sw = new AMap.LngLat(Math.min(...lngs), Math.min(...lats))
  const ne = new AMap.LngLat(Math.max(...lngs), Math.max(...lats))
  map.setBounds(new AMap.Bounds(sw, ne), false, [100, 100, 100, 100])
}

export default function AmapView({ meetPlaces = [], locations = [], nicknames = {} }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const meetPlacesRef = useRef(meetPlaces)
  const locationsRef = useRef(locations)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [viewMode, setViewMode] = useState('campus')

  meetPlacesRef.current = meetPlaces
  locationsRef.current = locations

  const trajectories = useMemo(() => groupTrajectories(locations), [locations])
  const hasTrajectories = Object.keys(trajectories).length > 0

  const applyView = useCallback((mode) => {
    const map = mapRef.current
    if (!map || !window.AMap) return
    if (mode === 'all') {
      fitAllPoints(map, meetPlacesRef.current, locationsRef.current, window.AMap)
    } else {
      fitMeetPlaces(map, meetPlacesRef.current, window.AMap)
    }
    setViewMode(mode)
  }, [])

  useEffect(() => {
    const apiKey = import.meta.env.VITE_AMAP_KEY
    if (!apiKey) {
      setError('请在 frontend/.env 中配置 VITE_AMAP_KEY')
      return
    }

    let cancelled = false

    loadAmap(apiKey)
      .then((AMap) => {
        if (cancelled || !containerRef.current) return

        const map = new AMap.Map(containerRef.current, {
          zoom: 12,
          center: DEFAULT_CENTER,
          viewMode: '2D',
          mapStyle: 'amap://styles/whitesmoke',
        })

        AMap.plugin(['AMap.Scale', 'AMap.ToolBar'], () => {
          if (cancelled) return
          map.addControl(new AMap.Scale())
          map.addControl(new AMap.ToolBar({ position: 'RB' }))
          mapRef.current = map
          setReady(true)
          requestAnimationFrame(() => map.resize())
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || '地图加载失败')
      })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.destroy()
        mapRef.current = null
      }
      overlaysRef.current = []
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !window.AMap) return

    const AMap = window.AMap
    map.remove(overlaysRef.current)
    overlaysRef.current = []

    const overlays = []

    meetPlaces.forEach((place, index) => {
      const icon = MEET_ICONS[place.name] || '📍'
      const layout = MEET_LAYOUT[place.name] || { side: index % 2 === 0 ? 'left' : 'right', color: '#e8759a' }
      overlays.push(new AMap.Marker({
        position: [place.lng, place.lat],
        title: place.name,
        content: `<div class="amap-meet-pin amap-meet-pin--${layout.side}" style="--meet-color:${layout.color}">
          <span class="amap-meet-icon">${icon}</span>
          <em>${place.name}</em>
        </div>`,
        offset: new AMap.Pixel(-14, -14),
        zIndex: 200 + index,
      }))
    })

    if (meetPlaces.length > 1) {
      overlays.push(new AMap.Polyline({
        path: meetPlaces.map((p) => [p.lng, p.lat]),
        strokeColor: '#e8759a',
        strokeWeight: 2,
        strokeOpacity: 0.5,
        strokeStyle: 'dashed',
        zIndex: 10,
      }))
    }

    Object.keys(trajectories).forEach((username, index) => {
      const points = trajectories[username]
      const path = points.map((p) => [p.lng, p.lat])
      const color = USER_COLORS[index % USER_COLORS.length]
      const label = nicknames[username] || username

      if (path.length > 1) {
        overlays.push(new AMap.Polyline({
          path,
          strokeColor: color,
          strokeWeight: 5,
          strokeOpacity: 0.85,
          lineJoin: 'round',
          lineCap: 'round',
          showDir: true,
          zIndex: 50 + index,
        }))
      }

      points.forEach((p, i) => {
        if (i < points.length - 1) {
          overlays.push(new AMap.Circle({
            center: [p.lng, p.lat],
            radius: 30,
            strokeColor: '#fff',
            strokeWeight: 2,
            fillColor: color,
            fillOpacity: 0.9,
            zIndex: 60 + index,
          }))
        }
      })

      const latest = points[points.length - 1]
      overlays.push(new AMap.Marker({
        position: [latest.lng, latest.lat],
        title: label,
        content: `<div class="amap-user-pin" style="--pin-color:${color}">${label}</div>`,
        offset: new AMap.Pixel(-20, -44),
        zIndex: 100 + index,
      }))
    })

    map.add(overlays)
    overlaysRef.current = overlays
  }, [ready, meetPlaces, trajectories, nicknames])

  useEffect(() => {
    if (!ready || !mapRef.current || !meetPlaces.length) return
    requestAnimationFrame(() => {
      mapRef.current?.resize()
      applyView('campus')
    })
  }, [ready, meetPlaces, applyView])

  if (error) {
    return (
      <div className="amap-container amap-error">
        <p>{error}</p>
        <p className="amap-error-hint">
          前往 <a href="https://lbs.amap.com/" target="_blank" rel="noreferrer">高德开放平台</a>
          {' '}申请 Web 端 Key，写入 frontend/.env
        </p>
      </div>
    )
  }

  return (
    <div className="amap-wrapper">
      <div ref={containerRef} className="amap-container" />
      {ready && (
        <div className="amap-view-controls">
          <button
            type="button"
            className={`amap-view-btn${viewMode === 'campus' ? ' active' : ''}`}
            onClick={() => applyView('campus')}
          >
            查看校园
          </button>
          {hasTrajectories && (
            <button
              type="button"
              className={`amap-view-btn${viewMode === 'all' ? ' active' : ''}`}
              onClick={() => applyView('all')}
            >
              查看全部
            </button>
          )}
        </div>
      )}
      {ready && (
        <div className="amap-legend">
          {meetPlaces.map((place) => (
            <span key={place.name}>
              <i className="legend-meet" /> {place.name}
            </span>
          ))}
          {Object.keys(trajectories).map((username, i) => (
            <span key={username}>
              <i style={{ background: USER_COLORS[i % USER_COLORS.length] }} />
              {nicknames[username] || username} 轨迹
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
