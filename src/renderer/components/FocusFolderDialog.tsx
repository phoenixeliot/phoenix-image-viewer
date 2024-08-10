import ActionDialog from "@components/ActionDialog";
import { type FileMeta } from "@renderer/types";
import React, { useMemo } from "react";

export default function FocusFolderDialog({
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
  const menuItems = useMemo(
    () => [
      ...folderMetas.map((folderMeta) => ({
        text: folderMeta.filePath.replace(rootPath, ""),
        path: folderMeta.filePath,
      })),
    ],
    [folderMetas, rootPath],
  );

  return (
    <ActionDialog
      isOpen={isOpen}
      onClose={onClose}
      menuItems={menuItems}
      onSelect={(menuItem) => {
        onSelectFolder(menuItem.path);
      }}
    />
  );
}
