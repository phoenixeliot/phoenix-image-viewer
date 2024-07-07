import {
  Menu,
  MenuItem,
  app,
  ipcMain,
  ipcRenderer,
  shell,
  webContents,
} from "electron";
import getDefaultMenuTemplate from "electron-default-menu";

const menuTemplate = getDefaultMenuTemplate(app, shell);
// const menu = new Menu();
menuTemplate.splice(1, 0, {
  label: "File",
  submenu: [
    {
      accelerator: "R",
      label: "Next random image",
      click: (menuItem, browserWindow, modifiers) => {
        // console.log(menuItem, browserWindow, modifiers);
        browserWindow.webContents.send("go-to-next-random-image");
      },
    },
    {
      accelerator: "Shift+R",
      label: "Previous random image",
      click: (menuItem, browserWindow, modifiers) => {
        // console.log(menuItem, browserWindow, modifiers);
        browserWindow.webContents.send("go-to-prev-random-image");
      },
    },
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
