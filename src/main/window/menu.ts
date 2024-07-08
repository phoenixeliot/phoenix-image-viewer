import { Menu, app, shell } from "electron";
import getDefaultMenuTemplate from "electron-default-menu";

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
  ],
});
const menu = Menu.buildFromTemplate(menuTemplate);

// console.dir({ defaultMenu: menuTemplate, menu }, { depth: null });

Menu.setApplicationMenu(menu);
