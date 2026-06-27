# ForLove · 情侣专属 Web 项目

React 前端 + Spring Boot 后端 + SQLite，专为两人设计的浪漫 Web 应用。

## 功能模块

| 模块 | 说明 |
|------|------|
| **专属树洞** | 樱花信笺式悄悄话、打字机情话、分页浏览 |
| **情侣日记** | 心情记录、多图上传、纪念日提醒、恋爱数据统计 |
| **恋爱互动** | 爱心点击、默契问答、五子棋实时对决 |
| **卫星距离** | 高德地图、双方位置与轨迹、实时距离计算 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + React Router + STOMP WebSocket |
| 后端 | Spring Boot 3 + Spring Security + JWT + WebSocket |
| 数据库 | SQLite（数据存于 `backend/data/forlove.db`） |
| 地图 | 高德 JS API（可选，需配置 Key） |

## 端口

### 本地开发（前后端分开跑）

| 服务 | 端口 | 地址 |
|------|------|------|
| 前端 | 80 | http://localhost |
| 后端 | 6748 | http://localhost:6748 |

前端通过 Vite 代理将 `/api`、`/uploads`、`/ws` 转发至后端，浏览器只需访问前端地址。

### 生产部署（单 JAR）

页面和 API **共用一个端口**：

| 模式 | 端口 | 说明 |
|------|------|------|
| HTTP（默认） | 80 | 无证书时；公网 IP 下 GPS 不可用 |
| HTTPS（推荐公网） | 443 | `certs/` 下有证书时自动启用；80 自动跳转 HTTPS |

启动脚本通过 `--server.port` 覆盖 `application.yml` 里的 6748，无需 Nginx。

## 快速开始

### 环境要求

- JDK 17+
- Node.js 18+
- Maven 3.8+（或使用项目自带 `mvnw.cmd`）

### 1. 启动后端

```powershell
cd backend
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"   # 按本机 JDK 路径调整
.\mvnw.cmd spring-boot:run
```

启动成功后监听 **6748** 端口。

### 2. 启动前端

```powershell
cd frontend
npm install
npm start          # 或 npm run dev
```

启动成功后访问 **http://localhost**（80 端口）。

> **Windows 提示**：80 端口通常需要**以管理员身份**运行终端。若启动失败，请右键 PowerShell →「以管理员身份运行」。

### 3. 局域网访问

前端已配置 `host: true`，启动后终端会显示：

```
Network: http://192.168.x.x/
```

同一 WiFi 下的手机或另一台电脑可直接访问。若无法连接，请在防火墙中放行 **80**、**6748** 端口。

### 4. 登录账号

默认双账号（在 `application.yml` 中修改）：

| 账号 | 密码 | 昵称 |
|------|------|------|
| ye   | love | 叶 |
| jie  | love | 杰 |

## 个性化配置

编辑 `backend/src/main/resources/application.yml`：

```yaml
forlove:
  couple:
    username1: ye
    password1: love
    nickname1: 叶
    username2: jie
    password2: love
    nickname2: 杰
    love-quotes:            # 首页 / 树洞打字机情话
      - 遇见你，是我这辈子最美的意外。
      - 愿得一心人，白首不相离。
    anniversaries:          # 日记页纪念日；「在一起」的 date 用于自动计算相处天数
      - name: 第一次见面
        date: 2026-05-24
      - name: 在一起
        date: 2026-06-18
    meet-places:            # 地图相遇地点
      - name: 武汉大学
        lat: 30.5315
        lng: 114.3610
      - name: 湖北大学
        lat: 30.5810
        lng: 114.3290
```

修改配置后需**重启后端**。

## 功能说明

### 树洞留言板

- 樱花信笺气泡，左右交错展示双方悄悄话
- 消息逐条淡入，显示昵称与相对时间
- 首页 / 树洞页打字机循环输出情话
- Canvas 樱花粒子（距离页为雪花）
- 19:00–06:00 自动深色模式

### 私人日记

- 双方写日记、互相查看
- 1–10 心情滑条 + 中文心情词（如「心里发甜」）
- **多张照片**上传（最多 9 张）
- 相处天数（按「在一起」日期自动计算）、日记条数、甜蜜指数
- 纪念日倒计时提醒

