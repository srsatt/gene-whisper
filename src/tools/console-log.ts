/**
 * Console log tool for the AI assistant
 */
export const consoleLogTool = {
  name: 'console_log',
  description: 'Logs a message to the browser console',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to log to the console'
      }
    },
    required: ['message']
  },
  execute: async (args: { message: string }) => {
    console.log('AI Assistant Log:', args.message);
    return `Logged to console: ${args.message}`;
  }
};
