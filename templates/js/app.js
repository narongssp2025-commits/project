const API_URL = "/api/tasks/";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const statusInput = document.getElementById("status");
const submitButton = document.getElementById("submit-btn");
const formTitle = document.getElementById("form-title");
const taskList = document.getElementById("task-list");
const messageBox = document.getElementById("message");

let editingTaskId = null;
let currentTasks = [];

document.addEventListener("DOMContentLoaded", loadTasks);

form.addEventListener("submit", handleSubmit);

taskList.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    const { action, id } = button.dataset;
    const taskId = Number(id);

    if (action === "toggle") {
        toggleTaskStatus(taskId);
    }

    if (action === "edit") {
        editTask(taskId);
    }

    if (action === "delete") {
        deleteTask(taskId);
    }
});

async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load tasks");
        }

        const tasks = await response.json();
        currentTasks = tasks;
        renderTasks(tasks);
        updateStats(tasks);
    } catch (error) {
        showMessage("Unable to load tasks from the API.", true);
        console.error(error);
    }
}

function updateStats(tasks) {
    document.getElementById("total-count").textContent = tasks.length;
    document.getElementById("pending-count").textContent = tasks.filter((task) => task.status === "pending").length;
    document.getElementById("completed-count").textContent = tasks.filter((task) => task.status === "completed").length;
}

function renderTasks(tasks) {
    taskList.innerHTML = "";

    if (!tasks.length) {
        taskList.innerHTML = `
            <div class="empty-state">
                <h3>No tasks yet</h3>
                <p>Create your first task to get started.</p>
            </div>
        `;
        return;
    }

    tasks.forEach((task) => {
        const card = document.createElement("article");
        card.className = `task-card ${task.status === "completed" ? "done" : ""}`;

        const formattedDate = new Date(task.created_at).toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        });

        const statusLabel = task.status === "completed" ? "Completed" : "Pending";

        card.innerHTML = `
            <div class="task-top">
                <div>
                    <h3>${escapeHtml(task.title)}</h3>
                    <span class="task-status ${task.status}">${statusLabel}</span>
                </div>
                <span class="task-date">${formattedDate}</span>
            </div>

            <p class="task-description">${escapeHtml(task.description || "No description added.")}</p>

            <div class="task-actions">
                <button class="mini-btn secondary" data-action="toggle" data-id="${task.id}">
                    ${task.status === "completed" ? "Mark as Pending" : "Mark as Done"}
                </button>
                <button class="mini-btn" data-action="edit" data-id="${task.id}">Edit</button>
                <button class="mini-btn danger" data-action="delete" data-id="${task.id}">Delete</button>
            </div>
        `;

        taskList.appendChild(card);
    });
}

async function handleSubmit(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value;

    if (!title) {
        showMessage("Please enter a task title.", true);
        return;
    }

    const payload = {
        title,
        description,
        status,
    };

    try {
        const url = editingTaskId !== null ? `${API_URL}${editingTaskId}/` : API_URL;
        const method = editingTaskId !== null ? "PATCH" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Request failed");
        }

        const message = editingTaskId !== null ? "Task updated successfully." : "Task created successfully.";
        showMessage(message);
        resetForm();
        await loadTasks();
    } catch (error) {
        showMessage(editingTaskId !== null ? "Could not update task." : "Could not create task.", true);
        console.error(error);
    }
}

function editTask(taskId) {
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) return;

    editingTaskId = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || "";
    statusInput.value = task.status;
    formTitle.textContent = "Edit Task";
    submitButton.textContent = "Update Task";
    titleInput.focus();
}

function resetForm() {
    editingTaskId = null;
    form.reset();
    statusInput.value = "pending";
    formTitle.textContent = "Add New Task";
    submitButton.textContent = "Add Task";
}

async function toggleTaskStatus(taskId) {
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) return;

    try {
        const response = await fetch(`${API_URL}${taskId}/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                status: task.status === "completed" ? "pending" : "completed",
            }),
        });

        if (!response.ok) {
            throw new Error("Status update failed");
        }

        showMessage(`${task.title} status updated.`);
        await loadTasks();
    } catch (error) {
        showMessage("Could not update task status.", true);
        console.error(error);
    }
}

async function deleteTask(taskId) {
    const task = currentTasks.find((item) => item.id === taskId);

    if (!task) return;

    const confirmed = window.confirm(`Delete "${task.title}"?`);

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}${taskId}/`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        showMessage("Task deleted successfully.");

        if (editingTaskId === taskId) {
            resetForm();
        }

        await loadTasks();
    } catch (error) {
        showMessage("Could not delete task.", true);
        console.error(error);
    }
}

function showMessage(message, error = false) {
    messageBox.textContent = message;
    messageBox.classList.toggle("error", error);
    messageBox.classList.toggle("success", !error);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