### 恋爱互动

- **爱心点击**：累计分数，每 5 分解锁一句情话
- **默契问答**：给 TA 出选择题，作答后生成默契报告
- **五子棋对决**：邀请对方实时对战，WebSocket 同步落子；支持认输

### 在线状态

- 导航栏显示双方昵称与在线绿点
- WebSocket 连接 + 心跳维持，实时更新

### 卫星距离

- 浏览器 Geolocation 上报位置
- Haversine 公式计算两人实时距离
- **高德地图**展示相遇地点与双方轨迹
- 支持「查看校园 / 查看位置」切换视角

#### 高德地图配置

1. 前往 [高德开放平台](https://lbs.amap.com/) 注册并创建应用
2. 添加 **Web 端 (JS API)** Key，白名单填 `localhost` 和你的域名
3. 复制 Key 到 `frontend/.env`：

```env
VITE_AMAP_KEY=你的高德Key
```

4. 重启前端

## 项目结构

```
ForLove/
├── backend/
│   ├── src/main/java/com/forlove/
│   │   ├── config/          # 安全、JWT、WebSocket、CORS
│   │   ├── controller/      # REST API
│   │   ├── entity/          # JPA 实体
│   │   ├── repository/
│   │   └── service/         # 业务逻辑（含五子棋、在线状态）
│   ├── src/main/resources/application.yml
│   └── data/                # SQLite 数据库（运行时生成）
├── frontend/
│   └── src/
│       ├── pages/           # Home, TreeHole, Diary, Games, Distance, Login
│       ├── components/      # Layout, Heart3D, GomokuGame, OnlineStatus 等
│       ├── context/         # Auth、WebSocket 实时上下文
│       ├── hooks/           # 深色模式、打字机
│       ├── utils/           # 心情词、鉴权存储
│       └── styles/
└── README.md
```

## API 概览

### 认证与配置

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET  | /api/config/couple | 情侣配置 |
| GET  | /api/presence | 在线状态 |
| POST | /api/presence/heartbeat | 心跳 |

### 树洞 / 日记

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/whispers | 树洞留言 |
| DELETE | /api/whispers/{id} | 删除留言 |
| GET/POST | /api/diaries | 日记列表 / 新建 |
| POST | /api/diaries/{id}/photos | 上传多张照片 |
| GET  | /api/diaries/stats | 恋爱统计 |

### 互动游戏

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/games/score | 保存游戏分数 |
| POST | /api/games/quiz | 出题 |
| GET  | /api/games/quiz/pending | 待答题目 |
| POST | /api/games/quiz/{id}/answer | 提交答案 |
| GET  | /api/games/quiz/report | 默契报告 |
| POST | /api/games/gomoku/invite | 邀请五子棋 |
| GET  | /api/games/gomoku/pending | 待接受邀请 |
| GET  | /api/games/gomoku/current | 当前对局 |
| POST | /api/games/gomoku/{id}/accept | 接受对局 |
| POST | /api/games/gomoku/{id}/move | 落子 |
| POST | /api/games/gomoku/{id}/resign | 认输 |

### 距离

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/distance/location | 上报位置 |
| GET  | /api/distance/locations | 位置历史 |
| GET  | /api/distance/between | 计算距离 |

### WebSocket

| 地址 | 说明 |
|------|------|
| ws://host/ws?token=JWT | STOMP 连接（五子棋推送、在线状态） |

## 服务器部署（推荐：单 JAR，无需 Nginx）

前端打包进后端 JAR，**一个进程**同时提供页面和 API。

### 环境要求

- JDK 17+
- Node.js 18+（仅打包时需要）

### Linux 服务器

```bash
# 1. 上传项目到服务器后，一键打包
cd ForLove
chmod +x deploy/build.sh deploy/start.sh
./deploy/build.sh

# 2. 启动（HTTP，默认 80 端口，需 root 或 sudo）
cd deploy/release
sudo ./start.sh

# 若 80 被占用或不想用 root，可改用其他端口
PORT=6748 ./start.sh
```

访问：`http://你的公网IP/`

### 公网 GPS 定位（内置 HTTPS，无需 Nginx）

浏览器规定：**只有 `https://` 或 `localhost` 才允许 GPS**。单 JAR 检测到 `certs/forlove.crt` 和 `certs/forlove.key` 后会自动以 HTTPS 启动。

```bash
# 1. 生成自签名证书（把 IP 换成你的公网 IP，需 OpenSSL）
cd ForLove/deploy
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh 123.45.67.89

# 2. 重新打包或直接把 certs/ 拷到 release/ 后启动
cd release
sudo ./start.sh
```

访问：`https://你的公网IP/`（443 可省略端口号）

- 首次打开点「高级」→「继续访问」信任证书
- HTTP 80 会自动跳转到 HTTPS
- 无 root 时可用高位端口：`HTTPS_PORT=8443 HTTP_REDIRECT=0 ./start.sh`

Windows：

```powershell
cd ForLove\deploy
.\generate-self-signed-cert.ps1 -Ip 123.45.67.89
cd release
# 以管理员身份运行
.\start.ps1
```

> **为何之前是 6748？** 单 JAR 模式下只有一个 Spring Boot 进程，端口来自 `application.yml` 的 `server.port: 6748`（给本地只跑后端用）。启动脚本现已默认改为 **80**（HTTP）或 **443**（有证书时）。

### Windows 服务器

```powershell
cd ForLove
.\deploy\build.ps1
cd deploy\release
# 默认 80 端口（需以管理员身份运行 PowerShell）
.\start.ps1

# 改用 6748
$env:PORT = "6748"
.\start.ps1
```

### 打包产物

| 文件 | 说明 |
|------|------|
| `deploy/release/forlove.jar` | 可执行 JAR（含前端静态文件） |
| `deploy/release/certs/` | 自签名 HTTPS 证书（生成后） |
| `deploy/release/data/` | SQLite 数据库（运行时生成） |
| `deploy/release/uploads/` | 上传的照片（运行时生成） |
| `deploy/release/generate-cert.sh` | 证书生成脚本（Linux） |
| `deploy/release/generate-cert.ps1` | 证书生成脚本（Windows） |

只需把 `deploy/release/` 整个目录拷到服务器，保留 `forlove.jar`、`start.sh` 和 `certs/` 即可。

### 安全组

| 端口 | 说明 |
|------|------|
| 80 | HTTP（无证书时）或自动跳转 HTTPS |
| 443 | HTTPS（有证书时，推荐公网部署） |
| 6748 | 可选，`PORT=6748` 时 HTTP 使用 |

### 上线前必改

编辑 `backend/src/main/resources/application.yml` 后重新 `./deploy/build.sh`：

- JWT `secret`
- 账号密码
- 纪念日、情话等

---

## Nginx 部署（可选，一般不需要）

单 JAR 已内置 HTTPS，多数场景无需 Nginx。若你已有 Nginx 环境，可参考 `deploy/nginx-ip-https.conf`（需把反代目标改为 JAR 端口）。

### 高德 Key

HTTPS 或 IP 访问时，在高德控制台 Key 白名单中加入公网 IP。

### 功能与 HTTPS 对照

| 功能 | HTTP + 公网 IP | HTTPS（内置或 Nginx） |
|------|----------------|----------------------|
| 树洞 / 日记 / 五子棋 | ✅ | ✅ |
| 在线状态 / WebSocket | ✅ | ✅ |
| GPS 实时定位 | ❌ | ✅ |
| 相遇地点上报（备用） | ✅ | ✅ |
| 高德地图 | 需白名单加 IP | 需白名单加 IP |

CORS 与 WebSocket 已默认允许 `http://*:*` 和 `https://*:*`。

## 生产部署提示

1. 修改 `application.yml` 中的 JWT secret 和默认密码
2. 公网部署建议生成证书并走 HTTPS（见上文「公网 GPS 定位」）
3. 定期备份 `deploy/release/data/forlove.db`
4. 上传目录 `deploy/release/uploads/` 需持久化
5. 公网 IP 部署见上文「公网 IP 直连部署」章节
