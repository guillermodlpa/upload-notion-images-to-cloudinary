const log = {
  debug: function (message: string, ...args: any[]) {
    process.stdout.write(
      `\n[upload-notion-images-to-cloudinary][DEBUG] ${message}`
    );
  },

  info: function (message: string, ...args: any[]) {
    process.stdout.write(
      `\n[upload-notion-images-to-cloudinary][INFO] ${message}`
    );
  },

  appendSentence: function (message: string) {
    process.stdout.write(`. ${message}`);
  },

  error: function (message: string, ...args: any[]) {
    console.error(
      `[upload-notion-images-to-cloudinary][ERROR] ${message}`,
      ...args
    );
  },
};

export default log;
