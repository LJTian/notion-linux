# Notion 网页封装：在 macOS 上可分别打出 Linux / macOS 包（需已安装 nativefier：npm i -g nativefier）
APP_NAME := Notion-Linux
URL := https://www.notion.so
INTERNAL_URLS := .*notion\.so.*
NATIVEFIER ?= nativefier

# 国内 Electron 镜像（npmmirror）。USE_CN=1 时启用，并用 env -u 去掉当前 shell 里的代理变量，避免「代理 + 国内源」混用导致下载失败
ELECTRON_MIRROR_CN := https://npmmirror.com/mirrors/electron/
ifeq ($(USE_CN),1)
NATIVEFIER_ENV := env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY -u all_proxy -u ALL_PROXY \
	ELECTRON_MIRROR=$(ELECTRON_MIRROR_CN)
else
NATIVEFIER_ENV :=
endif

# 若仓库根目录存在 notion.png，则自动用于应用图标（Linux 在 Mac 上打包时尤其有用）
ICON_FLAG := $(if $(wildcard notion.png),--icon notion.png,)

# Linux 目标（Ubuntu 等 x64 桌面最常见）
LINUX_PLATFORM := linux
LINUX_ARCH := x64
LINUX_OUT := $(APP_NAME)-$(LINUX_PLATFORM)-$(LINUX_ARCH)

# macOS：与当前机器一致；uname 的 x86_64 需映射为 Electron 常用的 x64
UNAME_M := $(shell uname -m)
DARWIN_ARCH := $(if $(filter x86_64,$(UNAME_M)),x64,$(UNAME_M))
DARWIN_PLATFORM := darwin
DARWIN_OUT := $(APP_NAME)-$(DARWIN_PLATFORM)-$(DARWIN_ARCH)

# targetUrl 必须是第一个位置参数；放在选项后面会导致 yargs 解析不到 URL 而报错
COMMON_FLAGS := \
	--name "$(APP_NAME)" \
	$(ICON_FLAG) \
	--inject ./inject.css \
	--internal-urls "$(INTERNAL_URLS)" \
	--single-instance \
	--tray

.PHONY: all linux mac dist-linux dist-linux-cn docker-dist docker-dist-international clean help check

help:
	@echo "Targets:"
	@echo "  make linux      - 打包 Linux x64（输出目录: $(LINUX_OUT)/）"
	@echo "  make mac        - 打包当前 macOS（输出目录: $(DARWIN_OUT)/）"
	@echo "  make all        - 依次打 Linux 与 macOS"
	@echo "  make dist-linux    - 将 Linux 目录打成 notion-linux.tar.gz（便于传输保留权限）"
	@echo "  make dist-linux-cn - 同上，Electron 走国内镜像并清除代理环境变量（推荐）"
	@echo "  make docker-dist   - 用 Docker 打 dist-linux-cn，产物 notion-linux.tar.gz 拷到当前目录（需 docker）"
	@echo "  make docker-dist-international - 同上但走默认 Electron 源（build-arg DIST_TARGET=dist-linux）"
	@echo "  make linux USE_CN=1 / mac USE_CN=1 - 单平台 + 国内源、无代理"
	@echo "  make clean      - 删除 Nativefier 输出与 tar.gz"
	@echo "依赖: npm i -g nativefier"

check:
	@command -v $(NATIVEFIER) >/dev/null 2>&1 || \
		{ echo "未找到 $(NATIVEFIER)，请先: npm i -g nativefier" >&2; exit 1; }

linux: check
	$(NATIVEFIER_ENV) $(NATIVEFIER) "$(URL)" --platform $(LINUX_PLATFORM) --arch $(LINUX_ARCH) $(COMMON_FLAGS)

mac: check
	$(NATIVEFIER_ENV) $(NATIVEFIER) "$(URL)" --platform $(DARWIN_PLATFORM) --arch $(DARWIN_ARCH) $(COMMON_FLAGS)

all: linux mac

dist-linux: linux
	tar -czvf notion-linux.tar.gz -C . "$(LINUX_OUT)"
	@echo "已生成 notion-linux.tar.gz；在 Linux 上: tar -xzvf notion-linux.tar.gz && cd $(LINUX_OUT) && chmod +x $(APP_NAME) && ./$(APP_NAME)"

dist-linux-cn:
	@$(MAKE) dist-linux USE_CN=1

# 容器内打包：固定 Node 20 + nativefier，避免宿主机 Node 过旧或全局 npm 权限问题
DOCKER_IMAGE ?= notion-linux-pack:local

docker-dist:
	docker build -t $(DOCKER_IMAGE) -f Dockerfile .
	@cid=$$(docker create $(DOCKER_IMAGE)); \
	docker cp $$cid:/build/notion-linux.tar.gz ./notion-linux.tar.gz; \
	docker rm -v $$cid
	@echo "已生成 ./notion-linux.tar.gz（来自容器 $(DOCKER_IMAGE)）"

docker-dist-international:
	docker build -t $(DOCKER_IMAGE) -f Dockerfile --build-arg DIST_TARGET=dist-linux .
	@cid=$$(docker create $(DOCKER_IMAGE)); \
	docker cp $$cid:/build/notion-linux.tar.gz ./notion-linux.tar.gz; \
	docker rm -v $$cid
	@echo "已生成 ./notion-linux.tar.gz（来自容器 $(DOCKER_IMAGE)，默认 Electron 源）"

clean:
	rm -rf $(APP_NAME)-linux-* $(APP_NAME)-darwin-* notion-linux.tar.gz
