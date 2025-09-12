import React from 'react';
import { useLocalRuntime, type ChatModelAdapter } from '@assistant-ui/react';
import { getChatPipeline } from './models';
import { db } from './db';
import type { Message } from './db';

const MyModelAdapter: ChatModelAdapter = {
	async run({ messages, abortSignal }) {
		const pipe = await getChatPipeline();
		const lastMessage = messages[messages.length - 1];
		
		// Convert the message content to the format expected by the pipeline
		const content = lastMessage.content.map(part => part.text).join('');
		
		const response = await (pipe as any)(content);
		
		return {
			content: [
				{
					type: 'text',
					text: response[0].generated_text,
				},
			],
		};
	},
};

export const useAssistantRuntime = () => {
	const runtime = useLocalRuntime(MyModelAdapter);
	
	// Load messages from Dexie on startup
	React.useEffect(() => {
		db.messages.toArray().then((messages) => {
			if (messages.length > 0) {
				// Convert database messages to Assistant UI format
				const convertedMessages = messages.map(msg => ({
					...msg,
					content: msg.content
				}));
				runtime.thread.setMessages(convertedMessages as any);
			}
		});
	}, [runtime]);

	// Note: LocalRuntime handles message persistence automatically
	// We don't need to manually subscribe to messages as LocalRuntime manages this internally

	return runtime;
};
