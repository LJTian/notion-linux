# 在固定 Node 版本下用 Nativefier 打 Linux x64 包，避免宿主机 Node 过旧或权限问题
FROM node:20-bookworm-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends make ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install -g nativefier

WORKDIR /build
# 上下文见 .dockerignore；若有 notion.png 放在仓库根目录会一并打入
COPY . .

ARG DIST_TARGET=dist-linux-cn
RUN make "${DIST_TARGET}"
