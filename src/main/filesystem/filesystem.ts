import chokidar from "chokidar";
import { BrowserWindow, IpcMainInvokeEvent, ipcMain } from "electron";
import * as fs from "fs";
import { readdirSync } from "fs";
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

export function registerFilesystemIpc(mainWindow: BrowserWindow) {
  ipcMain.handle(
    "move-file",
    async (
      event: IpcMainInvokeEvent,
      { from, to }: { from: string; to: string },
    ) => {
      console.log("Moving file", { from, to });
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.renameSync(from, to);
      return to;
    },
  );
}

export type UncombinedEvent = {
  eventName: "add" | "change" | "unlink" | "addDir" | "unlinkDir";
  path: string;
};

export type CombinedEvent = {
  eventName: "rename" | "renameDir";
  oldPath: string;
  newPath: string;
};

export type FileEvent = UncombinedEvent | CombinedEvent;

// NOTE: If we have multiple windows later we'll need multiple watchers. Maybe close it in onunload instead? Needs to handle if we refresh the app.
let watcher: chokidar.FSWatcher = null;

export async function watchFolder(
  folderPath: string,
  onEvents: (events: FileEvent[]) => unknown,
) {
  await watcher?.close();
  // Initialize watcher.
  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    atomic: true,
    alwaysStat: true,
  });

  let batchOfEvents: UncombinedEvent[] = [];
  // let lastEventTime = new Date();
  let eventTimeout: NodeJS.Timeout = null;

  // DEBUG numbers
  let previousEventMs: number = null;
  let longestDelayInEventsMs: number = 0;
  let earliestEventInBatchMs: number = null;
  let latestEventInBatchMs: number = null;

  // Throttled event publishing so that they get sent in batches when a bunch of things are moved at once
  function addEvent(event: UncombinedEvent) {
    // DEBUG times
    latestEventInBatchMs = performance.now();
    earliestEventInBatchMs ||= latestEventInBatchMs;
    const thisEventMs = latestEventInBatchMs - previousEventMs;
    longestDelayInEventsMs =
      previousEventMs == null
        ? longestDelayInEventsMs
        : Math.max(thisEventMs, longestDelayInEventsMs);
    previousEventMs = latestEventInBatchMs;

    clearTimeout(eventTimeout);
    batchOfEvents.push(event);
    eventTimeout = setTimeout(() => {
      console.log(
        `Time between first and last event: ${latestEventInBatchMs - earliestEventInBatchMs}ms`,
      );
      console.log(`Longest delay between events: ${longestDelayInEventsMs}ms`);
      onEvents(combineEvents(batchOfEvents));
      batchOfEvents = [];
      previousEventMs = null;
      // longestDelayInEventsMs = 0;
    }, 300); // this number will always be a race condition but the lowest time I've seen in reality is ~105ms
  }

  function combineEvents(events: UncombinedEvent[]): FileEvent[] {
    let resultEvents: FileEvent[] = events;
    const adds = events.filter((event) => event.eventName === "add");
    const unlinks = events.filter((event) => event.eventName === "unlink");
    if (adds.length === unlinks.length) {
      let renames = [];
      adds.sort((a, b) => a.path.localeCompare(b.path));
      unlinks.sort((a, b) => a.path.localeCompare(b.path));
      renames = adds.map((add, i) => {
        const unlink = unlinks[i];
        return {
          eventName: "rename" as const,
          oldPath: unlink.path,
          newPath: add.path,
        };
      });
      resultEvents = [
        ...renames,
        ...resultEvents.filter(
          (event) => !["add", "unlink"].includes(event.eventName),
        ),
      ];
    }
    const addDirs = events.filter((event) => event.eventName === "addDir");
    const unlinkDirs = events.filter(
      (event) => event.eventName === "unlinkDir",
    );
    if (adds.length === unlinks.length) {
      let dirRenames = [];
      addDirs.sort((a, b) => a.path.localeCompare(b.path));
      unlinkDirs.sort((a, b) => a.path.localeCompare(b.path));
      dirRenames = addDirs.map((add, i) => {
        const unlink = unlinkDirs[i];
        return {
          eventName: "renameDir" as const,
          oldPath: unlink.path,
          newPath: add.path,
        };
      });
      resultEvents = [
        ...dirRenames,
        ...resultEvents.filter(
          (event) => !["addDir", "unlinkDir"].includes(event.eventName),
        ),
      ];
    }

    return resultEvents;
  }

  const birthtimeByPath: Record<string, number> = {};
  const modifiedTimeByPath: Record<string, number> = {};

  // Add event listeners.
  watcher
    .on("add", (path: string, stats: fs.Stats) => {
      birthtimeByPath[path] = stats.birthtimeMs;
      modifiedTimeByPath[path] = stats.mtimeMs;
      addEvent({ eventName: "add", path });
    })
    .on("change", (path: string, stats: fs.Stats) => {
      addEvent({ eventName: "change", path });
    })
    .on("unlink", (path: string, stats: fs.Stats) => {
      addEvent({ eventName: "unlink", path });
    });

  // More possible events.
  watcher
    .on("addDir", (path: string, stats: fs.Stats) => {
      addEvent({ eventName: "addDir", path });
    })
    .on("unlinkDir", (path: string, stats: fs.Stats) => {
      addEvent({ eventName: "unlinkDir", path });
    })
    .on("error", (error: any) => console.log(`Watcher error: ${error}`))
    .on("ready", () => console.log("Initial scan complete. Ready for changes"));
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
