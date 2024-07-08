import { Dirent, readdirSync } from "fs";
import path from "path";

export function getImagePaths(dirPath: string, { recursive = false } = {}) {
  const result = getImageMetas(dirPath, { recursive }).map((item) =>
    path.join(item.path, item.name),
  );
  console.log({ result });
  return result;
}

export function getImageMetas(dirPath: string, { recursive = false } = {}) {
  const items = readdirSync(dirPath, {
    recursive: false, // Otherwise we try to read some macOS folder and it fails, so we do it manually
    withFileTypes: true,
  }).filter((item) => !item.name.startsWith("."));
  Dirent;
  const result: typeof items = [];
  for (const item of items) {
    if (item.isFile()) {
      result.push(item);
    } else if (item.isDirectory()) {
      result.push(...getImageMetas(path.join(item.parentPath, item.name)));
    } else {
      console.error("Item is somehow neither file nor directory: ", item);
      throw Error;
    }
  }
  return result;
}
