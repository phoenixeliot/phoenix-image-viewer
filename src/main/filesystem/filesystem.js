const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");
const path = require("path");

ipcMain.handle("getImagePaths", async (event, dirPath, { recursive }) => {
  const result = findImages(dirPath, recursive).map((item) =>
    path.join(item.path, item.name),
  );
  console.log({ result });
  return result;
});

function findImages(dirPath, recursive = false) {
  const items = fs
    .readdirSync(dirPath, {
      recursive: false, // Otherwise we try to read some macOS folder and it fails, so we do it manually
      withFileTypes: true,
    })
    .filter((item) => !item.name.startsWith("."));
  const result = [];
  for (const item of items) {
    const typeSymbol = Object.getOwnPropertySymbols(item).find(
      (s) => s.description === "type",
    );
    const type = item[typeSymbol];
    if (type === 1) {
      result.push(item);
    } else if (type === 2) {
      result.push(...findImages(path.join(item.parentPath, item.name)));
    } else {
      console.error("Unknown item type: ", item);
      throw Error;
    }
  }
  return result;
}
