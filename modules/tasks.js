import { saveToLocal, setTaskMeta, getTaskMeta } from "./storage.js";
import { assignPriority } from "./priority.js";
import { displayTasks, liveDetails } from "./ui.js";
import { ValidationError, handleError } from "./errors.js";

let allTasks = [];

const TASK_ID = Symbol("taskId");

const taskObserver = {
  subscribers: [],
  subscribe(fn) {
    this.subscribers.push(fn);
  },
  unsubscribe(fn) {
    this.subscribers = this.subscribers.filter((sub) => sub !== fn);
  },
  notify(event, data) {
    this.subscribers.forEach((fn) => fn(event, data));
  },
};

const filterStrategies = {
  all: (tasks) => tasks.filter((task) => !task.completed),
  high: (tasks) =>
    tasks.filter(
      (task) => !task.completed && assignPriority(task.id) === "High",
    ),
  medium: (tasks) =>
    tasks.filter(
      (task) => !task.completed && assignPriority(task.id) === "Medium",
    ),
  low: (tasks) =>
    tasks.filter(
      (task) => !task.completed && assignPriority(task.id) === "Low",
    ),
};

let currentStrategy = "all";

export function setFilterStrategy(strategy) {
  currentStrategy = strategy;
  applyFiltersAndRender();
}

export function getAllTasks() {
  return allTasks;
}
export function setAllTasks(tasks) {
  allTasks = tasks;
}

export function* taskGenerator(tasks) {
  for (let task of tasks) {
    yield task;
  }
}

export function getNextTask() {
  let pending = allTasks.filter((task) => !task.completed);
  let gen = taskGenerator(pending);
  let next = gen.next();
  if (!next.done) {
    alert("Next Task: " + next.value.title);
  } else {
    alert("No pending tasks!");
  }
}

export function applyFiltersAndRender() {
  let searchValue = document
    .getElementById("search-box")
    .value.trim()
    .toLowerCase();
  let strategyFiltered = filterStrategies[currentStrategy](allTasks);
  let filtered = strategyFiltered.filter((task) =>
    task.title.toLowerCase().includes(searchValue),
  );
  displayTasks(filtered);
}

export function deleteTask(id) {
  allTasks = allTasks.filter((task) => task.id != id);
  liveDetails(allTasks);
  saveToLocal(allTasks);
  taskObserver.notify("delete", { id });
  applyFiltersAndRender();
}

export function editTask(id) {
  let task = allTasks.find((task) => task.id === id);
  if (!task) return;
  let newTitle = prompt("Edit the task:", task.title);
  if (newTitle === null) return;
  newTitle = newTitle.trim();
  if (newTitle === "") {
    handleError(new ValidationError("Task title cannot be empty!"));
    return;
  }
  task.title = newTitle;
  setTaskMeta(task, {
    lastEdited: new Date().toLocaleString(),
    editCount: (getTaskMeta(task)?.editCount || 0) + 1,
  });
  saveToLocal(allTasks);
  taskObserver.notify("edit", { id, title: newTitle });
  applyFiltersAndRender();
}

export function completeTask(id) {
  let task = allTasks.find((task) => task.id === id);
  if (!task) return;
  task.completed = !task.completed;
  saveToLocal(allTasks);
  liveDetails(allTasks);
  taskObserver.notify("complete", { id, completed: task.completed });
  applyFiltersAndRender();
}

export function addTask() {
  let input = document.getElementById("add-box");
  let title = input.value.trim();
  if (title === "") {
    handleError(new ValidationError("Task title cannot be empty!"));
    return;
  }
  try {
    let newTask = createTaskProxy({
      id: Date.now(),
      title: "",
      completed: false,
    });
    newTask.title = title;
    newTask.completed = false;
    newTask[TASK_ID] = Symbol("task-" + title);
    allTasks.unshift(newTask);
  } catch (error) {
    handleError(error);
    return;
  }
  saveToLocal(allTasks);
  liveDetails(allTasks);
  input.value = "";
  taskObserver.notify("add", { title });
  applyFiltersAndRender();
}

export function sortTasks(direction) {
  let newArr = structuredClone(allTasks);
  newArr.sort((a, b) => {
    if (direction === "asc") return a.title.localeCompare(b.title);
    else return b.title.localeCompare(a.title);
  });
  allTasks = newArr;
  saveToLocal(allTasks);
  applyFiltersAndRender();
}

export function checkTasks() {
  let hasHighPriority = allTasks.some((task) => {
    return assignPriority(task.id) === "High" && !task.completed;
  });
  let allCompleted = allTasks.every((task) => task.completed);
  let message = "";
  if (allCompleted) {
    message = "All tasks completed!";
  } else if (hasHighPriority) {
    message = "You have high priority pending tasks!";
  } else {
    message = "No high priority tasks pending!";
  }
  alert(message);
}

export function createTaskProxy(task) {
  return new Proxy(task, {
    set(target, prop, value) {
      if (prop === "title" && typeof value !== "string") {
        throw new TypeError("Title must be a string!");
      }
      if (prop === "title" && value.trim() === "") {
        throw new Error("Title cannot be empty!");
      }
      if (prop === "completed" && typeof value !== "boolean") {
        throw new TypeError("Completed must be true or false!");
      }
      return Reflect.set(target, prop, value);
    },
    get(target, prop) {
      return Reflect.get(target, prop);
    },
  });
}

export { taskObserver };
