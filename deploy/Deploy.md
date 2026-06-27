# ForLove 打包与部署指南

单 JAR 部署：前端打包进 Spring Boot，**一个进程**同时提供页面和 API，**无需 Nginx**。可选内置 HTTPS，支持公网 GPS 定位。

---

## 目录

1. [环境要求](#环境要求)
2. [证书在哪生成？](#证书在哪生成)
3. [完整流程（推荐）](#完整流程推荐本机打包--上传服务器)
4. [流程图](#流程图)
5. [两种部署方案](#两种部署方案)
6. [启动行为说明](#启动行为说明)
7. [常见问题](#常见问题)

---

## 环境要求

| 阶段 | 需要 |
|------|------|
| **本机打包** | JDK 17+、Node.js 18+、Maven（或使用项目自带 `mvnw`） |
| **服务器运行** | JDK 17+（不需要 Node.js，除非在服务器上重新打包） |
| **生成 HTTPS 证书** | OpenSSL（本机或服务器均可） |

---

## 证书在哪生成？

**本机和服务器都可以。** 证书与「在哪台电脑执行命令」无关，只与 **填写的 IP** 有关。

生成时必须填写 **服务器的公网 IP**（用户浏览器实际访问的地址）。例如公网 IP 为 `123.45.67.89`，无论在本机还是服务器执行，效果相同：

```powershell
# Windows
.\generate-self-signed-cert.ps1 -Ip 123.45.67.89
```

```bash
# Linux
./generate-self-signed-cert.sh 123.45.67.89
```

| 方式 | 适合场景 |
|------|----------|
| **本机生成** | 开发机已安装 OpenSSL；打包后把 `release/` 整个目录（含 `certs/`）上传到服务器 |
| **服务器生成** | 已上传 `release/` 到服务器；在服务器上执行证书脚本 |

> **注意**：IP 必须填 **公网 IP**，不能填 `127.0.0.1` 或内网 IP，否则手机/外网访问时浏览器会报证书不匹配。

证书输出位置：

- 在 `deploy/` 目录执行脚本 → `deploy/release/certs/`
- 在 `deploy/release/` 目录执行脚本 → `deploy/release/certs/`

---

## 完整流程（推荐：本机打包 → 上传服务器）

### 第一步：修改配置（打包前）

编辑 `backend/src/main/resources/application.yml`：

- JWT `secret`（上线必改）
- 账号密码
- 纪念日、情话、相遇地点等

改完后 **必须重新打包**，配置才会进入 JAR。

---

### 第二步：本机打包

**Windows：**

```powershell
cd d:\work\ForLove
.\deploy\build.ps1
```

**Linux / macOS：**

```bash
cd ForLove
chmod +x deploy/build.sh deploy/start.sh
./deploy/build.sh
```

脚本会自动：

1. `npm run build` 构建前端 → `frontend/dist/`
2. `mvn package` 将前端静态文件打入 JAR
3. 输出到 `deploy/release/`：

| 文件 | 说明 |
|------|------|
| `forlove.jar` | 可执行 JAR（含前端） |
| `start.ps1` / `start.sh` | 启动脚本 |
| `generate-cert.ps1` / `generate-cert.sh` | 证书生成脚本 |

---

### 第三步：生成 HTTPS 证书（需要 GPS 定位时）

**本机或服务器任选其一**，IP 填服务器公网 IP。

**Windows（在项目 `deploy` 目录）：**

```powershell
cd d:\work\ForLove\deploy
.\generate-self-signed-cert.ps1 -Ip 123.45.67.89
```

**Linux：**

```bash
cd ForLove/deploy
chmod +x generate-self-signed-cert.sh
./generate-self-signed-cert.sh 123.45.67.89
```

**或在已上传的 release 目录：**

```bash
cd /opt/forlove
chmod +x generate-cert.sh
./generate-cert.sh 123.45.67.89
```

生成结果：

```
deploy/release/certs/
├── forlove.crt
└── forlove.key
```

若暂时不需要 GPS 定位，可跳过此步，使用 HTTP 访问（公网下 GPS 不可用，但可用「相遇地点上报」）。

---

### 第四步：上传到服务器

将 **`deploy/release/` 整个目录** 复制到服务器，例如：

```
/opt/forlove/
├── forlove.jar
├── start.sh              # Linux
├── start.ps1             # Windows 服务器
├── generate-cert.sh
├── generate-cert.ps1
├── certs/                # 启用 HTTPS 时需要
│   ├── forlove.crt
│   └── forlove.key
├── data/                 # 首次启动后自动生成（SQLite 数据库）
└── uploads/              # 首次启动后自动生成（上传照片）
```

若第三步在本机完成，上传时务必 **包含 `certs/` 目录**。

---

### 第五步：开放防火墙 / 安全组

在云厂商控制台放行：

| 端口 | 用途 |
|------|------|
| **443** | HTTPS（有证书时；GPS 定位需要） |
| **80** | HTTP；有证书时自动跳转到 HTTPS |

---

### 第六步：服务器启动

**Linux：**

```bash
cd /opt/forlove
chmod +x start.sh

# 有 certs/ → 自动 HTTPS 443，HTTP 80 跳转 HTTPS
sudo ./start.sh

# 无 certs/ → 纯 HTTP 80
sudo ./start.sh

# 无 root 权限时，改用高位端口
HTTPS_PORT=8443 HTTP_REDIRECT=0 ./start.sh
```

**Windows 服务器（以管理员身份运行 PowerShell）：**

```powershell
cd C:\forlove
.\start.ps1

# 改用 HTTP 高位端口（无证书时）
$env:PORT = "6748"
.\start.ps1

# 改用 HTTPS 高位端口
$env:HTTPS_PORT = "8443"
$env:HTTP_REDIRECT = "0"
.\start.ps1
```

> Linux 监听 443、Windows 监听 443/80 通常需要 **root / 管理员权限**。

---

### 第七步：浏览器访问

| 模式 | 地址 |
|------|------|
| HTTPS（有证书） | `https://123.45.67.89/`（443 可省略） |
| HTTP（无证书） | `http://123.45.67.89/` |

首次 HTTPS 访问：浏览器提示不安全 → 点「高级」→「继续访问」信任自签名证书 → 之后 GPS 定位可用。

---

## 流程图

```
本机                              服务器
──────────────────────────────────────────────────
改 application.yml
        ↓
./deploy/build.ps1 或 build.sh
        ↓
deploy/release/forlove.jar
        ↓
生成证书（可选，要 GPS 才需要）
generate-self-signed-cert -Ip 公网IP
        ↓
certs/forlove.crt + forlove.key
        ↓
上传 release/ 整个目录  ──────→   /opt/forlove/
                                   ↓
                              安全组开放 80、443
                                   ↓
                              sudo ./start.sh
                                   ↓
                              https://公网IP/
```

---

## 两种部署方案

| | 方案 A（推荐） | 方案 B |
|---|---------------|--------|
| 打包位置 | 本机 | 服务器（需 Node.js） |
| 证书生成 | 本机或服务器 | 服务器 |
| 上传内容 | 仅 `release/` 目录 | 整个项目或 `release/` |
| 服务器依赖 | 只需 JDK 17+ | 打包时需 JDK + Node；运行只需 JDK |

---

## 启动行为说明

启动脚本会自动检测 `certs/` 目录：

| 条件 | 行为 |
|------|------|
| **无** `certs/forlove.crt` 和 `forlove.key` | HTTP，默认端口 **80** |
| **有** 证书文件 | HTTPS 端口 **443**，HTTP **80** 自动跳转到 HTTPS |

环境变量（可选）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `80` | 无证书时的 HTTP 端口 |
| `HTTPS_PORT` | `443` | 有证书时的 HTTPS 端口 |
| `HTTP_REDIRECT` | `80` | HTTP 跳转端口；设为 `0` 关闭跳转 |

WebSocket 随页面协议自动切换：`https://` → `wss://`，无需额外配置。

---

## 本地开发 vs 生产部署

| | 本地开发 | 生产单 JAR |
|---|---------|-----------|
| 进程 | 前端 Vite(80) + 后端(6748) | 一个 JAR |
| 访问 | http://localhost | http(s)://公网IP |
| GPS | localhost 下 HTTP 也可用 | 公网 IP 必须 HTTPS |

本地开发：

```powershell
# 终端 1：后端
cd backend
.\mvnw.cmd spring-boot:run

# 终端 2：前端
cd frontend
npm start
```

---

## 上线前检查清单

- [ ] 修改 `application.yml` 中的 JWT `secret` 和默认密码
- [ ] 重新执行 `build.ps1` / `build.sh` 打包
- [ ] 生成证书（需要 GPS 时），IP 填公网 IP
- [ ] 安全组开放 80、443
- [ ] 高德地图 Key 白名单加入公网 IP（若使用地图）
- [ ] 定期备份 `data/forlove.db` 和 `uploads/`

---

## 常见问题

### 改配置后要做什么？

在本机重新打包，上传新的 `forlove.jar`。`data/`、`uploads/`、`certs/` 可保留，不必覆盖。

### 只有 HTTP、不要 HTTPS 可以吗？

可以。不上传 `certs/` 直接启动即可。公网 IP 下 GPS 不可用，但「在相遇地点上报」仍可用。

### 443 端口启动失败？

- Linux：使用 `sudo ./start.sh`
- Windows：以管理员身份运行 PowerShell
- 或使用高位端口：`HTTPS_PORT=8443 HTTP_REDIRECT=0 ./start.sh`

### 高德地图不显示？

前往 [高德开放平台](https://lbs.amap.com/)，在 Key 的 IP 白名单中加入服务器公网 IP。

### `./start.sh: cannot execute: required file not found`

文件明明存在却无法执行，通常是 **Windows 换行符（CRLF）** 导致。Linux 会把第一行读成 `#!/bin/bash\r`，找不到解释器。

**服务器上立即修复（无需重新上传）：**

```bash
cd ~/release
sed -i 's/\r$//' start.sh generate-cert.sh
chmod +x start.sh generate-cert.sh
sudo ./start.sh
```

或临时绕过 shebang：

```bash
sudo bash start.sh
```

**本机重新打包：** 新版 `build.ps1` 已自动把 `.sh` 转为 Linux 换行（LF）。

### `cd /opt/forlove` 找不到目录

文档示例路径是 `/opt/forlove`，你实际解压到了 `~/release/`。在文件所在目录执行即可：

```bash
cd ~/release
sudo ./start.sh
```
