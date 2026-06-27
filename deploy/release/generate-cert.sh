#!/bin/bash
# 为公网 IP 生成自签名 HTTPS 证书（Spring Boot 单 JAR 内置 HTTPS）
# 用法: ./generate-self-signed-cert.sh 123.45.67.89

set -e
IP="${1:?请传入公网 IP，例如: ./generate-self-signed-cert.sh 123.45.67.89}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/forlove.jar" ]; then
  DIR="$SCRIPT_DIR/certs"
else
  DIR="$SCRIPT_DIR/release/certs"
fi
mkdir -p "$DIR"

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "$DIR/forlove.key" \
  -out "$DIR/forlove.crt" \
  -subj "/CN=ForLove" \
  -addext "subjectAltName=IP:${IP}"

echo ""
echo "证书已生成:"
echo "  $DIR/forlove.crt"
echo "  $DIR/forlove.key"
echo ""
echo "启动（需 root 监听 443）:"
if [ -f "$SCRIPT_DIR/forlove.jar" ]; then
  echo "  ./start.sh"
else
  echo "  cd deploy/release && sudo ./start.sh"
fi
echo ""
echo "访问: https://${IP}/"
echo "首次打开需在浏览器中点击「高级」→「继续访问」信任证书，之后 GPS 定位可用。"
