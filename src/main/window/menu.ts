import { Menu, app, dialog, shell } from "electron";
import getDefaultMenuTemplate from "electron-default-menu";
import settings from "electron-settings";
import fs from "fs";
import { getImagePaths, watchFolder } from "../filesystem/filesystem";

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
        const rootPath = openResult.filePaths[0];
        const folderAndFilePaths = await getImagePaths(rootPath);
        const folderMetas = await Promise.all(
          folderAndFilePaths.folders.map(async (filePath) => {
            const stat = await fs.promises.stat(filePath);
            return {
              filePath,
              lastModified: stat.mtime,
            };
          }),
        );
        const fileMetas = await Promise.all(
          folderAndFilePaths.files.map(async (filePath) => {
            const stat = await fs.promises.stat(filePath);
            return {
              filePath,
              lastModified: stat.mtime,
              size: stat.size,
            };
          }),
        );
        browserWindow.webContents.send("open-files", {
          rootPath: rootPath,
          folderMetas,
          fileMetas,
        });
        watchFolder(rootPath, (events) => {
          console.log("Got events", { events: events.slice(0, 3) });
          browserWindow.webContents.send("watch-events", events);
        });
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
    {
      accelerator: "Option+M", // TODO: Add windows shortcut
      label: "Move file...",
      click: async (menuItem, browserWindow, modifiers) => {
        browserWindow.webContents.send("open-move-file-dialog");
      },
    },
    {
      accelerator: "Option+F", // TODO: Add windows shortcut
      label: "Focus folder...",
      click: async (menuItem, browserWindow, modifiers) => {
        browserWindow.webContents.send("open-focus-folder-dialog");
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
    {
      type: "separator",
    },
    {
      label: "Include Images from Folders",
      type: "checkbox",
      checked: true,
      click: (menuItem, browserWindow, modifiers) => {
        console.log(menuItem.label);
        browserWindow.webContents.send(
          "set-include-images-from-folders",
          menuItem.checked,
        );
      },
    },
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
