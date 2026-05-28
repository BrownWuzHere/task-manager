import { assignPriority, getPriorityColor } from "./priority.js";

export function displayTasks(tasksToRender) {
  let listContainer = document.getElementById("task-list");
  listContainer.innerHTML = "";

  if (tasksToRender.length === 0) {
    listContainer.innerHTML = "<li>No tasks found</li>";
    return;
  }

  let tasksWithPriority = tasksToRender.map((task) => {
    return { ...task, priority: assignPriority(task.id) };
  });

  tasksWithPriority.slice(0, 10).forEach((task) => {
    let { bg, color } = getPriorityColor(task.priority);
    let li = document.createElement("li");
    li.innerHTML = `
      <span class="badge" style="background:${bg};color:${color};">${task.priority}</span>
      <span class="title">${task.title}</span>
      <button class="complete-btn" data-id="${task.id}" data-action="complete">Done</button>
      <button class="edit-btn" data-id="${task.id}" data-action="edit">Edit</button>
      <button data-id="${task.id}" data-action="delete">Delete</button>
    `;
    listContainer.appendChild(li);
  });
}

export function liveDetails(allTasks) {
  let p = document.querySelector("p");
  let stats = allTasks.reduce(
    (acc, task) => {
      if (task.completed) acc.completed++;
      else acc.pending++;
      return acc;
    },
    { completed: 0, pending: 0 },
  );
  let total = allTasks.length;
  p.innerHTML =
    "<span>Total: " +
    total +
    " | Completed: " +
    stats.completed +
    " | Pending: " +
    stats.pending +
    "</span>";
}
