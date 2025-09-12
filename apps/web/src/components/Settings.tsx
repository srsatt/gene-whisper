import React from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof Select.Item> {
	children: React.ReactNode;
	className?: string;
}

const SelectItem = React.forwardRef<React.ElementRef<typeof Select.Item>, SelectItemProps>(
	({ children, className, ...props }, forwardedRef) => {
		return (
			<Select.Item
				className={clsx(
					'text-sm leading-none text-gray-800 rounded-md flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-gray-400 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-blue-500 data-[highlighted]:text-white',
					className
				)}
				{...props}
				ref={forwardedRef}
			>
				<Select.ItemText>{children}</Select.ItemText>
				<Select.ItemIndicator className="absolute left-0 w-[25px] inline-flex items-center justify-center">
					<CheckIcon />
				</Select.ItemIndicator>
			</Select.Item>
		);
	}
);

const Settings: React.FC = () => {
	// These would come from a state management store
	const [provider, setProvider] = React.useState('browser');
	const [chatModel, setChatModel] = React.useState('Xenova/Qwen2-0.5B-Instruct');
	const [embeddingModel, setEmbeddingModel] = React.useState('Xenova/bge-small-en-v1.5');

	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
			<div className="space-y-6">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<label className="text-lg font-semibold text-gray-800" htmlFor="llm-provider">
						LLM Provider
					</label>
					<p className="text-sm text-gray-500 mt-1 mb-3">Choose where to run the AI models.</p>
					<Select.Root value={provider} onValueChange={setProvider}>
						<Select.Trigger
							id="llm-provider"
							className="inline-flex items-center justify-between rounded px-4 py-2 text-sm leading-none h-[35px] w-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="LLM Provider"
						>
							<Select.Value />
							<Select.Icon className="text-gray-600">
								<ChevronDownIcon />
							</Select.Icon>
						</Select.Trigger>
						<Select.Content className="overflow-hidden bg-white rounded-md shadow-lg">
							<Select.Viewport className="p-[5px]">
								<SelectItem value="browser">Browser (transformers.js)</SelectItem>
								<SelectItem value="devserver">Dev Server</SelectItem>
							</Select.Viewport>
						</Select.Content>
					</Select.Root>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<label className="text-lg font-semibold text-gray-800" htmlFor="chat-model">
						Chat Model
					</label>
					<p className="text-sm text-gray-500 mt-1 mb-3">Select the primary model for chat and instruction.</p>
					<Select.Root value={chatModel} onValueChange={setChatModel}>
						<Select.Trigger
							id="chat-model"
							className="inline-flex items-center justify-between rounded px-4 py-2 text-sm leading-none h-[35px] w-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Chat Model"
						>
							<Select.Value />
							<Select.Icon className="text-gray-600">
								<ChevronDownIcon />
							</Select.Icon>
						</Select.Trigger>
						<Select.Content className="overflow-hidden bg-white rounded-md shadow-lg">
							<Select.Viewport className="p-[5px]">
								<SelectItem value="Xenova/LaMini-Flan-T5-77M">LaMini-Flan-T5-77M</SelectItem>
								<SelectItem value="Xenova/Qwen2-0.5B-Instruct">Qwen2-0.5B-Instruct (Requires Login)</SelectItem>
							</Select.Viewport>
						</Select.Content>
					</Select.Root>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<label className="text-lg font-semibold text-gray-800" htmlFor="embedding-model">
						Embedding Model
					</label>
					<p className="text-sm text-gray-500 mt-1 mb-3">Select the model for creating vector embeddings.</p>
					<Select.Root value={embeddingModel} onValueChange={setEmbeddingModel}>
						<Select.Trigger
							id="embedding-model"
							className="inline-flex items-center justify-between rounded px-4 py-2 text-sm leading-none h-[35px] w-full bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
							aria-label="Embedding Model"
						>
							<Select.Value />
							<Select.Icon className="text-gray-600">
								<ChevronDownIcon />
							</Select.Icon>
						</Select.Trigger>
						<Select.Content className="overflow-hidden bg-white rounded-md shadow-lg">
							<Select.Viewport className="p-[5px]">
								<SelectItem value="Xenova/bge-small-en-v1.5">bge-small-en-v1.5</SelectItem>
								<SelectItem value="Xenova/all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Fallback)</SelectItem>
							</Select.Viewport>
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</div>
	);
};

export default Settings;
