import "@main/window/windowPreload";
const { contextBridge } = require("electron/renderer");

// Say something
console.log("[ERWT]: Preload execution started");

// Stuff from before merging ERWT
contextBridge.exposeInMainWorld("versions", {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
});

const { dialog, ipcRenderer } = require("electron");
// console.log({ dialog });
// contextBridge.exposeInMainWorld("dialog", {
//   showOpenDialog: () => ipcRenderer.invoke("dialog.showOpenDialog"),
// });

// Expose IPC methods
contextBridge.exposeInMainWorld("ipcRenderer", {
  // TODO[security]: Make more specific
  on: (name: string, callback: any) => {
    ipcRenderer.on(name, callback);
  },
  off: (name: string, callback: any) => {
    throw new Error(
      "ipcRenderer.off doesn't work, use removeAllListeners instead",
    );
  },
  removeAllListeners: (name: string) => {
    ipcRenderer.removeAllListeners(name);
  },
  invoke: (name: string, ...args: any[]) => {
    return ipcRenderer.invoke(name, ...args);
  },
});

// Get versions
window.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const { env } = process;
  const versions: Record<string, unknown> = {};

  // ERWT Package version
  versions["erwt"] = env["npm_package_version"];
  versions["license"] = env["npm_package_license"];

  // Process versions
  for (const type of ["chrome", "node", "electron"]) {
    versions[type] = process.versions[type].replace("+", "");
  }

  // NPM deps versions
  for (const type of ["react"]) {
    const v = env["npm_package_dependencies_" + type];
    if (v) versions[type] = v.replace("^", "");
  }

  // NPM @dev deps versions
  for (const type of ["webpack", "typescript"]) {
    const v = env["npm_package_devDependencies_" + type];
    if (v) versions[type] = v.replace("^", "");
  }

  // Set versions to app data
  app?.setAttribute("data-versions", JSON.stringify(versions));
});
