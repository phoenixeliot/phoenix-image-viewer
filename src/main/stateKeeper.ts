import { BrowserWindow, screen } from "electron";
import settings from "electron-settings";

export const windowStateKeeper = async (windowName: string) => {
  let window: BrowserWindow, windowState: any, browseState: any;

  const setBounds = async () => {
    // Restore from appConfig
    if (await settings.has(`windowState.${windowName}`)) {
      windowState = await settings.get(`windowState.${windowName}`);
      return;
    }

    const size = screen.getPrimaryDisplay().workAreaSize;

    // Default
    windowState = {
      x: undefined,
      y: undefined,
      width: size.width / 2,
      height: size.height / 2,
    };
  };

  const saveState = async () => {
    // bug: lots of save state events are called. they should be debounced
    if (!windowState.isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = window.isMaximized();
    await settings.set(`windowState.${windowName}`, windowState);
  };

  const setBrowseState = async (state: any) => {
    console.log("setBrowseState to", state);
    browseState = state;
    settings.set(`browseState.${windowName}`, state);
  };

  const track = async (newWindow: BrowserWindow) => {
    window = newWindow;
    ["resize", "move", "close"].forEach((event: any) => {
      window.on(event, saveState);
    });
  };

  await setBounds();

  return {
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized,
    track,
    browseState,
    setBrowseState,
  };
};
