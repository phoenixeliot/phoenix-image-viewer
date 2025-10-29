import FocusFolderDialog from "@components/FocusFolderDialog";
import MoveFileDialog from "@components/MoveFileDialog";
import {
  CombinedEvent,
  UncombinedEvent,
  type FileEvent,
} from "@main/filesystem/filesystem";
import { FileMeta } from "@renderer/types";
import constrain from "@src/utils/constrain";
import "@styles/app.scss";
import { type ipcRenderer, type IpcRendererEvent } from "electron";
import React, {
  ImgHTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Application.css";

// TODO: Figure out how to put this in a .d.ts file without it breaking everything when I import it
declare global {
  interface Window {
    dialog: any;
    fs: any;
    ipcRenderer: typeof ipcRenderer;
  }
}

const Application: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [darkTheme, setDarkTheme] = useState(true);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [focusFolder, setFocusFolder] = useState<string | null>(null);
  const [folderMetas, setFolderMetas] = useState<FileMeta[]>([]);
  const [fileMetas, setFileMetas] = useState<FileMeta[]>([]);
  const [currentImagePath, setCurrentImagePath] = useState(
    fileMetas[0]?.filePath,
  );
  // const [randomImageIndex, setRandomImageIndex] = useState(0);
  const [fileExtensionFilter, setFileExtensionFilter] = useState("");
  const [includeImagesFromFolders, setIncludeImagesFromFolders] =
    useState(true);
  const [sortOrder, setSortOrder] = useState("name");
  const [filterRegex, setFilterRegex] = useState("");
  const [showFileMoveDialog, setShowFileMoveDialog] = useState(false);
  const [showFocusFolderDialog, setShowFocusFolderDialog] = useState(false);
  const [prevImageIndex, setPrevImageIndex] = useState(0);
  const videoRef = useRef(null);
  const activeElement = useActiveElement();
  const [currentDirection, setCurrentDirection] = useState("right");
  const [muted, setMuted] = useState(true);

  const originalFilePaths = useMemo(
    () => fileMetas.map((fileMeta) => fileMeta.filePath),
    [fileMetas],
  );

  const fileExtensions = Array.from(
    originalFilePaths
      .filter((filePath) => filePath.includes("."))
      .map((filePath) => {
        const extension = filePath.split(".").at(-1).toLowerCase();
        return extension;
      })
      .reduce((set, extension) => {
        set.add(extension);
        return set;
      }, new Set<string>()),
  ).sort();

  const sortedFileMetas = useMemo(
    () =>
      fileMetas.toSorted((a, b) => {
        if (sortOrder === "last-modified") {
          const aDate = a.lastModified.getTime();
          const bDate = b.lastModified.getTime();
          return aDate > bDate ? -1 : aDate < bDate ? 1 : 0;
          // TODO: File size
        } else if (sortOrder === "path") {
          // Name is the default
          return a.filePath.localeCompare(b.filePath);
        } else {
          // Name is the default
          return a.filePath
            .split("/")
            .at(-1)
            .localeCompare(b.filePath.split("/").at(-1));
        }
      }),
    [fileMetas, sortOrder],
  );

  const filteredFileMetas = useMemo(() => {
    return sortedFileMetas.filter((fileMeta) => {
      const filename = fileMeta.filePath.split("/").at(-1);
      const extension = filename.split(".").at(-1).toLowerCase();
      if (focusFolder) {
        if (!fileMeta.filePath.startsWith(focusFolder)) return false;
      }
      if (fileExtensionFilter) {
        if (extension != fileExtensionFilter) return false;
      }
      if (filterRegex) {
        try {
          if (!fileMeta.filePath.match(new RegExp(filterRegex, "i")))
            return false;
        } catch (e) {
          console.error(e);
        }
      }
      if (!includeImagesFromFolders) {
        if (
          fileMeta.filePath
            .replace(rootPath, "")
            .replace(/^\/*/, "")
            .includes("/")
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    fileExtensionFilter,
    filterRegex,
    focusFolder,
    includeImagesFromFolders,
    rootPath,
    sortedFileMetas,
  ]);
  const numImages = filteredFileMetas.length;
  const constrainIndex = useCallback(
    (index: number) => {
      return constrain(index, numImages);
    },
    [numImages],
  );
  const pathIndexMap = useMemo(() => {
    const reverseMap: Record<any, number> = {};
    filteredFileMetas.forEach((value, index) => {
      reverseMap[value.filePath] = index;
    });
    return reverseMap;
  }, [filteredFileMetas]);

  const currentImageIndex = pathIndexMap[currentImagePath] || 0;
  const setCurrentImageIndex = useMemo(
    () => (index: number) => {
      console.log({ currentIndex: currentImageIndex, newIndex: index });
      setCurrentImagePath(filteredFileMetas[index]?.filePath);
    },
    [currentImageIndex, filteredFileMetas],
  );
  useEffect(() => {
    if (prevImageIndex != currentImageIndex)
      setPrevImageIndex(currentImageIndex);
  }, [prevImageIndex, currentImageIndex]);

  // If filter changes, check if image is in filter, and if not, reset the index
  useEffect(() => {
    if (
      filteredFileMetas.length > 0 &&
      !filteredFileMetas.some((meta) => meta.filePath === currentImagePath)
    ) {
      if (currentDirection === "right") {
        setCurrentImageIndex(constrain(prevImageIndex, numImages));
      } else {
        setCurrentImageIndex(constrain(prevImageIndex - 1, numImages));
      }
    }
  }, [
    currentDirection,
    currentImageIndex,
    currentImagePath,
    filteredFileMetas,
    includeImagesFromFolders,
    numImages,
    prevImageIndex,
    setCurrentImageIndex,
  ]);

  // Shuffle the indexes so we can map them
  const shuffledIndexes = useMemo(() => {
    const unshuffled = [];
    for (let i = 1; i < numImages; i++) {
      unshuffled.push(i);
    }
    const shuffled = [0]; // Always start with image 0 at random index 0 as well
    for (let i = 1; i < numImages; i++) {
      const item = unshuffled.splice(
        Math.floor(Math.random() * unshuffled.length),
        1,
      );
      shuffled.push(...item);
    }
    return shuffled;
  }, [numImages]);

  // Map from [index -> random next image index]
  const randomIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    shuffledIndexes.forEach((next, cur) => {
      map[cur] = next;
    });
    return map;
  }, [shuffledIndexes]);

  // Map from [random image index -> regular index]
  const reverseRandomIndexMap = useMemo(() => {
    return Object.fromEntries(
      Object.entries(randomIndexMap).map(([key, value]) => [
        value,
        Number(key),
      ]),
    );
  }, [randomIndexMap]);
  console.log({ shuffledIndexes, randomIndexMap, reverseRandomIndexMap });

  // Map from [index -> random previous image index]
  // This allows going backwards in the random order
  const prevRandomIndexMap = useMemo(() => {
    const map: Record<number, number> = {};
    shuffledIndexes.forEach((cur, prev) => {
      map[cur] = prev;
    });
    return map;
  }, [shuffledIndexes]);

  const randomImageIndex = randomIndexMap[currentImageIndex];

  const goToNextImage = useCallback(() => {
    if (numImages === 0) return;
    const newImageIndex = constrainIndex(currentImageIndex + 1);
    setCurrentImageIndex(newImageIndex);
    setCurrentDirection("right");
  }, [constrainIndex, currentImageIndex, numImages, setCurrentImageIndex]);

  const goToPrevImage = useCallback(() => {
    if (numImages === 0) return;
    const newImageIndex = constrainIndex(currentImageIndex + numImages - 1);
    setCurrentImageIndex(newImageIndex);
    setCurrentDirection("left");
  }, [constrainIndex, currentImageIndex, numImages, setCurrentImageIndex]);

  const goToNextRandomImage = useCallback(() => {
    if (numImages === 0) return;
    if (activeElement.tagName === "INPUT") return; // Prevent randoming when in the search box
    // Todo: un-confuse my names of "random index" and "regular index" and what they represent
    const randomIndex = randomIndexMap[currentImageIndex];
    const constrained = constrainIndex(randomIndex + 1);
    const nextImageIndex = reverseRandomIndexMap[constrained];
    console.log({
      currentImageIndex,
      randomIndex,
      constrained,
      nextRandomImage: nextImageIndex,
    });
    setCurrentImageIndex(nextImageIndex);
  }, [
    numImages,
    activeElement.tagName,
    randomIndexMap,
    constrainIndex,
    reverseRandomIndexMap,
    currentImageIndex,
    setCurrentImageIndex,
  ]);

  const goToPrevRandomImage = useCallback(() => {
    if (numImages === 0) return;
    if (activeElement.tagName === "INPUT") return; // Prevent randoming when in the search box
    // const newImageIndex = prevRandomIndexMap[currentImageIndex];
    const randomIndex = randomIndexMap[currentImageIndex];
    const constrained = constrainIndex(randomIndex - 1);
    const prevImageIndex = reverseRandomIndexMap[constrained];
    setCurrentImageIndex(prevImageIndex);
  }, [
    activeElement.tagName,
    constrainIndex,
    currentImageIndex,
    numImages,
    randomIndexMap,
    reverseRandomIndexMap,
    setCurrentImageIndex,
  ]);

  const openFiles = useCallback(
    (
      event: IpcRendererEvent,
      itemMetas: {
        rootPath: string;
        folderMetas: FileMeta[];
        fileMetas: FileMeta[];
      },
    ) => {
      setRootPath(itemMetas.rootPath);
      setFolderMetas(itemMetas.folderMetas);
      setFileMetas(itemMetas.fileMetas);
    },
    [],
  );

  const openMoveFileDialog = useCallback((event: IpcRendererEvent) => {
    setShowFileMoveDialog(true);
  }, []);
  const openFocusFolderDialog = useCallback((event: IpcRendererEvent) => {
    setShowFocusFolderDialog(true);
  }, []);
  const focusFilterInput = useCallback((event: IpcRendererEvent) => {
    const filterInput = document.querySelector(
      ".status-bar__input",
    ) as HTMLInputElement;
    filterInput.focus();
    filterInput.select();
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const filterInput = document.querySelector(
          ".status-bar__input",
        ) as HTMLInputElement;
        filterInput.blur();
      }
    });
  }, []);

  const moveFile = useCallback(
    async ({ from, to }: { from: string; to: string }) => {
      // TODO: Check success
      const newPath = await window.ipcRenderer.invoke("move-file", {
        from,
        to,
      });
      console.log(`Moving ${from} to ${newPath}`);
      console.log("newPath = to?", newPath === to);
      setFileMetas((metas) =>
        metas.map((meta) =>
          meta.filePath === from
            ? {
                ...meta,
                filePath: newPath,
              }
            : meta,
        ),
      );
      setCurrentImagePath(newPath);
    },
    [],
  );

  const handleWatchEvents = useCallback(
    (event: IpcRendererEvent, events: FileEvent[]) => {
      // Update paths when files got moved outside this app
      const unlinkedPaths = new Set(
        events
          .filter((e): e is UncombinedEvent => e.eventName === "unlink")
          .map((e) => e.path),
      );
      const addedPaths = new Set(
        events
          .filter((e): e is UncombinedEvent => e.eventName === "add")
          .map((e) => e.path),
      );
      const changedPaths = Object.fromEntries(
        events
          .filter((e): e is CombinedEvent => e.eventName === "rename")
          .map((e) => [e.oldPath, e.newPath]),
      );
      if (changedPaths[currentImagePath])
        setCurrentImagePath(changedPaths[currentImagePath]);
      setFileMetas((fileMetas) => {
        return fileMetas
          .map((fileMeta) => {
            return changedPaths[fileMeta.filePath]
              ? { ...fileMeta, filePath: changedPaths[fileMeta.filePath] }
              : fileMeta;
          })
          .filter((fileMeta) => {
            return !unlinkedPaths.has(fileMeta.filePath);
          })
          .concat(
            ...Array.from(addedPaths).map((path) => ({
              filePath: path,
              lastModified: new Date(),
            })),
          );
      });
      setFolderMetas((folderMetas) => {
        const changedPaths = Object.fromEntries(
          events
            .filter(
              (event): event is CombinedEvent =>
                event.eventName === "renameDir",
            )
            .map((event) => [event.oldPath, event.newPath]),
        );
        return folderMetas.map((folderMeta) => {
          return changedPaths[folderMeta.filePath]
            ? { ...folderMeta, filePath: changedPaths[folderMeta.filePath] }
            : folderMeta;
        });
      });
      // For every rename, change the path in the list of paths. Make sure not to break if we moved it from inside the app.
      // For every add, add it to the list of paths
      // For every unlink, remove it
      // Also process folder adds/removes
      // If one of the files moved is the one were were looking at, update currentImagePath
    },
    [currentImagePath],
  );

  useEffect(() => {
    const events = [
      ["go-to-next-random-image", goToNextRandomImage],
      ["go-to-prev-random-image", goToPrevRandomImage],
      ["go-to-next-image", goToNextImage],
      ["go-to-prev-image", goToPrevImage],
      ["open-files", openFiles],
      ["open-move-file-dialog", openMoveFileDialog],
      ["open-focus-folder-dialog", openFocusFolderDialog],
      ["focus-filter-input", focusFilterInput],
      [
        "get-current-file-path",
        () =>
          window.ipcRenderer.send(
            "get-current-file-path-reply",
            currentImagePath,
          ),
      ],
      ["watch-events", handleWatchEvents],
      [
        "set-sort-order",
        (event: IpcRendererEvent, order: string) => setSortOrder(order),
      ],
      [
        "set-muted",
        (event: IpcRendererEvent, muted: boolean) => setMuted(muted),
      ],
      [
        "set-include-images-from-folders",
        (event: IpcRendererEvent, enabled: boolean) => {
          console.log("setIncludeImagesFromFolders", enabled);
          return setIncludeImagesFromFolders(enabled);
        },
      ],
    ] as const;
    for (const [event, callback] of events) {
      window.ipcRenderer.on(event, callback);
    }
    return () => {
      for (const [event, callback] of events) {
        // window.ipcRenderer.off(event, callback); // Doesn't work, for some reason.
        window.ipcRenderer.removeAllListeners(event);
      }
    };
  }, [
    goToNextImage,
    goToPrevImage,
    goToNextRandomImage,
    goToPrevRandomImage,
    openFiles,
    openMoveFileDialog,
    openFocusFolderDialog,
    handleWatchEvents,
    currentImagePath,
    focusFilterInput,
  ]);

  // images: 0 1 2 3 4
  // randomized: 2 4 1 0 3
  // start: image 0, random index 3
  // next normal: image 1, random index 2
  // OR next random from 0: image 3, random index 4

  /**
   * On component mount
   */
  useEffect(() => {
    const useDarkTheme = parseInt(localStorage.getItem("dark-mode"));
    if (isNaN(useDarkTheme)) {
      setDarkTheme(true);
    } else if (useDarkTheme == 1) {
      setDarkTheme(true);
    } else if (useDarkTheme == 0) {
      setDarkTheme(false);
    }

    // Apply verisons
    const app = document.getElementById("app");
    const versions = JSON.parse(app.getAttribute("data-versions"));
    setVersions(versions);
  }, []);

  /**
   * On Dark theme change
   */
  useEffect(() => {
    if (darkTheme) {
      localStorage.setItem("dark-mode", "1");
      document.body.classList.add("dark-mode");
    } else {
      localStorage.setItem("dark-mode", "0");
      document.body.classList.remove("dark-mode");
    }
  }, [darkTheme]);

  /**
   * Toggle Theme
   */
  function toggleTheme() {
    setDarkTheme(!darkTheme);
  }

  const currentImageExtension = currentImagePath?.split(".").at(-1);
  const currentImageUrl =
    currentImagePath && encodeURI(`media://${currentImagePath}`);

  useEffect(() => {
    window.ipcRenderer.invoke("setBrowseState", {
      currentImagePath,
      rootPath,
      focusFolder,
    });
  }, [currentImagePath, focusFolder, rootPath]);

  // If filtering reduced the max to below the current index, jump back to 0
  if (currentImageIndex > numImages) {
    setCurrentImageIndex(0);
  }

  return (
    <>
      {rootPath && folderMetas && (
        <MoveFileDialog
          isOpen={showFileMoveDialog}
          rootPath={rootPath}
          folderMetas={folderMetas}
          onClose={() => setShowFileMoveDialog(false)}
          onSelectFolder={(destFolder) => {
            // TODO: Localize paths in Windows
            const pathChunks = currentImagePath.split("/");
            const baseName = pathChunks.slice(0, -1).join("/");
            const fileName = pathChunks.at(-1);
            const newPath = destFolder.replace(/\/?$/, "/") + fileName;
            if (
              !folderMetas.some(
                (folderMeta) => folderMeta.filePath === destFolder,
              )
            ) {
              setFolderMetas([
                ...folderMetas,
                {
                  filePath: destFolder,
                  lastModified: new Date(),
                },
              ]);
            }
            moveFile({ from: currentImagePath, to: newPath });
          }}
        />
      )}
      {rootPath && folderMetas && (
        <FocusFolderDialog
          isOpen={showFocusFolderDialog}
          rootPath={rootPath}
          folderMetas={folderMetas}
          onClose={() => setShowFocusFolderDialog(false)}
          onSelectFolder={(destFolder) => setFocusFolder(destFolder)}
        />
      )}
      <div className="image-container">
        {currentImageUrl && videoFormats.includes(currentImageExtension) ? (
          <video
            className="image"
            src={currentImageUrl}
            loop
            controls
            autoPlay
            ref={videoRef}
            onPlay={() => videoRef.current.focus()}
            muted={muted}
          />
        ) : (
          <ImageElement className="image" src={currentImageUrl} />
          // <img key={currentImageUrl} className="image" src={currentImageUrl} />
        )}
      </div>
      <div className="status-bar">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <label>
              Filename filter:{" "}
              <input
                className="status-bar__input"
                onChange={(e) => setFilterRegex(e.target.value)}
              />
            </label>
            <select onChange={(e) => setFileExtensionFilter(e.target.value)}>
              <option key={"None"} value={""}>
                Filter extension...
              </option>
              {fileExtensions.map((fileExtension) => (
                <option key={fileExtension} value={fileExtension}>
                  {fileExtension}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span>
              Showing image{" "}
              <input
                className="status-bar__input status-bar__input_numeric"
                style={{
                  textAlign: "right",
                  width: `calc(${currentImageIndex.toString().length}ex)`,
                  fontSize: "16px",
                }}
                type="number"
                onChange={(e) =>
                  setCurrentImageIndex(
                    constrainIndex(Number(e.target.value) - 1),
                  )
                }
                value={currentImageIndex + 1}
              />
              /<span>{filteredFileMetas.length}</span>{" "}
            </span>
            <span>
              Random index: {randomImageIndex + 1}/{filteredFileMetas.length}
            </span>
          </div>
        </div>
        <div
          style={{
            backgroundColor: "black",
            whiteSpace: "nowrap",
            overflowX: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {currentImagePath}
        </div>
      </div>
    </>
  );
};

// Trying to prevent gifs and videos from restarting when moved. Not working because the image path changes. Needs some additional workaround to avoid changing the path while viewing it?
const ImageElement = React.memo<ImgHTMLAttributes<HTMLImageElement>>(
  ({ ...attributes }) => {
    console.log("Re-rendering image!");
    return <img {...attributes} />;
  },
);
ImageElement.displayName = "ImageElement";

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
const videoFormats = ["avi", "mp4", "mpeg", "ogv", "ts", "webm", "3gp", "3g2"];

const useActiveElement = () => {
  const [active, setActive] = useState(document.activeElement);

  const handleFocusChange = (e: FocusEvent) => {
    setActive(document.activeElement);
  };

  useEffect(() => {
    document.addEventListener("focusin", handleFocusChange);
    document.addEventListener("focusout", handleFocusChange);
    return () => {
      document.removeEventListener("focusin", handleFocusChange);
      document.removeEventListener("focusout", handleFocusChange);
    };
  }, []);

  return active;
};

export default Application;
