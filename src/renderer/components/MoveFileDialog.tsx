import ActionDialog from "@components/ActionDialog";
import { type FileMeta } from "@renderer/types";
import absoluteFromRelative from "@src/utils/absoluteFromRelative";
import React, { useMemo, useState } from "react";

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
  const [filterText, setFilterText] = useState("");

  const includeCreateMenuItem = useMemo(
    () =>
      !folderMetas.some((folderMeta) => {
        return (
          folderMeta.filePath === absoluteFromRelative(filterText, rootPath)
        );
      }),
    [filterText, folderMetas, rootPath],
  );

  const menuItems = useMemo(
    () => [
      ...folderMetas.map((folderMeta) => ({
        text: folderMeta.filePath.replace(rootPath, ""),
        path: folderMeta.filePath,
        exists: true,
      })),
      ...(includeCreateMenuItem
        ? [
            {
              preventSorting: true,
              text: `Create folder: /${filterText}`,
              path: absoluteFromRelative(filterText, rootPath),
              exists: false,
            },
          ]
        : []),
    ],
    [filterText, folderMetas, includeCreateMenuItem, rootPath],
  );

  return (
    <ActionDialog
      isOpen={isOpen}
      onClose={onClose}
      menuItems={menuItems}
      onChangeFilterText={setFilterText}
      onSelect={(menuItem) => {
        onSelectFolder(menuItem.path);
      }}
    />
  );
}
