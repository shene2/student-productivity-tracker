import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://mjfkgmcgkqwgckzqzufa.supabase.co",
  "sb_publishable_U-5BoDfSIl5mavfvxocjNg_gbjPgnYu"
);

// ════════════════════════════════════════
//  STATE
// ════════════════════════════════════════
let allTasks     = [];
let activeFilter = "all";
let authMode     = "login";

// ════════════════════════════════════════
//  INIT — check session on load
// ════════════════════════════════════════
async function checkUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    showApp(user);
    await loadTasks();
  }
}
checkUser();

// ════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════
function showApp(user) {
  document.getElementById("auth").style.display = "none";
  document.getElementById("app").style.display  = "block";

  const hour  = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  document.getElementById("greeting").textContent = greet + " ✦";

  document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric", year:"numeric" });

  const email = user?.email ?? "";
  document.getElementById("userEmail").textContent  = email;
  document.getElementById("userAvatar").textContent = email.charAt(0).toUpperCase() || "?";
}

window.switchTab = function(mode) {
  authMode = mode;
  document.getElementById("tabLogin").classList.toggle("active",  mode === "login");
  document.getElementById("tabSignup").classList.toggle("active", mode === "signup");
  document.getElementById("authBtnText").textContent = mode === "login" ? "Login" : "Create account";
  document.getElementById("authSwitchText").textContent =
    mode === "login" ? "Don't have an account?" : "Already have an account?";
  const link = document.getElementById("authSwitchLink");
  link.textContent = mode === "login" ? "Sign up free" : "Log in";
  link.onclick = () => { switchTab(mode === "login" ? "signup" : "login"); return false; };
  setError(""); setSuccess("");
};

window.handleAuth = function() {
  if (authMode === "login") login(); else signUp();
};

async function signUp() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) { setError("Please fill in all fields."); return; }
  setLoading(true);
  const { error } = await supabase.auth.signUp({ email, password });
  setLoading(false);
  if (error) setError(error.message);
  else setSuccess("Account created! Check your email, or log in if email confirmation is disabled.");
}
window.signUp = signUp;

async function login() {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  if (!email || !password) { setError("Please fill in all fields."); return; }
  setLoading(true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);
  if (error) { setError(error.message); return; }
  showApp(data.user);
  await loadTasks();
}
window.login = login;

window.logout = async function() {
  await supabase.auth.signOut();
  allTasks = [];
  document.getElementById("auth").style.display = "flex";
  document.getElementById("app").style.display  = "none";
};

function setError(msg) {
  const el = document.getElementById("authError");
  el.style.display = msg ? "block" : "none";
  el.textContent   = msg;
}
function setSuccess(msg) {
  const el = document.getElementById("authSuccess");
  el.style.display = msg ? "block" : "none";
  el.textContent   = msg;
}
function setLoading(on) {
  document.getElementById("authBtnText").style.display   = on ? "none"   : "inline";
  document.getElementById("authBtnLoader").style.display = on ? "inline" : "none";
  document.getElementById("authBtn").disabled = on;
}

// ════════════════════════════════════════
//  TASKS  (schema: text, date, done, user_id)
// ════════════════════════════════════════
async function loadTasks() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) { console.error(error); return; }
  allTasks = data || [];
  renderTasks();
  updateStats();
}

window.addTask = async function() {
  const textEl = document.getElementById("taskInput");
  const dateEl = document.getElementById("dateInput");
  const text   = textEl.value.trim();
  const date   = dateEl.value;
  if (!text) { textEl.focus(); return; }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ text, date: date || null, done: false, user_id: user.id }])
    .select()
    .single();

  if (error) { console.error(error); return; }
  textEl.value = ""; dateEl.value = "";
  allTasks.unshift(data);
  renderTasks(); updateStats();
};

window.addTaskFromModal = async function() {
  document.getElementById("taskInput").value = document.getElementById("modalTaskInput").value;
  document.getElementById("dateInput").value = document.getElementById("modalDateInput").value;
  closeModal();
  await window.addTask();
};

window.deleteTask = async function(id, e) {
  if (e) e.stopPropagation();
  await supabase.from("tasks").delete().eq("id", id);
  allTasks = allTasks.filter(t => t.id !== id);
  renderTasks(); updateStats();
};

window.toggleDone = async function(id, currentStatus) {
  const { error } = await supabase
    .from("tasks")
    .update({ done: !currentStatus })
    .eq("id", id);
  if (error) { console.error(error); return; }
  const task = allTasks.find(t => t.id === id);
  if (task) task.done = !currentStatus;
  renderTasks(); updateStats();
};

