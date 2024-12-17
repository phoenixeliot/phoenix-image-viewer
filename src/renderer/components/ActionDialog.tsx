import constrain from "@src/utils/constrain";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { levenshteinDistance } from "string-similarity-algorithm";
import { useEffectInstant } from "../../utils/useEffectInstant";

export default function ActionDialog({
  isOpen,
  menuItems,
  onClose,
  onChangeFilterText,
  onSelect,
}: {
  isOpen: boolean;
  menuItems: MenuItem[];
  onClose: () => unknown;
  onChangeFilterText?: (filterText: string) => unknown;
  onSelect: (menuItem: MenuItem) => unknown;
}) {
  const inputRef = useRef(null);
  const currentItemRef = useRef(null);
  const [filterText, _setFilterText] = useState("");
  const [selectedItem, setSelectedItem] = useState(menuItems[0]);

  const setFilterText = useCallback(
    (value: string) => {
      _setFilterText(value);
      onChangeFilterText?.(value);
    },
    [onChangeFilterText],
  );

  const filteredMenuItems = useMemo(
    () =>
      menuItems
        .filter((menuItem) => menuItem.text.includes(filterText))
        .toSorted((a, b) => {
          if (a.preventSorting || b.preventSorting) return 0;
          if (!filterText) return 0;
          return (
            levenshteinDistance(a.text, filterText) -
            levenshteinDistance(b.text, filterText)
          );
        }),
    [filterText, menuItems],
  );

  // Don't use a useEffect so that this changes instantly if necessary
  // if (!filteredMenuItems.includes(selectedItem))
  useEffectInstant(() => {
    setSelectedItem(filteredMenuItems[0]);
  }, [filterText, filteredMenuItems]);

  useEffect(() => {
    if (!isOpen) return;
    const arrowHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedItem(
          filteredMenuItems[
            constrain(
              filteredMenuItems.findIndex(
                ({ text }) => selectedItem?.text === text,
              ) - 1,
              filteredMenuItems.length,
            )
          ],
        );
        setTimeout(() => {
          currentItemRef.current?.scrollIntoView({ block: "nearest" });
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedItem(
          filteredMenuItems[
            constrain(
              filteredMenuItems.findIndex(
                ({ text }) => selectedItem?.text === text,
              ) + 1,
              filteredMenuItems.length,
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
        onSelect(selectedItem);
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
        {filteredMenuItems.map((menuItem) => {
          const isSelected = selectedItem?.text === menuItem.text;
          return (
            <div
              key={menuItem.text}
              ref={isSelected ? currentItemRef : null}
              className={`action-dialog__list-item ${isSelected ? "action-dialog__list-item_selected" : ""}`}
              onClick={() => onSelect(menuItem)}
            >
              {menuItem.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type MenuItem = {
  text: string;
  [key: string]: any;
};
