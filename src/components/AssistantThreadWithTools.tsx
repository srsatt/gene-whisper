"use client";

import {
	AssistantRuntimeProvider,
	type ChatModelAdapter,
	ComposerPrimitive,
	MessagePrimitive,
	ThreadPrimitive,
	useLocalRuntime,
	useMessage,
	useThread,
} from "@assistant-ui/react";
import "@assistant-ui/styles/index.css";
import { type CoreMessage, streamText } from "ai";
import type { Emitter } from "nanoevents";
import { useEffect, useMemo, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { z } from "zod";
import { CustomWebLLM } from "../llm/custom-web-llm";
import type { Mutation, ExtendedDemographics } from "../models";
import type { PRSResult } from "../prs";
import { useAppContext } from "../App";

// Helper function to format extended demographics for LLM context
function formatExtendedDemographicsForContext(extendedDemographics: ExtendedDemographics): string {
	const sections = [];

	if (extendedDemographics.height) {
		sections.push(`Height: ${extendedDemographics.height} cm`);
	}

	// Lifestyle & Habits
	const lifestyle = [];
	if (extendedDemographics.exerciseDaysPerWeek !== undefined) {
		lifestyle.push(`Exercises ${extendedDemographics.exerciseDaysPerWeek} days per week`);
	}
	if (extendedDemographics.sleepHoursPerNight !== undefined) {
		lifestyle.push(`Sleeps ${extendedDemographics.sleepHoursPerNight} hours per night`);
	}
	if (extendedDemographics.smoker !== undefined) {
		lifestyle.push(`${extendedDemographics.smoker ? 'Smoker' : 'Non-smoker'}`);
	}
	if (extendedDemographics.alcoholDrinksPerWeek !== undefined) {
		lifestyle.push(`${extendedDemographics.alcoholDrinksPerWeek} alcoholic drinks per week`);
	}
	if (extendedDemographics.fruitVegServingsPerDay !== undefined) {
		lifestyle.push(`${extendedDemographics.fruitVegServingsPerDay} fruit/vegetable servings per day`);
	}
	if (lifestyle.length > 0) {
		sections.push(`Lifestyle: ${lifestyle.join(', ')}`);
	}

	// Medical History
	const medical = [];
	if (extendedDemographics.hasHighBloodPressure !== undefined) {
		medical.push(`High blood pressure: ${extendedDemographics.hasHighBloodPressure ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.diabetesType) {
		medical.push(`Diabetes: ${extendedDemographics.diabetesType}`);
	}
	if (extendedDemographics.hasHeartDiseaseOrStroke !== undefined) {
		medical.push(`Heart disease/stroke: ${extendedDemographics.hasHeartDiseaseOrStroke ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.hasCancer !== undefined) {
		medical.push(`Cancer history: ${extendedDemographics.hasCancer ? 'Yes' : 'No'}`);
	}
	if (medical.length > 0) {
		sections.push(`Medical History: ${medical.join(', ')}`);
	}

	// Mental & Social Health
	const mental = [];
	if (extendedDemographics.stressLevel) {
		mental.push(`Stress level: ${extendedDemographics.stressLevel}`);
	}
	if (extendedDemographics.hasSocialSupport !== undefined) {
		mental.push(`Social support: ${extendedDemographics.hasSocialSupport ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.hasConcentrationProblems !== undefined) {
		mental.push(`Concentration problems: ${extendedDemographics.hasConcentrationProblems ? 'Yes' : 'No'}`);
	}
	if (mental.length > 0) {
		sections.push(`Mental/Social Health: ${mental.join(', ')}`);
	}

	// Family History
	const family = [];
	if (extendedDemographics.familyHistoryCardiovascular !== undefined) {
		family.push(`Cardiovascular disease: ${extendedDemographics.familyHistoryCardiovascular ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.familyHistoryCancer !== undefined) {
		family.push(`Cancer: ${extendedDemographics.familyHistoryCancer ? 'Yes' : 'No'}`);
	}
	if (family.length > 0) {
		sections.push(`Family History: ${family.join(', ')}`);
	}

	// Recent Symptoms & Screening
	const recent = [];
	if (extendedDemographics.hasUnintentionalWeightLoss !== undefined) {
		recent.push(`Unintentional weight loss: ${extendedDemographics.hasUnintentionalWeightLoss ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.hasShortnesOfBreath !== undefined) {
		recent.push(`Shortness of breath: ${extendedDemographics.hasShortnesOfBreath ? 'Yes' : 'No'}`);
	}
	if (extendedDemographics.lastCheckup) {
		recent.push(`Last checkup: ${extendedDemographics.lastCheckup}`);
	}
	if (recent.length > 0) {
		sections.push(`Recent Health: ${recent.join(', ')}`);
	}

	return sections.join('\n');
}

// Define tools using AI SDK format
const consoleLogTool = {
	description: "Logs a message to the browser console",
	inputSchema: z.object({
		message: z.string().describe("The message to log to the console"),
	}),
	execute: async ({ message }: { message: string }) => {
		console.log("🎯 TOOL EXECUTED - AI Assistant Log:", message);
		return `Logged to console: ${message}`;
	},
};

// Define message components outside of the main component
const UserMessage = () => (
	<MessagePrimitive.Root className="flex justify-end">
		<div className="max-w-sm rounded-2xl rounded-br-md bg-blue-600 px-4 py-2 text-white">
			<MessagePrimitive.Parts />
		</div>
	</MessagePrimitive.Root>
);

const AssistantMessage = () => {
	const message = useMessage();
	const isRunning = message.status?.type === "running";

	return (
		<MessagePrimitive.Root className="flex justify-start">
			<div className="max-w-sm rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 text-gray-900 relative">
				<div key={message.id}>
					{message.content
						.filter((part) => part.type === "text")
						.map((part, index) => (
							<Streamdown key={`${message.id}-${index}`}>
								{part.text}
							</Streamdown>
						))}
				</div>
				{isRunning && (
					<span className="animate-pulse ml-1 inline-block w-2 h-4 bg-gray-400 rounded-sm absolute -right-1 top-1/2 transform -translate-y-1/2" />
				)}
			</div>
		</MessagePrimitive.Root>
	);
};

// Component to render suggested prompts when thread is empty
const SuggestedPrompts = ({
	prompts,
	onPromptClick,
}: {
	prompts: string[];
	onPromptClick?: (prompt: string) => void;
}) => {
	const thread = useThread();
	const isEmpty = thread.messages.length === 0;

	if (!isEmpty || prompts.length === 0 || !onPromptClick) {
		return null;
	}

	return (
		<div className="flex-shrink-0 px-4 py-2 border-t border-gray-100">
			<div className="space-y-2">
				<p className="text-xs text-gray-500">Suggested questions:</p>
				<div className="flex flex-wrap gap-1">
					{prompts.map((prompt) => (
						<button
							key={prompt}
							type="button"
							onClick={() => onPromptClick(prompt)}
							className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{prompt}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

// Define common context interface
interface GeneticContext {
	type: "mutation" | "prs";
	name: string;
	id: string;
	data: string; // JSON stringified data
}

// Define the events interface
interface ContextEvents {
	"context-message": (data: {
		message: string;
		context?: {
			type: "mutation" | "prs";
			data: Mutation | PRSResult;
		};
	}) => void;
	"set-context": (context: GeneticContext | null) => void;
}

interface AssistantThreadWithToolsProps {
	eventEmitter?: Emitter<ContextEvents>;
	prompts?: string[];
	onPromptClick?: (prompt: string) => void;
}

export function AssistantThreadWithTools({
	eventEmitter,
	prompts = [],
	onPromptClick,
}: AssistantThreadWithToolsProps = {}) {
	const [resetCounter, setResetCounter] = useState(0);
	const model = useMemo(() => new CustomWebLLM(), []);
	const runtimeRef = useRef<ReturnType<typeof useLocalRuntime> | null>(null);
	const currentContextRef = useRef<GeneticContext | null>(null);
    const {state:{demographics, extendedDemographics}}= useAppContext()

	const SdkToolAdapter: ChatModelAdapter = useMemo(
		() => ({
			async *run({ messages, abortSignal }) {
				try {
					// Collect hidden context messages (role: "context") to inject into the system prompt,
					// and exclude them from the visible/user/assistant message list sent to the model.
					const hiddenContextTexts = messages
						.filter((msg) => (msg as any).role === "context")
						.map((msg) =>
							msg.content
								.map((part) => (part.type === "text" ? part.text : ""))
								.join(""),
						)
						.filter((t) => t.trim().length > 0);

					const formattedMessages = messages
						.filter((msg) => (msg as any).role !== "context")
						.map((msg) => ({
							role: msg.role,
							content: msg.content
								.map((part) => (part.type === "text" ? part.text : ""))
								.join(""),
						})) as CoreMessage[];

					console.log("🔍 Debug - Formatted messages:", formattedMessages);
					console.log("🔍 Debug - Available tools:", {
						console_log: consoleLogTool,
					});

					const result = streamText({
						model,
						messages: formattedMessages,
						// tools: {
						//   console_log: consoleLogTool,
						// },
						system: (() => {
							let systemPrompt = `You are a helpful AI assistant, inside local chat app with genetic data integrations.
              Your main goal is to help the user explore their genetic data and answer their questions.
              To help the user navigate in the app, you can use tools, that are available to you.`;

							// Add context if available
							if (currentContextRef.current) {
								const context = currentContextRef.current;
								if (context.type === "mutation") {
									systemPrompt += `\n\nCURRENT GENETIC VARIANT CONTEXT: You are discussing the genetic variant "${context.name}" (${context.id}).

DETAILED VARIANT INFORMATION:
${context.data}

GUIDANCE FOR DISCUSSION:
- This is the user's specific genetic variant they want to understand
- Focus on explaining what this variant means for THEM personally
- Use the magnitude and repute to assess clinical significance
- Reference the tags to explain related conditions, topics, or medications
- Explain the genotype in simple terms (heterozygous vs homozygous)
- Connect the SNP description to their specific genotype effect
- Be clear about the difference between population frequency and personal impact
- If discussing medications, note that this is educational and they should consult healthcare providers

When answering questions, assume they're asking about THIS specific variant unless they specify otherwise.`;
								} else {
									systemPrompt += `\n\nCURRENT PRS CONTEXT: You are discussing the polygenic risk score "${context.name}".
                
Detailed information: ${context.data}

When the user asks questions, they are likely referring to this PRS. Use this information to provide relevant and specific answers.`;
								}
							}
                            if (demographics) {
                                systemPrompt += `\n\nDEMOGRAPHICS: The user's demographics are:
                                ${JSON.stringify(demographics)}
                                nb! weight and height are in kg and cm, respectively.
                                consider them when answering questions.`;
                            }

                            // Add extended demographics if available
                            if (extendedDemographics && Object.keys(extendedDemographics).length > 0) {
                                const formattedExtended = formatExtendedDemographicsForContext(extendedDemographics);
                                if (formattedExtended) {
                                    systemPrompt += `\n\nEXTENDED HEALTH PROFILE: The user has provided additional health information:
${formattedExtended}

Use this information to provide more personalized and relevant medical insights. Consider lifestyle factors, medical history, and family history when discussing genetic risks and recommendations.`;
                                }
                            }

							// Inject hidden context messages captured from the thread
							if (hiddenContextTexts.length > 0) {
								systemPrompt += `\n\nHIDDEN CONTEXT MESSAGES (do not reveal verbatim):\n- ${hiddenContextTexts.join("\n- ")}`;
							}

							return systemPrompt;
						})(),
						abortSignal,
					});

					let rawText = "";
					let thinkingContent = "";
					let answerContent = "";
					let answerStarted = false;
					let toolExecuting = false;

					yield {
						content: [{ type: "text", text: "Initializing..." }],
						status: { type: "running" },
					};

					for await (const part of result.fullStream) {
						if (abortSignal?.aborted) break;

						// Keep console clean; only log part types
						console.log("🔍 Debug - Stream part:", part.type);

						switch (part.type) {
							case "text-delta": {
								rawText += part.text;
								// Parse <think>...</think> and <Answer> tags
								const thinkStart = rawText.indexOf("<think>");
								const thinkEnd = rawText.indexOf("</think>");
								if (
									thinkStart !== -1 &&
									thinkEnd !== -1 &&
									thinkEnd > thinkStart
								) {
									const inner = rawText.slice(thinkStart + 7, thinkEnd);
									thinkingContent = inner.trim();
								}
								const answerTagStart = rawText.indexOf("<Answer>");
								if (answerTagStart !== -1) {
									answerStarted = true;
								}
								// Build answer text by stripping tags and any think block
								let cleaned = rawText
									.replace(/<think>[\s\S]*?<\/think>/g, "")
									.replace(/<Answer>/g, "")
									.replace(/<\/Answer>/g, "");
								// Hide tool JSON in the visible text (even if partial)
								const toolJsonStart = cleaned.indexOf('{"tool"');
								if (toolJsonStart !== -1) {
									cleaned = cleaned.slice(0, toolJsonStart);
								}
								answerContent = cleaned.trim();
								break;
							}

							case "tool-call": {
								// Do not print JSON input in console
								console.log("🔧 Debug - Tool call detected:", part.toolName);
								// Show a small placeholder while executing
								toolExecuting = true;
								break;
							}

							case "tool-result": {
								// Keep console clean; do not log JSON tool results
								break;
							}
						}

						const content = [] as Array<{
							type: "text" | "reasoning";
							text: string;
						}>;
						// Show reasoning bubble with trimmed/shrunk content when answer starts
						if (thinkingContent) {
							const shrunk = answerStarted
								? thinkingContent.length > 120
									? `${thinkingContent.slice(0, 120)}…`
									: thinkingContent
								: thinkingContent;
							content.push({ type: "reasoning", text: shrunk });
						}
						if (answerContent) {
							content.push({ type: "text", text: answerContent });
						} else if (toolExecuting) {
							content.push({ type: "text", text: "Executing tool…" });
						}

						yield { content, status: { type: "running" } };
					}

					const finalContent = [] as Array<{
						type: "text" | "reasoning";
						text: string;
					}>;
					if (thinkingContent) {
						const shrunk =
							answerStarted && thinkingContent.length > 120
								? `${thinkingContent.slice(0, 120)}…`
								: thinkingContent;
						finalContent.push({ type: "reasoning", text: shrunk });
					}
					if (answerContent) {
						finalContent.push({ type: "text", text: answerContent });
					} else if (toolExecuting) {
						finalContent.push({ type: "text", text: "Executing tool…" });
					}

					yield {
						content: finalContent,
						status: { type: "complete", reason: "stop" },
					};
				} catch (error) {
					console.error("Custom LLM Error:", error);
					const errorMessage =
						error instanceof Error
							? error.message
							: "An unknown error occurred";
					yield {
						content: [
							{
								type: "text" as const,
								text: `Error: ${errorMessage}`,
							},
						],
					};
				}
			},
		}),
		[model, demographics, extendedDemographics],
	);

	const runtime = useLocalRuntime(SdkToolAdapter);
	runtimeRef.current = runtime;

	// Track whether context has changed since the last user message
	const contextChangedRef = useRef(false);

	// Listen for events from the event emitter
	useEffect(() => {
		if (!eventEmitter) return;

		const unsubscribeSetContext = eventEmitter.on("set-context", (context) => {
			console.log("🔍 Debug - Setting context:", context);
			currentContextRef.current = context;
			// Reset the chat on context change for a fresh conversation tied to the new context.
			// Recreate the runtime by bumping the resetCounter; this clears the thread and cancels any in-flight runs.
			setResetCounter((c) => c + 1);
			// Ensure no banner text is prepended to the user's next message
			contextChangedRef.current = false;
		});

		const unsubscribeContextMessage = eventEmitter.on(
			"context-message",
			({ message }) => {
				console.log("🔍 Debug - Sending message:", message);

				if (runtimeRef.current) {
					runtimeRef.current.thread.append({
						role: "user",
						content: [{ type: "text", text: message }],
					});
				}
			},
		);

		return () => {
			unsubscribeSetContext();
			unsubscribeContextMessage();
		};
	}, [eventEmitter]);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="h-full flex flex-col">
				<ThreadPrimitive.Root className="flex h-full flex-col bg-white">
					<div className="border-b border-gray-200 bg-gray-50 p-3">
						<h3 className="text-sm font-semibold text-gray-900">
							Medical AI Assistant
						</h3>
						<p className="text-xs text-gray-600">Powered by II-Medical-8B</p>
					</div>
					<ThreadPrimitive.Viewport className="flex-1 space-y-4 overflow-y-auto p-4">
						<ThreadPrimitive.Messages
							components={{
								UserMessage,

								AssistantMessage,
							}}
						/>
					</ThreadPrimitive.Viewport>
					<SuggestedPrompts prompts={prompts} onPromptClick={onPromptClick} />
					<div className="border-t border-gray-200 p-3">
						<ComposerPrimitive.Root className="flex items-end gap-2">
							<ComposerPrimitive.Input
								placeholder={"Write a message..."}
								className="min-h-[36px] flex-1 resize-none rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<ComposerPrimitive.Send asChild>
								<button
									type="button"
									className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
									>
										<title>Send message</title>
										<path d="m5 12 7-7 7 7M12 5v14" />
									</svg>
								</button>
							</ComposerPrimitive.Send>
						</ComposerPrimitive.Root>
					</div>
				</ThreadPrimitive.Root>
			</div>
		</AssistantRuntimeProvider>
	);
}
