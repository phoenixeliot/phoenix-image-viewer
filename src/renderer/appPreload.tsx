import "@main/window/windowPreload";
console.log("[ERWT]: Preload execution started");

const { contextBridge } = require("electron/renderer");

// Say something

// Stuff from before merging ERWT
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
  readdirSync: (dirPath: string) =>
    ipcRenderer.invoke("fs.readdirSync", dirPath),
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
  app.setAttribute("data-versions", JSON.stringify(versions));
});
