function addTask() {
  const input = document.getElementById("taskInput");
  const taskText = input.value;

  if (taskText === "") return;

  const li = document.createElement("li");

  li.innerHTML = `
    <span onclick="toggleDone(this)">${taskText}</span>
    <button onclick="deleteTask(this)">X</button>
  `;

  document.getElementById("taskList").appendChild(li);

  input.value = "";
}

function deleteTask(btn) {
  btn.parentElement.remove();
}

function toggleDone(task) {
  task.style.textDecoration = 
    task.style.textDecoration === "line-through" 
    ? "none" 
    : "line-through";
}