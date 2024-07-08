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
      accelerator: "Command+O", // TODO: Add windows shortcut
      label: "Open...",
      click: async (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        const openResult = await dialog.showOpenDialog({
          properties: ["openDirectory"],
        });
        const firstFilePath = openResult.filePaths[0];
        const filePaths = (
          fs.statSync(firstFilePath).isDirectory()
            ? await getImagePaths(firstFilePath)
            : openResult.filePaths
        ).filter((filePath) => {
          return supportedFileExtensions.includes(filePath.split(".").at(-1));
        });
        const filePathsWithProtocol = filePaths.map(
          (path) => `media://${path}`,
        );
        console.dir({ filenames: filePaths });
        browserWindow.webContents.send("open-files", filePathsWithProtocol);
      },
    },
  ],
});
menuTemplate.splice(3, 0, {
  label: "Browse",
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
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// The other ones in this list seem to just not work at all.
const supportedFileExtensions = [
  // "avi", // Seems not to actually work, despite being in the MDN list.
  // "mpeg",
  "mp4",
  "3g2",
  // "3gp",
  "apng",
  "avif",
  "bmp",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "png",
  "svg",
  // "tif",
  // "tiff",
  // "ts",
  "webm",
  "webp",
  "ogv",
];

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
