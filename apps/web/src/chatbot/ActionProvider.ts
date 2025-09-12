import { getChatPipeline } from '../models';

class ActionProvider {
  createChatBotMessage: any;
  setState: any;
  createClientMessage: any;

  constructor(createChatBotMessage: any, setStateFunc: any, createClientMessage: any) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  async handleMessage(message: string) {
    const pipe = await getChatPipeline();
    
    // In a real app, you'd manage conversation history.
    // For this boilerplate, we'll just send the single message.
    const response = await (pipe as any)(message);

    const botMessage = this.createChatBotMessage(response[0].generated_text);
    this.setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  }
}

export default ActionProvider;
