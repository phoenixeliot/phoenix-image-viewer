import "@styles/app.scss";
import { type ipcRenderer } from "electron";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const [filterByWebm, setFilterByWebm] = useState(false);
  const videoRef = useRef(null);

  const filteredFilePaths = useMemo(() => {
    return filePaths.filter((filePath) => {
      const filename = filePath.split("/").at(-1);
      const extension = filename.split(".").at(-1);
      if (filterByWebm) {
        if (extension != "webm") return false;
      }
      return true;
    });
  }, [filePaths, filterByWebm]);
  const numImages = filteredFilePaths.length;

  console.log({ filteredFilePaths });

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
    for (let i = 0; i < filteredFilePaths.length; i++) {
      unshuffled.push(i);
    }
    const shuffled = [];
    for (let i = 0; i < filteredFilePaths.length; i++) {
      const item = unshuffled.splice(
        Math.floor(Math.random() * unshuffled.length),
        1,
      );
      shuffled.push(...item);
    }
    return shuffled;
  }, [filteredFilePaths.length]);

  const reverseRandomIndexMap = useMemo(() => {
    const reverseMap: number[] = [];
    randomIndexMap.forEach((value, index) => {
      reverseMap[value] = index;
    });
    return reverseMap;
  }, [randomIndexMap]);

  const goToNextImage = useCallback(() => {
    if (numImages === 0) return;
    const newImageIndex = (currentImageIndex + 1) % numImages;
    const newRandomImageIndex = randomIndexMap[newImageIndex];
    setRandomImageIndex(newRandomImageIndex);
    setCurrentImageIndex(newImageIndex);
  }, [currentImageIndex, numImages, randomIndexMap]);

  const goToPrevImage = useCallback(() => {
    if (numImages === 0) return;
    const newImageIndex = (currentImageIndex + numImages - 1) % numImages;
    const newRandomImageIndex = randomIndexMap[newImageIndex];
    setRandomImageIndex(newRandomImageIndex);
    setCurrentImageIndex(newImageIndex);
  }, [currentImageIndex, numImages, randomIndexMap]);

  const goToNextRandomImage = useCallback(() => {
    if (numImages === 0) return;
    console.log("Going to next random image");
    const newRandomImageIndex = (randomImageIndex + 1) % numImages;
    const newImageIndex = reverseRandomIndexMap[newRandomImageIndex];
    setRandomImageIndex(newRandomImageIndex);
    setCurrentImageIndex(newImageIndex);
  }, [numImages, randomImageIndex, reverseRandomIndexMap]);

  const goToPrevRandomImage = useCallback(() => {
    if (numImages === 0) return;
    const newRandomImageIndex = (randomImageIndex + numImages - 1) % numImages;
    const newImageIndex = reverseRandomIndexMap[newRandomImageIndex];
    setRandomImageIndex(newRandomImageIndex);
    setCurrentImageIndex(newImageIndex);
  }, [numImages, randomImageIndex, reverseRandomIndexMap]);

  useEffect(() => {
    const events = [
      ["go-to-next-random-image", goToNextRandomImage],
      ["go-to-prev-random-image", goToPrevRandomImage],
      ["go-to-next-image", goToNextImage],
      ["go-to-prev-image", goToPrevImage],
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
        filenames.map((filePath) => {
          // compat: Test this on windows paths
          // return new URL(`file://${dirPath}/${filename}`).href; // HACK to do path.join type behavior
          return `media://${filePath}`;
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const currentImagePath = filteredFilePaths[currentImageIndex];
  const currentImageExtension = currentImagePath?.split(".").at(-1);
  return (
    <div id="erwt">
      <div className="">
        <div className="center">
          <button onClick={handleClickOpenFolder}>Open folder</button>
          <label>
            <input
              type="checkbox"
              onChange={(e) => setFilterByWebm(e.target.checked)}
            />
            Only webm
          </label>
          <span className="themed" style={{ backgroundColor: "black" }}>
            Showing image {currentImageIndex + 1}/
            <span>{filteredFilePaths.length}</span>{" "}
          </span>
          <div style={{ backgroundColor: "black" }}>{currentImagePath}</div>
        </div>
      </div>
      <div className="image-viewer">
        {currentImageExtension === "webm" ? (
          <video
            className="image-viewer__image"
            src={currentImagePath}
            loop
            controls
            autoPlay
            ref={videoRef}
            onPlay={() => videoRef.current.focus()}
          />
        ) : (
          <img className="image-viewer__image" src={currentImagePath} />
        )}
      </div>
    </div>
  );
};

export default Application;
