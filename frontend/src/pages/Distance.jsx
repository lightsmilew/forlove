import { useEffect, useState, useMemo } from 'react'
import Layout from '../components/Layout'
import AmapView from '../components/AmapView'
import { api } from '../api'

export default function Distance() {
  const [distanceData, setDistanceData] = useState(null)
  const [locations, setLocations] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      [config.username1 || 'you']: config.nickname1,
      [config.username2 || 'me']: config.nickname2,
    }
  }, [config])

  const reportLocation = () => {
    setLoading(true)
    setError('')
    if (!navigator.geolocation) {
      setError('浏览器不支持定位')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords
          await api.recordLocation(lat, lng, '当前位置')
          await load()
        } catch {
          setError('上报失败')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('无法获取位置，请允许定位权限')
        setLoading(false)
      }
    )
  }

  const formatTime = (t) => (t ? new Date(t).toLocaleString('zh-CN') : '')

  return (
    <Layout particleMode="snow">
      <h2 style={{ textAlign: 'center', fontSize: '2rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
        卫星距离纪念
      </h2>

      {distanceData && (
        <>
          <div className="distance-display">
            {distanceData.distanceKm > 0
              ? `相距 ${distanceData.distanceKm} 公里`
              : '等待双方上报位置...'}
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <AmapView
              meetPlaces={distanceData.meetPlaces?.length ? distanceData.meetPlaces : (config?.meetPlaces || [])}
              locations={locations}
              nicknames={nicknames}
            />
          </div>
        </>
      )}

      <div className="card" style={{ textAlign: 'center', marginTop: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          点击按钮上报你的当前位置，地图将绘制双方轨迹线
        </p>
        <button className="btn btn-primary" onClick={reportLocation} disabled={loading}>
          {loading ? '定位中...' : '上报我的位置'}
        </button>
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
