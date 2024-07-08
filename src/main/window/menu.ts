import { Menu, app, dialog, shell } from "electron";
import getDefaultMenuTemplate from "electron-default-menu";
import fs from "fs";
import { getImagePaths } from "../filesystem/filesystem";

const menuTemplate = getDefaultMenuTemplate(app, shell);
// const menu = new Menu();
menuTemplate.splice(1, 0, {
  label: "File",
  submenu: [
    {
      accelerator: ".",
      label: "Next Image",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("go-to-next-image");
      },
    },
    {
      accelerator: ",",
      label: "Previous Image",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("go-to-prev-image");
      },
    },
    {
      accelerator: "R",
      label: "Next Random Image",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("go-to-next-random-image");
      },
    },
    {
      accelerator: "Shift+R",
      label: "Previous Random Image",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("go-to-prev-random-image");
      },
    },
    {
      accelerator: "Command+O", // TODO: Add windows shortcut
      label: "Open...",
      click: async (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        const openResult = await dialog.showOpenDialog({
          properties: ["openDirectory"],
        });
        const firstFilePath = openResult.filePaths[0];
        const filePaths = fs.statSync(firstFilePath).isDirectory()
          ? await getImagePaths(firstFilePath)
          : openResult.filePaths;
        const filePathsWithProtocol = filePaths.map(
          (path) => `media://${path}`,
        );
        console.dir({ filenames: filePaths });
        browserWindow.webContents.send("open-files", filePathsWithProtocol);
      },
    },
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
