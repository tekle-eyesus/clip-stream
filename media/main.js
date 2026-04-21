const vscode = acquireVsCodeApi();
const listContainer = document.getElementById("item-list");
const searchInput = document.getElementById("search-input");
const reorderToggle = document.getElementById("reorder-toggle");

let allItems = [];
let filteredItems = [];
let pinnedSet = new Set();
let selectedIndex = -1;
let reorderMode = false;
let draggedText = "";

function normalizeItem(item) {
  if (!item || typeof item.text !== "string") {
    return null;
  }

  return {
    text: item.text,
    note: typeof item.note === "string" ? item.note : "",
  };
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "update") {
    allItems = Array.isArray(message.items)
      ? message.items.map(normalizeItem).filter(Boolean)
      : [];
    pinnedSet = new Set(
      Array.isArray(message.pinnedItems) ? message.pinnedItems : [],
    );
    applyFilter();
  }
});

if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyFilter();
  });
}

if (reorderToggle) {
  reorderToggle.addEventListener("dblclick", () => {
    reorderMode = !reorderMode;
    reorderToggle.textContent = reorderMode ? "Reorder: On" : "Reorder: Off";
    render(filteredItems);
  });
}

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const isInputFocused =
    target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
    event.preventDefault();
    searchInput?.focus();
    searchInput?.select();
    return;
  }

  if (!filteredItems.length) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
    render(filteredItems);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    render(filteredItems);
    return;
  }

  if (!isInputFocused && event.key === "Enter") {
    event.preventDefault();
    const selected = filteredItems[selectedIndex];
    if (selected) {
      vscode.postMessage({ type: "insert", value: selected.text });
    }
    return;
  }

  if (!isInputFocused && event.key.toLowerCase() === "p") {
    event.preventDefault();
    const selected = filteredItems[selectedIndex];
    if (selected) {
      vscode.postMessage({ type: "pinToggle", value: selected.text });
    }
    return;
  }

  if (!isInputFocused && event.key.toLowerCase() === "n") {
    event.preventDefault();
    const selected = filteredItems[selectedIndex];
    if (selected) {
      requestNoteInput(selected);
    }
    return;
  }

  if (!isInputFocused && event.key === "Delete") {
    event.preventDefault();
    const selected = filteredItems[selectedIndex];
    if (selected) {
      vscode.postMessage({ type: "delete", value: selected.text });
    }
  }
});

function applyFilter() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  filteredItems = query
    ? allItems.filter(
        (item) =>
          item.text.toLowerCase().includes(query) ||
          item.note.toLowerCase().includes(query),
      )
    : [...allItems];

  if (!filteredItems.length) {
    selectedIndex = -1;
  } else if (selectedIndex < 0 || selectedIndex >= filteredItems.length) {
    selectedIndex = 0;
  }

  render(filteredItems);
}

function render(items) {
  listContainer.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No clips found.";
    listContainer.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "clip-item";
    div.draggable = reorderMode;
    div.classList.toggle("reorder-on", reorderMode);

    div.addEventListener("dragstart", () => {
      if (!reorderMode) {
        return;
      }

      draggedText = item.text;
      div.classList.add("dragging");
    });

    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      draggedText = "";
    });

    div.addEventListener("dragover", (event) => {
      if (!reorderMode) {
        return;
      }

      event.preventDefault();
      div.classList.add("drop-target");
    });

    div.addEventListener("dragleave", () => {
      div.classList.remove("drop-target");
    });

    div.addEventListener("drop", (event) => {
      if (!reorderMode) {
        return;
      }

      event.preventDefault();
      div.classList.remove("drop-target");

      if (!draggedText || draggedText === item.text) {
        return;
      }

      vscode.postMessage({
        type: "reorder",
        value: draggedText,
        targetValue: item.text,
      });
    });

    if (index === selectedIndex) {
      div.classList.add("selected");
    }

    const type = detectType(item.text);
    const icon = type === "file" ? "📁" : type === "code" ? "💻" : "📝";
    const isPinned = pinnedSet.has(item.text);

    const header = document.createElement("div");
    header.className = "header";
    header.textContent = `${isPinned ? "📌" : icon} Item ${index + 1}`;

    const preview = document.createElement("div");
    preview.className = "preview";
    preview.textContent = item.text;

    let noteBlock = null;
    if (item.note) {
      noteBlock = document.createElement("div");
      noteBlock.className = "note-block";

      const noteLabel = document.createElement("span");
      noteLabel.className = "note-label";
      noteLabel.textContent = "Note";

      const noteText = document.createElement("span");
      noteText.className = "note-text";
      noteText.textContent = item.note;

      noteBlock.append(noteLabel, noteText);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const insertButton = document.createElement("button");
    insertButton.className = "primary";
    insertButton.type = "button";
    insertButton.textContent = "Insert";
    insertButton.disabled = reorderMode;
    insertButton.addEventListener("click", () => {
      vscode.postMessage({ type: "insert", value: item.text });
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.disabled = reorderMode;
    copyButton.addEventListener("click", () => {
      vscode.postMessage({ type: "copy", value: item.text });
    });

    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = isPinned ? "pinned" : "";
    pinButton.textContent = isPinned ? "Unpin" : "Pin";
    pinButton.disabled = reorderMode;
    pinButton.addEventListener("click", () => {
      vscode.postMessage({ type: "pinToggle", value: item.text });
    });

    const noteButton = document.createElement("button");
    noteButton.type = "button";
    noteButton.className = "secondary-action";
    noteButton.textContent = item.note ? "Edit Note" : "Add Note";
    noteButton.disabled = reorderMode;
    noteButton.addEventListener("click", () => {
      requestNoteInput(item);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = reorderMode;
    deleteButton.addEventListener("click", () => {
      vscode.postMessage({ type: "delete", value: item.text });
    });

    actions.append(
      insertButton,
      copyButton,
      pinButton,
      noteButton,
      deleteButton,
    );
    div.append(header, preview);
    if (noteBlock) {
      div.append(noteBlock);
    }
    div.append(actions);
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

function requestNoteInput(item) {
  vscode.postMessage({
    type: "requestNote",
    value: item.text,
    note: item.note || "",
  });
}
