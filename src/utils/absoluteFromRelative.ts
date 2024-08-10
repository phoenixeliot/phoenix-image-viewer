export default function absoluteFromRelative(
  relativePath: string,
  rootPath: string,
) {
  return rootPath.replace(/\/*$/, "") + "/" + relativePath.replace(/^\/*/, "");
}
