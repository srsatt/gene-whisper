import { getChatPipeline } from '../models';
import { createChatBotMessage } from 'react-chatbot-kit';

class ActionProvider {
  constructor(createChatBotMessage, setStateFunc, createClientMessage) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
    this.createClientMessage = createClientMessage;
  }

  async handleMessage(message) {
    const pipe = await getChatPipeline();
    
    // In a real app, you'd manage conversation history.
    // For this boilerplate, we'll just send the single message.
    const response = await pipe(message);

    const botMessage = this.createChatBotMessage(response[0].generated_text);
    this.setState((prev) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  }
}

export default ActionProvider;
