import {
	AssistantRuntimeProvider,
	ComposerPrimitive,
	ThreadPrimitive,
	MessagePrimitive,
} from '@assistant-ui/react';
import React from 'react';
import { useAssistantRuntime } from './runtime';
import * as Icons from '@radix-ui/react-icons';

const App: React.FC = () => {
	const assistantRuntime = useAssistantRuntime();
	
	return (
		<AssistantRuntimeProvider runtime={assistantRuntime}>
			<div className="h-full flex flex-col">

				{/* Main Chat Area */}
				<main className="flex-1 flex flex-col min-h-0">
					<ThreadPrimitive.Root className="flex-1 flex flex-col">
						<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
							<div className="max-w-4xl mx-auto px-6 py-8">
								<ThreadPrimitive.Messages
									components={{
										UserMessage: () => (
											<div className="flex justify-end mb-6 animate-slide-up">
												<div className="flex items-end space-x-3 max-w-[80%]">
													<div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl rounded-br-md shadow-lg">
														<MessagePrimitive.Parts />
													</div>
													<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
														U
													</div>
												</div>
											</div>
										),
										AssistantMessage: () => (
											<div className="flex justify-start mb-6 animate-slide-up">
												<div className="flex items-end space-x-3 max-w-[80%]">
													<div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
														AI
													</div>
													<div className="bg-white text-slate-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg border border-slate-200">
														<MessagePrimitive.Parts />
													</div>
												</div>
											</div>
										),
									}}
								/>
							</div>
						</ThreadPrimitive.Viewport>
					</ThreadPrimitive.Root>

					{/* Composer */}
					<div className="bg-white/80 backdrop-blur-sm border-t border-slate-200 p-6">
						<div className="max-w-4xl mx-auto">
							<ComposerPrimitive.Root className="relative">
								<div className="flex items-end space-x-3 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all duration-200">
									<ComposerPrimitive.Input
										placeholder="Ask me anything about genetics..."
										className="flex-1 px-6 py-4 text-slate-800 placeholder-slate-400 bg-transparent border-0 rounded-2xl focus:outline-none resize-none"
									/>
									<ComposerPrimitive.Send className="m-2 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl">
										<Icons.PaperPlaneIcon className="w-5 h-5" />
									</ComposerPrimitive.Send>
								</div>
							</ComposerPrimitive.Root>
						</div>
					</div>
				</main>
			</div>
		</AssistantRuntimeProvider>
	);
};

export default App;
