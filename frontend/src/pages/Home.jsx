import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import FeatureIcon from '../components/FeatureIcon'
import { api } from '../api'
import { useTypewriter } from '../hooks/useTheme'

export default function Home() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    api.getConfig().then(setConfig).catch(console.error)
  }, [])

  const quotes = config?.loveQuotes || ['加载中...']
  const typeText = useTypewriter(quotes)

  return (
    <Layout>
      <section className="hero">
        <h1 className="hero-title">ForLove</h1>
        <p className="hero-subtitle">武大樱花下的专属浪漫</p>
        <div className="typewriter">
          {typeText}<span className="typewriter-cursor">|</span>
        </div>
        {config && (
          <div className="stats-grid" style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="stat-card">
              <div className="stat-value">{config.daysTogether}</div>
              <div className="stat-label">在一起的天数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{config.nickname1} & {config.nickname2}</div>
              <div className="stat-label">我们</div>
            </div>
          </div>
        )}
      </section>

      <div className="feature-grid">
        <Link to="/treehole" className="card feature-card">
          <FeatureIcon name="treehole" variant="sakura" />
          <h3 className="feature-title">专属树洞</h3>
          <p className="feature-desc">写下悄悄话，樱花飘落的浪漫留言板，打字机情话为你诉说心意</p>
        </Link>
        <Link to="/diary" className="card feature-card">
          <FeatureIcon name="diary" variant="rose" />
          <h3 className="feature-title">私人日记</h3>
          <p className="feature-desc">记录每一天的心情，上传照片，查看恋爱数据统计与纪念日提醒</p>
        </Link>
        <Link to="/games" className="card feature-card">
          <FeatureIcon name="games" variant="heart" />
          <h3 className="feature-title">恋爱互动</h3>
          <p className="feature-desc">爱心点击、默契问答、五子棋对决、你画我猜，用游戏增进彼此了解</p>
        </Link>
        <Link to="/distance" className="card feature-card">
          <FeatureIcon name="distance" variant="sky" />
          <h3 className="feature-title">卫星距离</h3>
          <p className="feature-desc">实时显示两人距离，标记相遇地点，记录一路走来的轨迹</p>
        </Link>
      </div>
    </Layout>
  )
}
