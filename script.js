import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://mjfkgmcgkqwgckzqzufa.supabase.co",
  "sb_publishable_U-5BoDfSIl5mavfvxocjNg_gbjPgnYu"
);

// ================= AUTH =================

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert(error.message);
  } else {
    alert("Check your email to confirm your account!");
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
  } else {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
  }
}

// ================= CHECK USER =================

async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
  }
}

checkUser();

// ================= TASKS =================

async function addTask() {
  const text = document.getElementById("taskInput").value;
  const date = document.getElementById("dateInput").value;

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    alert("Please login first");
    return;
  }

  const { error } = await supabase.from("tasks").insert([
    {
      text,
      date,
      done: false,
      user_id: user.id
    }
  ]);

  if (error) {
    alert(error.message);
  } else {
    document.getElementById("taskInput").value = "";
    document.getElementById("dateInput").value = "";
    loadTasks();
  }
}

async function loadTasks() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    alert(error.message);
    return;
  }

  renderTasks(data);
}

// ================= RENDER =================

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="task-top">
        <span 
          onclick="toggleDone('${task.id}', ${task.done})"
          style="cursor:pointer; ${task.done ? 'text-decoration: line-through; opacity:0.6;' : ''}">
          ${task.text}
        </span>
        <button onclick="deleteTask('${task.id}')">X</button>
      </div>
      <span class="date">${task.date || "No deadline"}</span>
    `;

    list.appendChild(li);
  });

  updateProgress(tasks);
}

// ================= ACTIONS =================

async function deleteTask(id) {
  await supabase.from("tasks").delete().eq("id", id);
  loadTasks();
}

async function toggleDone(id, currentStatus) {
  await supabase
    .from("tasks")
    .update({ done: !currentStatus })
    .eq("id", id);

  loadTasks();
}

// ================= PROGRESS =================

function updateProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("progressText").innerText =
    `${percent}% completed (${done}/${total})`;
}

window.signUp = signUp;
window.login = login;
window.addTask = addTask;
window.deleteTask = deleteTask;
window.toggleDone = toggleDone;