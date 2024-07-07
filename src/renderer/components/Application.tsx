// import "../../typings/index.d.ts";
// import "../types.d.ts";
import React, { useCallback, useEffect, useMemo, useState } from "react";
// import "@styles/app.scss";
import icons from "@components/icons";
import { type ipcRenderer } from "electron";

declare global {
  interface Window {
    dialog: any;
    fs: any;
    ipcRenderer: typeof ipcRenderer;
  }
}

// TODO: Figure out how to put this in a .d.ts file without it breaking everything

const Application: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [darkTheme, setDarkTheme] = useState(true);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [filePaths, setFilePaths] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // console.log({ filePaths });
  const [randomImageIndex, setRandomImageIndex] = useState(0);
  const numImages = filePaths.length;

  const fileExtensions = filePaths
    .filter((path) => path.includes("."))
    .map((filePath) => {
      const extension = filePath.split(".").at(-1);
      return extension;
    })
    .reduce((set, extension) => {
      set.add(extension);
      return set;
    }, new Set());

  const randomIndexMap = useMemo(() => {
    const unshuffled = [];
    for (let i = 0; i < filePaths.length; i++) {
      unshuffled.push(i);
    }
    const shuffled = [];
    for (let i = 0; i < filePaths.length; i++) {
      const item = unshuffled.splice(
        Math.floor(Math.random() * unshuffled.length),
        1,
      );
      shuffled.push(...item);
    }
    return shuffled;
  }, [filePaths.length]);

  const reverseRandomIndexMap = useMemo(() => {
    const reverseMap: number[] = [];
    randomIndexMap.forEach((value, index) => {
      reverseMap[value] = index;
    });
    return reverseMap;
  }, [randomIndexMap]);

  const goToNextRandomImage = useCallback(() => {
    if (numImages === 0) return;
    console.log("Going to next random image");
    const newRandomIndex = (randomImageIndex + 1) % numImages;
    const newImageIndex = reverseRandomIndexMap[newRandomIndex];
    setRandomImageIndex(newRandomIndex);
    setCurrentImageIndex(newImageIndex);
    console.log({
      currentImageIndex,
      newImageIndex,
      randomImageIndex,
      newRandomIndex,
    });
  }, [currentImageIndex, numImages, randomImageIndex, reverseRandomIndexMap]);

  const goToPrevRandomImage = useCallback(() => {
    if (numImages === 0) return;
    const newRandomIndex = (randomImageIndex + numImages - 1) % numImages;
    const newImageIndex = reverseRandomIndexMap[newRandomIndex];
    setRandomImageIndex(newRandomIndex);
    setCurrentImageIndex(newImageIndex);
  }, [numImages, randomImageIndex, reverseRandomIndexMap]);

  useEffect(() => {
    const events = [
      ["go-to-next-random-image", goToNextRandomImage],
      ["go-to-prev-random-image", goToPrevRandomImage],
    ] as const;
    for (const [event, callback] of events) {
      window.ipcRenderer.on(event, callback);
    }
    return () => {
      for (const [event, callback] of events) {
        window.ipcRenderer.off(event, callback);
      }
    };
  });

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

  const handleClickOpenFolder = useCallback(async () => {
    try {
      const result = await window.dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      const dirPath = result.filePaths[0];
      const filenames: string[] = await window.fs.getImagePaths(dirPath);
      console.dir({ filenames });
      setFilePaths(
        filenames
          .filter((filePath) => {
            const filename = filePath.split("/").at(-1);
            const extension = filename.split(".").at(-1);
            // if (filename === ".DS_Store") return false;
            // if (extension != "webm") return false;
            return true;
          })
          .map((filePath) => {
            // compat: Test this on windows paths
            // return new URL(`file://${dirPath}/${filename}`).href; // HACK to do path.join type behavior
            return `local-image://${filePath}`;
          }),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const currentImagePath = filePaths[currentImageIndex];
  const currentImageExtension = currentImagePath?.split(".").at(-1);
  return (
    <div id="erwt">
      <div className="">
        <div className="center">
          <button onClick={handleClickOpenFolder}>Open folder</button>
          <span className="themed" style={{ backgroundColor: "black" }}>
            Showing image {currentImageIndex + 1}/
            <span>{filePaths.length}</span>{" "}
          </span>
          <div>
            <button onClick={() => setCurrentImageIndex((i) => i + 1)}>
              Next
            </button>
            <button onClick={() => setCurrentImageIndex((i) => i - 1)}>
              Prev
            </button>
          </div>
          <div style={{ backgroundColor: "black" }}>{currentImagePath}</div>
        </div>
      </div>
      <div className="-image-viewer">
        {currentImageExtension === "webm" ? (
          <video
            className="image-viewer__image"
            src={currentImagePath}
            loop
            controls
            autoPlay
          />
        ) : (
          <img className="image-viewer__image" src={currentImagePath} />
        )}
      </div>
    </div>
  );
};

export default Application;
