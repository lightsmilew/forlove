#!/bin/bash
# ForLove 一键打包（前端 + 后端合并为一个 JAR）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/deploy/release"

echo "==> [1/3] 构建前端..."
cd "$ROOT/frontend"
if [ ! -x node_modules/.bin/vite ] && [ ! -f node_modules/.bin/vite.cmd ]; then
  echo "安装前端依赖..."
  npm install
fi
npm run build

if [ ! -f "$ROOT/frontend/dist/index.html" ]; then
  echo "错误: frontend/dist/index.html 不存在"
  exit 1
fi

echo "==> [2/3] 打包后端（内嵌前端静态文件）..."
cd "$ROOT/backend"
chmod +x mvnw 2>/dev/null || true
./mvnw package -DskipTests

echo "==> [3/3] 输出到 deploy/release/..."
mkdir -p "$RELEASE"
cp "$ROOT/backend/target/forlove-backend-1.0.0.jar" "$RELEASE/forlove.jar"
cp "$ROOT/deploy/start.sh" "$RELEASE/start.sh"
chmod +x "$RELEASE/start.sh"
cp "$ROOT/deploy/generate-self-signed-cert.sh" "$RELEASE/generate-cert.sh"
chmod +x "$RELEASE/generate-cert.sh"

echo ""
echo "打包完成: $RELEASE/forlove.jar"
echo "启动命令:"
echo "  cd deploy/release && ./start.sh"
echo "访问: http://服务器IP/  或  https://服务器IP/（生成证书后）"
