import { app, BrowserWindow, Menu, MenuItem, net, protocol } from "electron";
import { createAppWindow } from "./appWindow";
import "./dialog/dialog";
import "./filesystem/filesystem";
// import "./window/menu";
import path from "path";
import { pathToFileURL } from "url";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-image",
    privileges: {
      standard: true,
      secure: false,
      supportFetchAPI: false,
    },
  },
]);

app.whenReady().then(() => {
  protocol.handle("local-image", (req) => {
    console.log("Handling local-image:", req);
    const pathToMedia = "/" + req.url.replace("local-image://", "");
    console.log({ pathToMedia });
    return net.fetch(`file://${pathToMedia}`);

    //     const { host, pathname } = new URL(req.url);
    //     // if (host === "bundle") {
    //     // NB, this checks for paths that escape the bundle, e.g.
    //     // app://bundle/../../secret_file.txt
    //     const pathToServe = path.resolve(__dirname, pathname);
    //     const relativePath = path.relative(__dirname, pathToServe);
    //     const isSafe =
    //       relativePath &&
    //       !relativePath.startsWith("..") &&
    //       !path.isAbsolute(relativePath);
    //     // if (!isSafe) {
    //     //   return new Response("bad", {
    //     //     status: 400,
    //     //     headers: { "content-type": "text/html" },
    //     //   });
    //     // }
    //
    //     return net.fetch(pathToFileURL(pathToServe).toString());
    //     // } else if (host === "api") {
    //     //   return net.fetch("https://api.my-server.com/" + pathname, {
    //     //     method: req.method,
    //     //     headers: req.headers,
    //     //     body: req.body,
    //     //   });
    //     // }
  });
});

/** Handle creating/removing shortcuts on Windows when installing/uninstalling. */
if (require("electron-squirrel-startup")) {
  app.quit();
}

/**
 * This method will be called when Electron has finished
 * initialization and is ready to create browser windows.
 * Some APIs can only be used after this event occurs.
 */
app.on("ready", createAppWindow);

/**
 * Emitted when the application is activated. Various actions can
 * trigger this event, such as launching the application for the first time,
 * attempting to re-launch the application when it's already running,
 * or clicking on the application's dock or taskbar icon.
 */
app.on("activate", () => {
  /**
   * On OS X it's common to re-create a window in the app when the
   * dock icon is clicked and there are no other windows open.
   */
  if (BrowserWindow.getAllWindows().length === 0) {
    createAppWindow();
  }
});

/**
 * Emitted when all windows have been closed.
 */
app.on("window-all-closed", () => {
  /**
   * On OS X it is common for applications and their menu bar
   * to stay active until the user quits explicitly with Cmd + Q
   */
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/**
 * In this file you can include the rest of your app's specific main process code.
 * You can also put them in separate files and import them here.
 */
