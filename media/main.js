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

    const header = document.createElement("div");
    header.className = "header";
    header.textContent = `${icon} Item ${index + 1}`;

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent = item;

    const actions = document.createElement("div");
    actions.className = "actions";

    const insertButton = document.createElement("button");
    insertButton.className = "primary";
    insertButton.type = "button";
    insertButton.textContent = "Insert";
    insertButton.addEventListener("click", () => {
      vscode.postMessage({ type: "insert", value: item });
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => {
      vscode.postMessage({ type: "copy", value: item });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => {
      vscode.postMessage({ type: "delete", index });
    });

    actions.append(insertButton, copyButton, deleteButton);
    div.append(header, preview, actions);
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
