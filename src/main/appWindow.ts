import { app, BrowserWindow } from "electron";
import path from "path";
import { registerTitlebarIpc } from "@main/window/titlebarIpc";
import { windowStateKeeper } from "@main/stateKeeper";

// Electron Forge automatically creates these entry points
declare const APP_WINDOW_WEBPACK_ENTRY: string;
declare const APP_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

let appWindow: BrowserWindow;

/**
 * Create Application Window
 * @returns {BrowserWindow} Application Window Instance
 */
export async function createAppWindow(): Promise<BrowserWindow> {
  console.log("Creating new app window");
  // Create new window instance

  // https://stackoverflow.com/questions/51328586/how-to-restore-default-window-size-in-an-electron-app
  const mainWindowStateKeeper = await windowStateKeeper("main");

  appWindow = new BrowserWindow({
    x: mainWindowStateKeeper.x,
    y: mainWindowStateKeeper.y,
    width: mainWindowStateKeeper.width || 800,
    height: mainWindowStateKeeper.height || 1000,
    backgroundColor: "#202020",
    show: false,
    autoHideMenuBar: true,
    // frame: false,
    // titleBarStyle: "hidden",
    icon: path.resolve("assets/images/appIcon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      preload: APP_WINDOW_PRELOAD_WEBPACK_ENTRY,
      sandbox: false,
    },
  });

  mainWindowStateKeeper.track(appWindow);

  // Load the index.html of the app window.
  appWindow.loadURL(APP_WINDOW_WEBPACK_ENTRY);
  // appWindow.loadURL("https://boards.4chan.org/gif/");

  // Show window when its ready to
  appWindow.on("ready-to-show", () => appWindow.show());

  // Register Inter Process Communication for main process
  registerMainIPC();

  // Close all windows when main window is closed
  appWindow.on("close", () => {
    appWindow = null;
    app.quit();
  });

  // appWindow.webContents.on("go-to-random-image" as any, () => {
  //   console.log("Go to random image!");
  // });

  return appWindow;
}

/**
 * Register Inter Process Communication
 */
function registerMainIPC() {
  /**
   * Here you can assign IPC related codes for the application window
   * to Communicate asynchronously from the main process to renderer processes.
   */
  registerTitlebarIpc(appWindow);
}
