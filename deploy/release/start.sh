#!/bin/bash
# ForLove 启动脚本（单 JAR，可选内置 HTTPS）
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
JAR="$DIR/forlove.jar"
CERT_DIR="$DIR/certs"
CRT="$CERT_DIR/forlove.crt"
KEY="$CERT_DIR/forlove.key"

if [ ! -f "$JAR" ]; then
  echo "未找到 forlove.jar，请先运行 deploy/build.sh 打包"
  exit 1
fi

if ! command -v java >/dev/null 2>&1; then
  echo "未找到 Java，请安装 JDK 17+"
  exit 1
fi

cd "$DIR"
mkdir -p data uploads logs

JAVA_ARGS=(${JAVA_OPTS:-})

if [ -f "$CRT" ] && [ -f "$KEY" ]; then
  HTTPS_PORT="${HTTPS_PORT:-443}"
  APP_ARGS=(
    --server.port="$HTTPS_PORT"
    --server.ssl.enabled=true
    --server.ssl.certificate="file:$CRT"
    --server.ssl.certificate-private-key="file:$KEY"
  )
  HTTP_REDIRECT="${HTTP_REDIRECT:-80}"
  if [ "$HTTPS_PORT" = "443" ] && [ -n "$HTTP_REDIRECT" ] && [ "$HTTP_REDIRECT" != "0" ]; then
    APP_ARGS+=(--forlove.ssl.http-redirect-port="$HTTP_REDIRECT")
  fi
  echo "ForLove 启动中（HTTPS）..."
  echo "  HTTPS 端口: $HTTPS_PORT"
  if [ "$HTTPS_PORT" = "443" ] && [ -n "$HTTP_REDIRECT" ] && [ "$HTTP_REDIRECT" != "0" ]; then
    echo "  HTTP 重定向: $HTTP_REDIRECT -> $HTTPS_PORT"
  fi
  IP="$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1')"
  if [ "$HTTPS_PORT" = "443" ]; then
    echo "访问: https://$IP/"
  else
    echo "访问: https://$IP:$HTTPS_PORT/"
  fi
  echo "  （443 端口可省略；首次需信任自签名证书）"
else
  PORT="${PORT:-80}"
  APP_ARGS=(--server.port="$PORT")
  echo "ForLove 启动中（HTTP）..."
  echo "  端口: $PORT"
  echo "访问: http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1'):$PORT/"
  echo ""
  echo "提示: 公网 GPS 定位需 HTTPS。生成证书后重启即可："
  echo "  ../generate-self-signed-cert.sh 你的公网IP"
fi

echo "  数据: $DIR/data"
echo "  上传: $DIR/uploads"
echo ""

exec java "${JAVA_ARGS[@]}" -jar "$JAR" "${APP_ARGS[@]}" "$@"
