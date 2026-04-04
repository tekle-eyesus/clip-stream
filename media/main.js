const vscode = acquireVsCodeApi();

window.addEventListener("DOMContentLoaded", () => {
  const clearButton = document.getElementById("clearBtn");

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      vscode.postMessage({ type: "clear" });
    });
  }
});
