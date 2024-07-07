const path = require("path");
const { app, BrowserWindow, dialog, ipcMain } = require("electron/main");
require("./dialog/dialog.js");
require("./filesystem/filesystem.js");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));
};

app.whenReady().then(() => {
  createWindow();
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  // ipcMain.handle("dialog.showOpenDialog", (...args) => {
  //   dialog.showOpenDialog(args);
  //   // const webContents = event.sender;
  //   // const win = BrowserWindow.fromWebContents(webContents);
  //   // win.setTitle(title);
  // });
  app.on("ready", () => {
    //     const { dialog } = require("electron");
    //
    //     const selectedPaths = dialog.showOpenDialog();
    //     console.log(selectedPaths);
  });
});
