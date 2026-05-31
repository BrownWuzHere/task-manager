import { TaskApiService } from "./modules/api.js";
import { loadFromLocal, saveToLocal } from "./modules/storage.js";
import { displayTasks, liveDetails } from "./modules/ui.js";
import { NetworkError, handleError } from "./modules/errors.js";
import { createTaskProxy } from "./modules/tasks.js";
import {
  setAllTasks,
  getAllTasks,
  addTask,
  deleteTask,
  editTask,
  completeTask,
  sortTasks,
  checkTasks,
  applyFiltersAndRender,
  getNextTask,
  setFilterStrategy,
  taskObserver,
} from "./modules/tasks.js";

const toggleBtn = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme") || "light";

document.getElementById("task-list").addEventListener("click", (e) => {
  let button = e.target.closest("button");
  if (!button) return;
  let id = Number(button.dataset.id);
  let action = button.dataset.action;
  if (action === "delete") deleteTask(id);
  if (action === "edit") editTask(id);
  if (action === "complete") completeTask(id);
});

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function throttle(fn, limit) {
  let lastCall = 0;
  return function (...args) {
    let now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
}

const debouncedSearch = debounce(() => {
  applyFiltersAndRender();
}, 400);

const throttledSort = throttle((direction) => {
  sortTasks(direction);
}, 1000);

window.sortTasks = throttledSort;
window.checkTasks = checkTasks;
window.addTask = addTask;
window.getNextTask = getNextTask;
window.setFilterStrategy = setFilterStrategy;

document.getElementById("search-box").addEventListener("input", () => {
  debouncedSearch();
});
const handleNewTask = (event, data) => {
  console.log(`Event triggered: ${event}`, data);

  // Get the most up-to-date state of tasks
  const currentTasks = getAllTasks();
  saveToLocal(currentTasks);
  applyFiltersAndRender();
  liveDetails(currentTasks);
};
taskObserver.subscribe(handleNewTask);

function observeTasks() {
  let items = document.querySelectorAll("#task-list li");
  let observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  items.forEach((item) => {
    item.style.opacity = "0";
    item.style.transform = "translateY(20px)";
    item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    observer.observe(item);
  });
}

const api = new TaskApiService();

async function init() {
  let savedData = loadFromLocal();
  try {
    if (savedData) {
      let rawTasks = JSON.parse(savedData);
      // Map over items to ensure proxy validation continues working on saved data
      let proxiedTasks = rawTasks.map((task) => createTaskProxy(task));
      setAllTasks(proxiedTasks);
    } else {
      let { todos } = await api.getMultipleData();
      // Store API values inside proxies too
      let proxiedTodos = todos.map((task) => createTaskProxy(task));
      setAllTasks(proxiedTodos);
      saveToLocal(proxiedTodos);
    }

    // Initial paint
    applyFiltersAndRender();
  } catch (error) {
    handleError(new NetworkError("Failed to connect to system!"));
    document.getElementById("task-list").innerHTML =
      "<li>Failed to connect to system.</li>";
  }
  liveDetails(getAllTasks());
  observeTasks();
}

if (currentTheme === "dark") {
  document.documentElement.setAttribute("data-theme", "dark");
  toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
  let theme = document.documentElement.getAttribute("data-theme");
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    toggleBtn.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
    toggleBtn.textContent = "☀️";
  }
});

init();
