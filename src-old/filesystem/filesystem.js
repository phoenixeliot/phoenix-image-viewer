const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");

ipcMain.handle("fs.readdirSync", async (event, dirPath) => {
  return fs.readdirSync(dirPath);
});
