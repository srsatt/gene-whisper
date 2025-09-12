import {
	AutoModel,
	AutoTokenizer,
	env,
	pipeline,
	Pipeline,
	Tensor,
	PreTrainedModel,
	PreTrainedTokenizer,
} from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

const pipelines = new Map<string, Pipeline | EmbeddingPipeline>();

async function getInstance(
	task: string,
	model: string,
	progress_callback?: (progress: any) => void,
) {
	const key = `${task}-${model}`;
	if (!pipelines.has(key)) {
		// T5 models require the text2text-generation task.
		const pipelineTask = model.includes('T5') ? 'text2text-generation' : task;

		if (task === 'embedding') {
			pipelines.set(key, new EmbeddingPipeline(model, progress_callback));
		} else {
			pipelines.set(
				key,
				await pipeline(pipelineTask as any, model, { progress_callback }),
			);
		}
	}
	return pipelines.get(key);
}

class EmbeddingPipeline {
	private tokenizer: Promise<PreTrainedTokenizer>;
	private model: Promise<PreTrainedModel>;

	constructor(modelName: string, progress_callback?: (progress: any) => void) {
		this.tokenizer = AutoTokenizer.from_pretrained(modelName, {
			progress_callback,
		});
		this.model = AutoModel.from_pretrained(modelName, { progress_callback });
	}

	async _call(
		texts: string[],
		{ pooling = 'mean', normalize = true } = {},
	) {
		const a = await this.tokenizer;
		const b = await this.model;

		const embeddings = [];
		for (const text of texts) {
			const inputs = await a(text);
			const { last_hidden_state } = await b(inputs);

			let embedding: Tensor;
			if (pooling === 'mean') {
				embedding = last_hidden_state.mean(1);
			} else {
				// Other pooling strategies can be added here
				embedding = last_hidden_state.mean(1); // default to mean
			}

			if (normalize) {
				embedding = embedding.normalize(2, -1);
			}
			embeddings.push(embedding.data);
		}
		return embeddings;
	}
}

export const getChatPipeline = async (
	model = 'Xenova/LaMini-Flan-T5-77M',
	progress_callback?: (progress: any) => void,
) => {
	return getInstance('text-generation', model, progress_callback);
};

export const getEmbeddingPipeline = async (
	model = 'Xenova/bge-small-en-v1.5',
	progress_callback?: (progress: any) => void,
) => {
	return getInstance('embedding', model, progress_callback);
};
