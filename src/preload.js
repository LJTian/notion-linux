const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tabsApi", {
  getState: () => ipcRenderer.invoke("tabs:get-state"),
  create: (url) => ipcRenderer.invoke("tabs:create", url),
  activate: (tabId) => ipcRenderer.invoke("tabs:activate", tabId),
  close: (tabId) => ipcRenderer.invoke("tabs:close", tabId),
  onState: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on("tabs:state", wrapped);
    return () => ipcRenderer.removeListener("tabs:state", wrapped);
  }
});
