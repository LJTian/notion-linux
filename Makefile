# CI: make dist-linux LINUX_ARCH=x64|arm64
APP_NAME := Notion-Linux
URL := https://www.notion.com
INTERNAL_URLS := .*([a-zA-Z0-9-]+\.notion\.site|notion\.(so|com|site)|oauth2\.googleapis\.com|googleusercontent\.com|accounts\.google\.|appleid\.apple\.com|idmsa\.apple\.com|login\.microsoftonline\.|login\.live\.|open\.weixin\.qq\.com|work\.weixin\.qq\.com|github\.com/(login|session|auth/oauth)).*
NOTION_USER_AGENT ?= Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
ELECTRON_VERSION ?= 38.2.0
NATIVEFIER ?= nativefier
ICON_FLAG := $(if $(wildcard notion.png),--icon notion.png,)

LINUX_PLATFORM := linux
LINUX_ARCH ?= x64
LINUX_OUT := $(APP_NAME)-$(LINUX_PLATFORM)-$(LINUX_ARCH)
TAR_NAME := notion-linux-$(LINUX_ARCH).tar.xz

COMMON_FLAGS := \
	--name "$(APP_NAME)" \
	$(ICON_FLAG) \
	--inject ./inject.css \
	--internal-urls "$(INTERNAL_URLS)" \
	--user-agent "$(NOTION_USER_AGENT)" \
	--electron-version "$(ELECTRON_VERSION)" \
	--tray \
	--conceal

.PHONY: linux dist-linux check

check:
	@command -v $(NATIVEFIER) >/dev/null 2>&1 || { echo "未找到 $(NATIVEFIER)" >&2; exit 1; }

linux: check
	$(NATIVEFIER) "$(URL)" --platform $(LINUX_PLATFORM) --arch $(LINUX_ARCH) $(COMMON_FLAGS)
	@# 强制把图标放到 nativefier/Linux 输出目录中，避免桌面 Icon 指向的路径不存在
	@if [ -f notion.png ]; then \
		mkdir -p "$(LINUX_OUT)/resources/app" && cp -f notion.png "$(LINUX_OUT)/resources/app/icon.png"; \
	fi
	@if [ -f notion-linux-mux ]; then \
		cp -f notion-linux-mux "$(LINUX_OUT)/notion-linux-mux" && chmod +x "$(LINUX_OUT)/notion-linux-mux"; \
	fi

dist-linux: linux
	tar -cJf "$(TAR_NAME)" -C . "$(LINUX_OUT)"

release:
	git tag -a v$(VERSION) -m "Release v$(VERSION)"
	git push origin v$(VERSION)