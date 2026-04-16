# CI: make dist-linux LINUX_ARCH=x64|arm64
APP_NAME := Notion-Linux
LINUX_ARCH ?= x64
LINUX_OUT := $(APP_NAME)-linux-$(LINUX_ARCH)
TAR_NAME := notion-linux-$(LINUX_ARCH).tar.xz
APPIMAGE_NAME := notion-linux-$(LINUX_ARCH).AppImage
ELECTRON_VERSION ?= 38.2.0
NOTION_USER_AGENT ?= Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36
NPM ?= npm
NPM_REGISTRY ?= https://registry.npmjs.org
ELECTRON_MIRROR ?= https://npmmirror.com/mirrors/electron/
NPM_CACHE ?= $(CURDIR)/.npm-cache
ELECTRON_CACHE ?= $(CURDIR)/.electron-cache
USE_NPM_CI ?= 0

.PHONY: check deps clean clean-appimage linux dist-linux appimage dist-appimage release

check:
	@command -v $(NPM) >/dev/null 2>&1 || { echo "未找到 $(NPM)" >&2; exit 1; }

deps: check
	@mkdir -p "$(NPM_CACHE)" "$(ELECTRON_CACHE)"
	@if [ "$(USE_NPM_CI)" = "1" ] && [ -f package-lock.json ]; then \
		ELECTRON_MIRROR="$(ELECTRON_MIRROR)" ELECTRON_CACHE="$(ELECTRON_CACHE)" $(NPM) ci --registry="$(NPM_REGISTRY)" --cache="$(NPM_CACHE)"; \
	else \
		ELECTRON_MIRROR="$(ELECTRON_MIRROR)" ELECTRON_CACHE="$(ELECTRON_CACHE)" $(NPM) install --registry="$(NPM_REGISTRY)" --cache="$(NPM_CACHE)" --package-lock=false; \
	fi

clean:
	rm -rf "$(LINUX_OUT)" "$(TAR_NAME)"

clean-appimage:
	rm -rf dist "$(APPIMAGE_NAME)"

linux: deps clean
	ELECTRON_VERSION="$(ELECTRON_VERSION)" \
	NOTION_USER_AGENT="$(NOTION_USER_AGENT)" \
	ELECTRON_MIRROR="$(ELECTRON_MIRROR)" \
	ELECTRON_CACHE="$(ELECTRON_CACHE)" \
	npm_config_electron_mirror="$(ELECTRON_MIRROR)" \
	npm_config_disturl="$(ELECTRON_MIRROR)" \
	$(NPM) run dist:linux:$(LINUX_ARCH)

dist-linux: linux
	tar -cJf "$(TAR_NAME)" -C . "$(LINUX_OUT)"

appimage: deps clean-appimage
	ELECTRON_VERSION="$(ELECTRON_VERSION)" \
	NOTION_USER_AGENT="$(NOTION_USER_AGENT)" \
	ELECTRON_MIRROR="$(ELECTRON_MIRROR)" \
	ELECTRON_CACHE="$(ELECTRON_CACHE)" \
	npm_config_electron_mirror="$(ELECTRON_MIRROR)" \
	npm_config_disturl="$(ELECTRON_MIRROR)" \
	$(NPM) run dist:appimage:$(LINUX_ARCH)

dist-appimage: appimage
	@set -e; \
	f="$$(ls -1t dist/*.AppImage 2>/dev/null | awk 'NR==1{print;exit}')"; \
	if [ -z "$$f" ]; then \
		echo "未找到 AppImage 产物（架构 $(LINUX_ARCH)）" >&2; \
		exit 1; \
	fi; \
	cp -f "$$f" "$(APPIMAGE_NAME)"

release:
	git tag -a v$(VERSION) -m "Release v$(VERSION)"
	git push origin v$(VERSION)