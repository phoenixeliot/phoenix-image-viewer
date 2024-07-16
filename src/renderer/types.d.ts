declare global {
  interface Window {
    dialog: any;
    fs: any;
  }
}

export type FileMeta = {
  filePath: string;
  lastModified: Date;
};
