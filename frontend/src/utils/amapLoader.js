let loadingPromise = null

export function loadAmap(apiKey) {
  if (window.AMap) {
    return Promise.resolve(window.AMap)
  }

  if (!apiKey) {
    return Promise.reject(new Error('缺少高德地图 API Key'))
  }

  if (!loadingPromise) {
    loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Scale,AMap.ToolBar,AMap.CircleMarker`
      script.async = true
      script.onload = () => {
        if (window.AMap) resolve(window.AMap)
        else reject(new Error('高德地图 SDK 加载失败'))
      }
      script.onerror = () => reject(new Error('高德地图 SDK 加载失败'))
      document.head.appendChild(script)
    })
  }

  return loadingPromise
}
