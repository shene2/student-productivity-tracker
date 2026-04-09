import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://mjfkgmcgkqwgckzqzufa.supabase.co",
  "sb_publishable_U-5BoDfSIl5mavfvxocjNg_gbjPgnYu"
);



async function addTask() {
  const text = document.getElementById("taskInput").value;
  const date = document.getElementById("dateInput").value;

  const user = (await supabase.auth.getUser()).data.user;

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
    loadTasks();
  }
}

async function loadTasks() {
  const user = (await supabase.auth.getUser()).data.user;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id);

  if (error) {
    alert(error.message);
    return;
  }

  renderTasks(data);
}

function renderTasks(tasks) {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="task-top">
        <span>${task.text}</span>
        <button onclick="deleteTask('${task.id}')">X</button>
      </div>
      <span class="date">${task.date || "No deadline"}</span>
    `;

    list.appendChild(li);
  });
}


async function deleteTask(id) {
  await supabase.from("tasks").delete().eq("id", id);
  loadTasks();
}


async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) alert(error.message);
  else alert("Check your email!");
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) alert(error.message);
  else {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadTasks();
  }
}
