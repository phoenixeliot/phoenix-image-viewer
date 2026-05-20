import { IpcMainInvokeEvent, ipcMain } from "electron";
import settings from "electron-settings";

export const registerBrowseStateIpc = (
  setBrowseState: (state: any) => void,
) => {
  // "handle/invoke" gets a response back, "on/send" does not
  ipcMain.handle("setBrowseState", (event: IpcMainInvokeEvent, state: any) => {
    setBrowseState(state);
  });
  ipcMain.handle("getSettings", (event: IpcMainInvokeEvent, state: any) => {
    return settings.getSync();
  });
};
