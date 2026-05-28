import { TaskApiService } from "./modules/api.js";
import { loadFromLocal, saveToLocal } from "./modules/storage.js";
import { displayTasks, liveDetails } from "./modules/ui.js";
import { NetworkError, handleError } from "./modules/errors.js";
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
  console.log(event, data);
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
      setAllTasks(JSON.parse(savedData));
    } else {
      let { todos } = await api.getMultipleData();
      setAllTasks(todos);
      saveToLocal(todos);
    }
    displayTasks(getAllTasks().filter((task) => !task.completed));
  } catch (error) {
    handleError(new NetworkError("Failed to connect to system!"));
    document.getElementById("task-list").innerHTML =
      "<li>Failed to connect to system.</li>";
  }
  liveDetails(getAllTasks());
  observeTasks();
}

init();