// ════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════
function getFiltered() {
  const today = new Date().toISOString().split("T")[0];
  switch (activeFilter) {
    case "pending": return allTasks.filter(t => !t.done);
    case "done":    return allTasks.filter(t =>  t.done);
    case "today":   return allTasks.filter(t => t.date === today);
    default:        return allTasks;
  }
}

function renderTasks() {
  const list  = document.getElementById("taskList");
  const empty = document.getElementById("emptyState");
  list.querySelectorAll(".task-item").forEach(el => el.remove());

  const tasks = getFiltered();
  if (tasks.length === 0) { empty.style.display = "block"; return; }
  empty.style.display = "none";

  const today = new Date().toISOString().split("T")[0];
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.onclick = () => window.toggleDone(task.id, task.done);

    const isOverdue = task.date && task.date < today && !task.done;
    const dateLabel = task.date
      ? new Date(task.date + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric" })
      : "No deadline";

    li.innerHTML = `
      <div class="task-check ${task.done ? "done" : ""}">${task.done ? "✓" : ""}</div>
      <div class="task-info">
        <div class="task-name ${task.done ? "done" : ""}">${esc(task.text)}</div>
        <div class="task-meta">
          <span style="color:${isOverdue ? "#F87171" : ""};">${isOverdue ? "⚠ " : ""}${dateLabel}</span>
        </div>
      </div>
      <button class="task-delete" onclick="deleteTask('${task.id}', event)">✕</button>
    `;
    list.appendChild(li);
  });
}

function updateStats() {
  const total    = allTasks.length;
  const done     = allTasks.filter(t => t.done).length;
  const pending  = total - done;
  const today    = new Date().toISOString().split("T")[0];
  const dueToday = allTasks.filter(t => t.date === today && !t.done).length;
  const rate     = total > 0 ? Math.round((done / total) * 100) : 0;

  document.getElementById("statTotal").textContent   = total;
  document.getElementById("statDone").textContent    = done;
  document.getElementById("statPending").textContent = pending;
  document.getElementById("statToday").textContent   = dueToday;

  document.getElementById("statDoneSub").textContent  = rate + "% rate";
  document.getElementById("statDoneSub").className    = "stat-change" + (rate >= 50 ? " up" : "");
  document.getElementById("statPendingSub").textContent = pending === 0 ? "All clear! 🎉" : "To do";
  document.getElementById("statTodaySub").textContent   = dueToday > 0 ? "Due today" : "None today";

  document.getElementById("progressFill").style.width = rate + "%";
  document.getElementById("progressText").textContent  =
    rate + "% completed (" + done + "/" + total + ")";
  document.getElementById("pendingCount").textContent  = pending;

  document.getElementById("taskSummary").textContent = total === 0
    ? "No tasks yet — add your first one!"
    : done + " of " + total + " tasks done · " + dueToday + " due today";
}

function esc(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ════════════════════════════════════════
//  FILTER
// ════════════════════════════════════════
window.toggleFilter = function() {
  const bar = document.getElementById("filterBar");
  bar.style.display = bar.style.display === "none" ? "flex" : "none";
};
window.setFilter = function(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderTasks();
};

// ════════════════════════════════════════
//  MODAL
// ════════════════════════════════════════
window.openAddModal = function() {
  document.getElementById("modalOverlay").style.display = "flex";
};
window.closeModal = function() {
  document.getElementById("modalOverlay").style.display = "none";
  document.getElementById("modalTaskInput").value = "";
  document.getElementById("modalDateInput").value = "";
};

// ════════════════════════════════════════
//  FOCUS TIMER
// ════════════════════════════════════════
let timerSecs = 25 * 60, timerOn = false, timerInterval = null;
function fmt(s) {
  return String(Math.floor(s/60)).padStart(2,"0") + ":" + String(s%60).padStart(2,"0");
}
window.toggleTimer = function() {
  if (timerOn) {
    clearInterval(timerInterval); timerOn = false;
    document.getElementById("startBtn").textContent = "▶ Start";
  } else {
    timerOn = true;
    document.getElementById("startBtn").textContent = "⏸ Pause";
    timerInterval = setInterval(() => {
      if (timerSecs > 0) {
        timerSecs--;
        document.getElementById("timerDisplay").textContent = fmt(timerSecs);
      } else {
        clearInterval(timerInterval); timerOn = false;
        document.getElementById("startBtn").textContent = "▶ Start";
      }
    }, 1000);
  }
};
window.resetTimer = function() {
  clearInterval(timerInterval); timerOn = false; timerSecs = 25 * 60;
  document.getElementById("timerDisplay").textContent = fmt(timerSecs);
  document.getElementById("startBtn").textContent = "▶ Start";
};