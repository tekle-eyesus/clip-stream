const vscode = acquireVsCodeApi();
const listContainer = document.getElementById("item-list");

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "update") {
    render(message.items);
  }
});

function render(items) {
  listContainer.innerHTML = "";
  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "clip-item";

    const type = detectType(item);
    const icon = type === "file" ? "📁" : type === "code" ? "💻" : "📝";

    // Sanitize item for preview (prevent HTML injection)
    const safeText = item.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
            <div class="header">${icon} Item ${index + 1}</div>
            <div class="preview">${safeText}</div>
            <div class="actions">
                <button class="primary" onclick="insert('${encodeURIComponent(item)}')">Insert</button>
                <button onclick="copy('${encodeURIComponent(item)}')">Copy</button>
            </div>
        `;
    listContainer.appendChild(div);
  });
}

function detectType(text) {
  if (
    text.match(/\.(ts|js|tsx|json|py|html)$/) ||
    text.includes("/") ||
    text.includes("\\")
  )
    return "file";
  if (text.includes("\n") || text.includes(" {") || text.includes("```"))
    return "code";
  return "text";
}

window.insert = (val) =>
  vscode.postMessage({ type: "insert", value: decodeURIComponent(val) });
window.copy = (val) =>
  vscode.postMessage({ type: "copy", value: decodeURIComponent(val) });
