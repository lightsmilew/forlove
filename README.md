# ForLove · 情侣专属 Web 项目

React 前端 + Spring Boot 后端 + SQLite，包含三大核心模块：

1. **专属树洞留言板** — 分页悄悄话、打字机情话、武大樱花飘落背景、夜间自动深色模式
2. **情侣私人日记本** — 双人登录、心情打分、照片上传、纪念日提醒、恋爱数据统计
3. **恋爱互动 + 卫星距离** — 爱心点击/默契问答/翻牌游戏 + 实时距离与轨迹记录

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + React Router |
| 后端 | Spring Boot 3 + Spring Security + JWT |
| 数据库 | SQLite（零配置，数据存于 `backend/data/forlove.db`） |

## 快速开始

### 环境要求

- JDK 17+
- Maven 3.8+
- Node.js 18+

### 1. 启动后端

**方式 A：使用项目自带的 Maven Wrapper（推荐，无需安装 Maven）**

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"   # 仅需设置一次，或写入系统环境变量
.\mvnw.cmd spring-boot:run
```

**方式 B：全局安装 Maven 后**

```bash
cd backend
mvn spring-boot:run
```

后端运行在 http://localhost:8080

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev    # 或 npm start
```

前端运行在 http://localhost:5173

**局域网访问（手机 / 另一台电脑）：**

1. 重启前端后，终端会显示 `Network: http://192.168.x.x:5173/`
2. 同一 WiFi 下的设备用该地址访问
3. 若仍无法访问，在 Windows 防火墙中允许 Node.js / 端口 5173、8080

```bash
npm run dev    # 已配置 host: true，支持局域网
```

### 3. 登录账号

默认双账号（可在 `backend/src/main/resources/application.yml` 修改）：

| 账号 | 密码 | 昵称 |
|------|------|------|
| ye   | love | 叶 |
| jie  | love | 杰 |

## 个性化配置

编辑 `backend/src/main/resources/application.yml`：

```yaml
forlove:
  couple:
    username1: ye           # 第一个账号
    password1: love
    nickname1: 叶           # 显示昵称
    username2: jie
    password2: love
    nickname2: 杰
    love-quotes:            # 首页/树洞打字机情话
      - 遇见你，是我这辈子最美的意外。
      - 愿得一心人，白首不相离。
    anniversaries:          # 日记页纪念日提醒；name 为「在一起」的 date 用于自动计算相处天数
      - name: 在一起
        date: 2026-06-18
    meet-places:            # 相遇地点（地图标记）
      - name: 武汉大学
        lat: 30.5315
        lng: 114.3610
      - name: 湖北大学
        lat: 30.5810
        lng: 114.3290
```

## 功能说明

### 树洞留言板
- 分页浏览双方悄悄话
- 首页/树洞页打字机循环输出情话
- Canvas 樱花粒子动画（距离页为雪花效果）
- 19:00–06:00 自动切换深色模式

### 私人日记
- 双方写日记、互相查看
- 1–10 心情打分 + emoji 展示
- 照片上传（存于 `backend/uploads/`）
- 相处天数、日记条数、甜蜜指数、平均心情
- 纪念日倒计时提醒

### 恋爱互动
- **爱心点击**：累计分数，每 5 分解锁一句情话
- **默契问答**：给 TA 出选择题，TA 作答后生成默契报告
- **翻牌配对**：12 张卡片 emoji 配对游戏

### 卫星距离
- 浏览器 Geolocation 上报位置
- Haversine 公式计算两人实时距离
- **高德地图**展示相遇地点（`meetLat`/`meetLng`）与双方轨迹线
- 轨迹历史记录

#### 高德地图配置

1. 前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用
2. 添加 **Web 端 (JS API)** Key，白名单填 `localhost` 和你的域名
3. 复制 Key 到 `frontend/.env`：

```env
VITE_AMAP_KEY=你的高德Key
```

4. 重启前端 `npm run dev`

## 项目结构

```
ForLove/
├── backend/                 # Spring Boot 后端
│   ├── src/main/java/com/forlove/
│   │   ├── config/          # 安全、JWT、CORS
│   │   ├── controller/      # REST API
│   │   ├── entity/          # JPA 实体
│   │   ├── repository/      # 数据访问
│   │   └── service/         # 业务逻辑
│   └── src/main/resources/application.yml
├── frontend/                # React 前端
│   └── src/
│       ├── pages/           # 页面组件
│       ├── components/      # 公共组件
│       ├── hooks/           # 深色模式、打字机
│       └── styles/          # 全局样式
└── README.md
```

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET  | /api/config/couple | 情侣配置 |
| GET/POST | /api/whispers | 树洞留言 |
| GET/POST | /api/diaries | 日记 CRUD |
| POST | /api/diaries/{id}/photo | 上传照片 |
| GET  | /api/diaries/stats | 恋爱统计 |
| POST | /api/games/score | 保存游戏分数 |
| POST | /api/games/quiz | 出题（选择题） |
| GET  | /api/games/quiz/pending | 待答题目 |
| POST | /api/games/quiz/{id}/answer | 提交答案 |
| GET  | /api/games/quiz/report | 默契报告 |
| POST | /api/distance/location | 上报位置 |
| GET  | /api/distance/between | 计算距离 |

## 生产部署提示

1. 修改 JWT secret 和默认密码
2. 前端 `npm run build` 后由 Nginx 托管，或放入 Spring Boot `static/`
3. SQLite 文件定期备份 `backend/data/forlove.db`
4. 上传目录 `backend/uploads/` 需持久化存储
