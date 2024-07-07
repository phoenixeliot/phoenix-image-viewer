console.log("Renderer!");

let filePaths = [];

document
  .querySelector("#folder-open-button")
  .addEventListener("click", async function (event) {
    const result = await window.dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    const dirPath = result.filePaths[0];
    console.log({ result });
    console.log(await result);
    const filenames = await window.fs.readdirSync(dirPath);
    filePaths = filenames.map((filename) => {
      // compat: Test this on windows paths
      // return new URL(`file://${dirPath}/${filename}`).href; // HACK to do path.join type behavior
      return `file://${dirPath}/${filename}`;
    });
    console.log({ filenames });
    console.log({ filePaths });
    document.querySelector("#image-count").textContent = filePaths.length;
    updateImage();
  });

let currentImageIndex = 0;
const currentImageEl = document.querySelector("#current-image");

document.querySelector("#next-image").addEventListener("click", () => {
  currentImageIndex++;
  updateImage();
});
document.querySelector("#prev-image").addEventListener("click", () => {
  currentImageIndex--;
  updateImage();
});
document.querySelector("#random-image").addEventListener("click", () => {
  currentImageIndex = Math.floor(Math.random() * filePaths.length);
  updateImage();
});

function updateImage() {
  console.log({ currentImageIndex });
  currentImageEl.src = filePaths[currentImageIndex];
}
