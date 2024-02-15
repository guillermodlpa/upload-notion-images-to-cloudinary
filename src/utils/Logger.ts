export default class Logger {
  level;

  constructor(level: "debug" | "info" | "error" | "none") {
    this.level = level;
  }

  debug(message: string, ...args: any[]) {
    if (this.level === "debug") {
      console.log(`[upload-notion-images-to-cloudinary][DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level === "debug" || this.level === "info") {
      console.log(`[upload-notion-images-to-cloudinary][INFO] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (
      this.level === "debug" ||
      this.level === "info" ||
      this.level === "error"
    ) {
      console.error(
        `[upload-notion-images-to-cloudinary][ERROR] ${message}`,
        ...args
      );
    }
  }
}
