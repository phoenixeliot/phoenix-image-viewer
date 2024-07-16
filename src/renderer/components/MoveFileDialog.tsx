import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type FileMeta } from "@renderer/types";
import constrain from "@src/utils/constrain";

export default function MoveFileDialog({
  rootPath,
  folderMetas,
  onClose,
  onSelectFolder,
}: {
  rootPath: string;
  folderMetas: FileMeta[];
  onClose: () => unknown;
  onSelectFolder: (folderPath: string) => unknown;
}) {
  const inputRef = useRef(null);
  const currentItemRef = useRef(null);
  const [filterText, setFilterText] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(folderMetas[0].filePath);
  const folderPaths = useMemo(
    () =>
      folderMetas
        .map((folderMeta) => folderMeta.filePath.replace(rootPath, ""))
        .filter((filePath) => filePath.includes(filterText)),
    [filterText, folderMetas, rootPath],
  );

  useEffect(() => {
    setSelectedFolder(folderPaths[0]);
  }, [filterText, folderPaths]);

  const absoluteFromRelative = useCallback(
    (relativePath: string) => {
      return rootPath + relativePath;
    },
    [rootPath],
  );

  useEffect(() => {
    const arrowHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedFolder(
          folderPaths[
            constrain(
              folderPaths.indexOf(selectedFolder) - 1,
              folderPaths.length,
            )
          ],
        );
        setTimeout(() => {
          currentItemRef.current?.scrollIntoView({ block: "nearest" });
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedFolder(
          folderPaths[
            constrain(
              folderPaths.indexOf(selectedFolder) + 1,
              folderPaths.length,
            )
          ],
        );
        setTimeout(() => {
          currentItemRef.current?.scrollIntoView({ block: "nearest" });
        });
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onClose();
        onSelectFolder(absoluteFromRelative(selectedFolder));
      }
    };
    document.addEventListener("keydown", arrowHandler);
    document.addEventListener("keydown", arrowHandler);
    return () => {
      document.removeEventListener("keydown", arrowHandler);
      document.removeEventListener("keydown", arrowHandler);
    };
  });

  return (
    <div className="action-dialog">
      <div className="action-dialog__header">
        <input
          ref={inputRef}
          className="action-dialog__input"
          autoFocus
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          onBlur={() => inputRef.current.focus()}
        />
      </div>
      <div className="action-dialog__list">
        {folderPaths.map((folderPath) => {
          const parts = folderPath.split("/");
          const folderName = parts.at(-1);
          const isSelected = selectedFolder === folderPath;
          return (
            <div
              key={folderPath}
              ref={isSelected ? currentItemRef : null}
              className={`action-dialog__folder-button ${isSelected ? "action-dialog__list-item_selected" : ""}`}
              style={{ marginLeft: `${(parts.length - 1) * 1}ex` }}
              onClick={() => {
                debugger;
                console.log({ rootPath, folderPath });
                return onSelectFolder(absoluteFromRelative(folderPath));
              }} // DEBUG
            >
              {folderName}
            </div>
          );
        })}
      </div>
    </div>
  );
}
