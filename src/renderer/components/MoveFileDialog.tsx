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
  isOpen,
  rootPath,
  folderMetas,
  onClose,
  onSelectFolder,
}: {
  isOpen: boolean;
  rootPath: string;
  folderMetas: FileMeta[];
  onClose: () => unknown;
  onSelectFolder: (folderPath: string) => unknown;
}) {
  const inputRef = useRef(null);
  const currentItemRef = useRef(null);
  const [filterText, setFilterText] = useState("");
  const [selectedFolder, setSelectedFolder] = useState({
    path: folderMetas?.[0]?.filePath,
    exists: true,
  });
  const folderPaths = useMemo(
    () =>
      folderMetas
        .map((folderMeta) => folderMeta.filePath.replace(rootPath, ""))
        .filter((filePath) => filePath.includes(filterText)),
    [filterText, folderMetas, rootPath],
  );

  const menuItems = useMemo(
    () => [
      ...folderPaths.map((folderPath) => ({
        path: folderPath,
        exists: true,
      })),
      {
        path: filterText,
        exists: false,
      },
    ],
    [filterText, folderPaths],
  );

  useEffect(() => {
    setSelectedFolder(menuItems[0]);
  }, [filterText, menuItems]);

  const absoluteFromRelative = useCallback(
    (relativePath: string) => {
      return (
        rootPath.replace(/\/*$/, "") + "/" + relativePath.replace(/^\/*/, "")
      );
    },
    [rootPath],
  );

  useEffect(() => {
    const arrowHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedFolder(
          menuItems[
            constrain(
              menuItems.findIndex(({ path }) => selectedFolder.path === path) -
                1,
              menuItems.length,
            )
          ],
        );
        setTimeout(() => {
          currentItemRef.current?.scrollIntoView({ block: "nearest" });
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedFolder(
          menuItems[
            constrain(
              menuItems.findIndex(({ path }) => selectedFolder.path === path) +
                1,
              menuItems.length,
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
        onSelectFolder(absoluteFromRelative(selectedFolder.path));
      }
    };
    document.addEventListener("keydown", arrowHandler);
    document.addEventListener("keydown", arrowHandler);
    return () => {
      document.removeEventListener("keydown", arrowHandler);
      document.removeEventListener("keydown", arrowHandler);
    };
  });

  useEffect(() => {
    if (isOpen) {
      inputRef.current.setSelectionRange(0, inputRef.current.selectionEnd);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          const isSelected = selectedFolder.path === folderPath;
          return (
            <div
              key={folderPath}
              ref={isSelected ? currentItemRef : null}
              className={`action-dialog__list-item ${isSelected ? "action-dialog__list-item_selected" : ""}`}
              onClick={() => onSelectFolder(absoluteFromRelative(folderPath))}
            >
              {folderPath}
            </div>
          );
        })}
        {(() => {
          const folderPath = filterText;
          const parts = folderPath.split("/");
          const folderName = parts.at(-1);
          const isSelected = selectedFolder.path === folderPath;
          return (
            <div
              ref={isSelected ? currentItemRef : null}
              className={`action-dialog__list-item ${isSelected ? "action-dialog__list-item_selected" : ""}`}
              onClick={() => onSelectFolder(absoluteFromRelative(folderPath))}
            >
              Create folder: {folderName}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
