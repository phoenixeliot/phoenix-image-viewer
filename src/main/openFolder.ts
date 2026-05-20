import { BrowserWindow, app, dialog } from "electron";
import fs from "fs";
import { getImagePaths, watchFolder } from "./filesystem/filesystem";

export async function openOpenFolderDialog(
  browserWindow: BrowserWindow,
): Promise<boolean> {
  app.focus({ steal: true });
  const openResult = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (openResult.canceled || !openResult.filePaths[0]) return false;

  const rootPath = openResult.filePaths[0];
  const folderAndFilePaths = await getImagePaths(rootPath);
  const folderMetas = await Promise.all(
    folderAndFilePaths.folders.map(async (filePath) => {
      const stat = await fs.promises.stat(filePath);
      return { filePath, lastModified: stat.mtime };
    }),
  );
  const fileMetas = await Promise.all(
    folderAndFilePaths.files.map(async (filePath) => {
      const stat = await fs.promises.stat(filePath);
      return { filePath, lastModified: stat.mtime, size: stat.size };
    }),
  );
  browserWindow.webContents.send("open-files", {
    rootPath,
    folderMetas,
    fileMetas,
  });
  watchFolder(rootPath, (events) => {
    browserWindow.webContents.send("watch-events", events);
  });
  return true;
}
