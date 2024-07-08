import { IpcMainInvokeEvent, ipcMain } from "electron";

export const registerBrowseStateIpc = (
  setBrowseState: (state: any) => void,
) => {
  ipcMain.handle("setBrowseState", (event: IpcMainInvokeEvent, state: any) => {
    setBrowseState(state);
  });
  ipcMain.on("setBrowseState", (event: IpcMainInvokeEvent, state: any) => {
    setBrowseState(state);
  });
};
