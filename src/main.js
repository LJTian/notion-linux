const path = require("path");
const { app, BrowserWindow, BrowserView, ipcMain } = require("electron");

const START_URL = "https://www.notion.com";
const TAB_BAR_HEIGHT = 42;
const MIN_TAB_WIDTH = 120;
const MAX_TAB_WIDTH = 220;

const NOTION_USER_AGENT =
  process.env.NOTION_USER_AGENT ||
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

let mainWindow = null;
let activeTabId = null;
let tabSeq = 0;
const tabs = new Map();

function tabSummary(tab) {
  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    loading: tab.loading
  };
}

function currentState() {
  return {
    activeTabId,
    minTabWidth: MIN_TAB_WIDTH,
    maxTabWidth: MAX_TAB_WIDTH,
    tabs: [...tabs.values()].map(tabSummary)
  };
}

function sendState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("tabs:state", currentState());
}

function updateViewBounds() {
  if (!mainWindow || !activeTabId) return;
  const tab = tabs.get(activeTabId);
  if (!tab) return;

  const [width, height] = mainWindow.getContentSize();
  tab.view.setBounds({
    x: 0,
    y: TAB_BAR_HEIGHT,
    width,
    height: Math.max(0, height - TAB_BAR_HEIGHT)
  });
  tab.view.setAutoResize({ width: true, height: true });
}

function setActiveTab(tabId) {
  const next = tabs.get(tabId);
  if (!next || !mainWindow || mainWindow.isDestroyed()) return;

  activeTabId = next.id;
  mainWindow.setBrowserView(next.view);
  updateViewBounds();
  sendState();
}

function attachTabEvents(tab) {
  const wc = tab.view.webContents;
  wc.on("did-start-loading", () => {
    tab.loading = true;
    sendState();
  });
  wc.on("did-stop-loading", () => {
    tab.loading = false;
    sendState();
  });
  wc.on("page-title-updated", (event, title) => {
    event.preventDefault();
    tab.title = title || "Notion";
    sendState();
  });
  wc.on("did-navigate", (_event, url) => {
    tab.url = url;
    sendState();
  });
  wc.on("did-navigate-in-page", (_event, url) => {
    tab.url = url;
    sendState();
  });
}

function createTab(url = START_URL) {
  const id = `tab-${++tabSeq}`;
  const view = new BrowserView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const tab = {
    id,
    view,
    title: "Notion",
    url,
    loading: true
  };
  tabs.set(id, tab);
  attachTabEvents(tab);

  view.webContents.setUserAgent(NOTION_USER_AGENT);
  view.webContents.loadURL(url);

  if (!activeTabId) {
    setActiveTab(id);
  } else {
    sendState();
  }
}

function closeTab(tabId) {
  const tab = tabs.get(tabId);
  if (!tab) return;

  const wasActive = activeTabId === tabId;
  tab.view.webContents.destroy();
  tabs.delete(tabId);

  if (tabs.size === 0) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBrowserView(null);
    }
    createTab(START_URL);
    return;
  }

  if (wasActive) {
    const fallback = [...tabs.keys()][tabs.size - 1];
    setActiveTab(fallback);
  } else {
    sendState();
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "Notion Linux",
    backgroundColor: "#eceae5",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  mainWindow.on("resize", updateViewBounds);
  mainWindow.on("closed", () => {
    mainWindow = null;
    tabs.clear();
    activeTabId = null;
  });

  createTab(START_URL);
}

ipcMain.handle("tabs:get-state", async () => currentState());
ipcMain.handle("tabs:create", async (_event, url) => {
  createTab(url || START_URL);
  return currentState();
});
ipcMain.handle("tabs:activate", async (_event, tabId) => {
  setActiveTab(tabId);
  return currentState();
});
ipcMain.handle("tabs:close", async (_event, tabId) => {
  closeTab(tabId);
  return currentState();
});

app.whenReady().then(createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
