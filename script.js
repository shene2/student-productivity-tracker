let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
  const text = document.getElementById("taskInput").value;
  const date = document.getElementById("dateInput").value;

  if (!text) return;

  tasks.push({
    text,
    date,
    done: false
  });

  saveTasks();
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach((task, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="task-top">
        <span onclick="toggleDone(${index})" class="${task.done ? 'done' : ''}">
          ${task.text}
        </span>
        <button onclick="deleteTask(${index})">X</button>
      </div>
      <span class="date">${task.date || "No deadline"}</span>
    `;

    list.appendChild(li);
  });

  updateProgress();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function toggleDone(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
  renderTasks();
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("progressText").innerText =
    `${percent}% completed (${done}/${total})`;
}

renderTasks();