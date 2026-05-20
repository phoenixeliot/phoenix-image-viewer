import { ipcMain, IpcMainInvokeEvent } from "electron";
import fs from "fs";
import path from "path";

const SCORES_FILENAME = ".image-viewer-scores.json";

function getScoresPath(rootPath: string) {
  return path.join(rootPath, SCORES_FILENAME);
}

export function readScores(rootPath: string): Record<string, number> {
  try {
    const content = fs.readFileSync(getScoresPath(rootPath), "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeScores(rootPath: string, scores: Record<string, number>) {
  fs.writeFileSync(getScoresPath(rootPath), JSON.stringify(scores, null, 2));
}

export function registerFrequencyScoresIpc() {
  ipcMain.handle(
    "save-frequency-scores",
    (
      _event: IpcMainInvokeEvent,
      {
        rootPath,
        scores,
      }: { rootPath: string; scores: Record<string, number> },
    ) => {
      writeScores(rootPath, scores);
    },
  );
}
