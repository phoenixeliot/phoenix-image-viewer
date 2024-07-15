import { Dirent, readdirSync } from "fs";
import path from "path";

export function getImagePaths(dirPath: string, { recursive = false } = {}) {
  const items = getImageDirents(dirPath, { recursive });
  const result = {
    root: dirPath,
    folders: items.folders.map((item) => path.join(item.parentPath, item.name)),
    files: items.files.map((item) => path.join(item.parentPath, item.name)),
  };
  return result;
}

export function getImageDirents(dirPath: string, { recursive = false } = {}) {
  const items = readdirSync(dirPath, {
    recursive: false, // Otherwise we try to read some macOS folder and it fails, so we do it manually
    withFileTypes: true,
  }).filter((item) => !item.name.startsWith("."));
  const folders: typeof items = [];
  const files: typeof items = [];
  for (const item of items) {
    if (item.isFile()) {
      files.push(item);
    } else if (item.isDirectory()) {
      folders.push(item);
      const nestedItems = getImageDirents(
        path.join(item.parentPath, item.name),
      );
      folders.push(...nestedItems.folders);
      files.push(...nestedItems.files);
    } else {
      console.error("Item is somehow neither file nor directory: ", item);
      throw Error;
    }
  }
  return {
    folders,
    files: files.filter((fileMeta) => {
      return supportedFileExtensions.includes(fileMeta.name.split(".").at(-1));
    }),
  };
}

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
