// NOTE: DO NOT try to import this into a JSX file; it will crash the build.
// import type fsType from "../../node_modules/@types/node/fs.d.ts";

declare module "*.css";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";

// declare global {
//   interface Window {
//     dialog: any;
//     fs: {
//       readdirSync: (dirPath: string) => Promise<string[]>;
//     };
//   }
// }

declare global {
  interface Window {
    dialog: any;
    fs: any;
  }
}

declare const window: typeof global.Window;
declare const dialog: any;
