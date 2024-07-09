import { Menu, app, dialog, shell } from "electron";
import getDefaultMenuTemplate from "electron-default-menu";
import settings from "electron-settings";
import fs from "fs";
import { getImagePaths } from "../filesystem/filesystem";

const menuTemplate = getDefaultMenuTemplate(app, shell);
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
        const filePaths = await getImagePaths(firstFilePath);
        const fileMetas = await Promise.all(
          filePaths.map(async (filePath) => {
            const stat = await fs.promises.stat(filePath);
            return {
              filePath,
              lastModified: stat.mtime,
              size: stat.size,
            };
          }),
        );
        browserWindow.webContents.send("open-files", fileMetas);
      },
    },
    {
      accelerator: "Command+Option+R", // TODO: Add windows shortcut
      label: "Reveal in Finder", // TODO: Localize windows text
      click: async (menuItem, browserWindow, modifiers) => {
        const windowName = "main"; // TODO: Make dynamic for multiple windows
        const browseState = (await settings.get(
          `browseState.${windowName}`,
        )) as any;
        const filePath = browseState["currentImagePath"] as string;
        shell.showItemInFolder(filePath);
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
      type: "separator",
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
      type: "separator",
    },
    {
      label: "Order by File Name",
      type: "radio",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("set-sort-order", "name");
      },
    },
    {
      label: "Order by Folder + File Name",
      type: "radio",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("set-sort-order", "path");
      },
    },
    {
      label: "Order by Modification date",
      type: "radio",
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send("set-sort-order", "last-modified");
      },
    },
    // {
    //   label: "Order by File Size",
    //   type: "radio",
    //   click: (menuItem, browserWindow, modifiers) => {
    //     console.log(menuItem.label);
    //     browserWindow.webContents.send("set-sort-order", "file-size");
    //   },
    // },
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
