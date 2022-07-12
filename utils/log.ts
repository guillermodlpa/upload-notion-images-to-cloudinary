const log = {
  debug: function (message: string, ...args: any[]) {
    process.stdout.write(`\n⚪️ ${message}`);
  },

  info: function (message: string, ...args: any[]) {
    process.stdout.write(`\n🔵 ${message}`);
  },

  appendSentence: function (message: string) {
    process.stdout.write(`. ${message}`);
  },

  error: function (message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args);
  },
};

export default log;
