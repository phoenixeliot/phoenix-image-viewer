// import "../../typings/index.d.ts";
// import "../types.d.ts";
import React, { useCallback, useEffect, useState } from "react";
import "@styles/app.scss";
import icons from "@components/icons";

declare global {
  interface Window {
    dialog: any;
    fs: any;
  }
}

// TODO: Figure out how to put this in a .d.ts file without it breaking everything

const Application: React.FC = () => {
  const [counter, setCounter] = useState(0);
  const [darkTheme, setDarkTheme] = useState(true);
  const [versions, setVersions] = useState<Record<string, string>>({});
  const [filePaths, setFilePaths] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(1);
  console.log({ filePaths });

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
      console.log({ dirPath });
      console.log({ result });
      console.log(await result);
      const filenames = await window.fs.readdirSync(dirPath);
      setFilePaths(
        filenames.map((filename: string) => {
          // compat: Test this on windows paths
          // return new URL(`file://${dirPath}/${filename}`).href; // HACK to do path.join type behavior
          return `local-image://${dirPath}/${filename}`;
        }),
      );
      console.log({ filenames });
      console.log({ filePaths });
      // document.querySelector("#image-count").textContent = filePaths.length;
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div id="erwt">
      <div className="">
        <div className="center">
          <button onClick={handleClickOpenFolder}>Open folder</button>
          <span className="themed">
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
            <button
              onClick={() =>
                setCurrentImageIndex((i) =>
                  Math.floor(Math.random() * filePaths.length),
                )
              }
            >
              Random
            </button>
          </div>
          {filePaths[currentImageIndex] ?? ""}
        </div>
      </div>
      <div className="image-viewer">
        <img
          className="image-viewer__image"
          src={filePaths[currentImageIndex]}
        />
      </div>
    </div>
  );
};

export default Application;
