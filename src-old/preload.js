console.log("Preload!");

const { contextBridge } = require("electron/renderer");

contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

const { dialog, ipcRenderer } = require("electron");
console.log({ dialog });
contextBridge.exposeInMainWorld("dialog", {
  showOpenDialog: () => ipcRenderer.invoke("dialog.showOpenDialog"),
});
contextBridge.exposeInMainWorld("fs", {
  readdirSync: (dirPath) => ipcRenderer.invoke("fs.readdirSync", dirPath),
});
