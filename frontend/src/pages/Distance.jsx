import { useEffect, useState, useMemo } from 'react'
import Layout from '../components/Layout'
import AmapView from '../components/AmapView'
import { api } from '../api'

function geoErrorMessage(err, secure) {
  if (!secure) {
    return '浏览器要求 HTTPS 才能定位。请用 https://你的IP/ 访问，并信任自签名证书；或下方选择相遇地点上报。'
  }
  if (!err) return '无法获取位置，请允许定位权限'
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return '定位权限被拒绝，请在浏览器设置中允许此站点获取位置'
    case err.POSITION_UNAVAILABLE:
      return '暂时无法获取位置，请检查 GPS / 网络后重试'
    case err.TIMEOUT:
      return '定位超时，请重试'
    default:
      return '无法获取位置，请允许定位权限'
  }
}

export default function Distance() {
  const [distanceData, setDistanceData] = useState(null)
  const [locations, setLocations] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const secure = typeof window !== 'undefined' && window.isSecureContext

  const load = async () => {
    const [dist, locs, cfg] = await Promise.all([
      api.getDistance(),
      api.getLocations(),
      api.getConfig(),
    ])
    setDistanceData(dist)
    setLocations(locs)
    setConfig(cfg)
  }

  useEffect(() => { load() }, [])

  const nicknames = useMemo(() => {
    if (!config) return {}
    return {
      [config.username1 || 'ye']: config.nickname1,
      [config.username2 || 'jie']: config.nickname2,
    }
  }, [config])

  const meetPlaces = useMemo(() => {
    if (distanceData?.meetPlaces?.length) return distanceData.meetPlaces
    return config?.meetPlaces || []
  }, [distanceData, config])

  const reportCoords = async (lat, lng, placeName) => {
    setLoading(true)
    setError('')
    try {
      await api.recordLocation(lat, lng, placeName)
      await load()
    } catch {
      setError('上报失败')
    } finally {
      setLoading(false)
    }
  }

  const reportLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('浏览器不支持定位')
      return
    }
    if (!secure) {
      setError(geoErrorMessage(null, false))
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          await reportCoords(lat, lng, '当前位置')
        } catch {
          setError('上报失败')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setError(geoErrorMessage(err, true))
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  const formatTime = (t) => (t ? new Date(t).toLocaleString('zh-CN') : '')

  return (
    <Layout particleMode="snow">
      <h2 className="page-title">卫星距离纪念</h2>

      {distanceData && (
        <>
          <div className="distance-display">
            {distanceData.distanceKm > 0
              ? `相距 ${distanceData.distanceKm} 公里`
              : '等待双方上报位置...'}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AmapView
              meetPlaces={meetPlaces}
              locations={locations}
              nicknames={nicknames}
            />
          </div>
        </>
      )}

      <div className="card" style={{ textAlign: 'center', marginTop: '1rem' }}>
        {!secure && (
          <p className="distance-secure-hint">
            当前为 HTTP 访问，浏览器不会开放 GPS 定位。请改用 HTTPS，或使用下方相遇地点上报。
          </p>
        )}
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          点击按钮上报你的当前位置，地图将绘制双方轨迹线
        </p>
        <button className="btn btn-primary" onClick={reportLocation} disabled={loading}>
          {loading ? '定位中...' : '上报我的位置'}
        </button>
        {meetPlaces.length > 0 && (
          <div className="distance-place-fallback">
            <p className="distance-place-label">或在相遇地点上报</p>
            <div className="distance-place-btns">
              {meetPlaces.map((place) => (
                <button
                  key={place.name}
                  type="button"
                  className="btn btn-secondary"
                  disabled={loading}
                  onClick={() => reportCoords(place.lat, place.lng, place.name)}
                >
                  {place.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>轨迹记录</h3>
        {locations.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>暂无轨迹，上报位置后这里会显示记录</p>
        ) : (
          <ul className="anniversary-list">
            {locations.slice(0, 20).map((loc) => (
              <li key={loc.id} className="anniversary-item">
                <span>{nicknames[loc.username] || loc.username} · {loc.placeName || '未知地点'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {loc.lat?.toFixed(4)}, {loc.lng?.toFixed(4)} · {formatTime(loc.recordedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
