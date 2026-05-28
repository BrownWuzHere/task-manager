export class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.timestamp = new Date().toLocaleString();
  }
}

export class NetworkError extends AppError {
  constructor(message) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class StorageError extends AppError {
  constructor(message) {
    super(message, "STORAGE_ERROR");
    this.name = "StorageError";
  }
}

export function showError(message, duration = 3000) {
  let banner = document.getElementById("error-banner");
  banner.textContent = message;
  banner.classList.add("show");
  setTimeout(() => {
    banner.classList.remove("show");
  }, duration);
}

export function handleError(error) {
  console.error("[" + error.name + "] " + error.message);
  showError(error.message);
}
