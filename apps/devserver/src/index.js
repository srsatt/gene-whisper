import express from 'express';
import cors from 'cors';
import { pipeline } from '@xenova/transformers';

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3001;

// Store pipelines in a cache to avoid reloading models on every request.
const pipelines = {};
async function getPipeline(task, model) {
    if (!pipelines[model]) {
        pipelines[model] = await pipeline(task, model);
    }
    return pipelines[model];
}

app.post('/v1/embeddings', async (req, res) => {
    const { input, model = 'Xenova/bge-small-en-v1.5' } = req.body;

    if (!input) {
        return res.status(400).json({ error: 'Missing "input" in request body' });
    }

    try {
        const embedder = await getPipeline('feature-extraction', model);
        const embeddings = await embedder(input, { pooling: 'mean', normalize: true });
        
        res.json({
            data: embeddings.tolist().map(e => ({ embedding: e })),
            model: model,
            dims: embeddings.dims[1],
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/v1/chat', async (req, res) => {
    const { messages, model = 'Xenova/Qwen2.5-0.5B-Instruct' } = req.body;

    if (!messages) {
        return res.status(400).json({ error: 'Missing "messages" in request body' });
    }

    try {
        const generator = await getPipeline('text-generation', model);
        const output = await generator(messages, {
            max_new_tokens: 1024,
            temperature: 0.7,
            do_sample: true,
        });

        res.json({
            model: model,
            output: output[0].generated_text,
            usage: {
                prompt_tokens: 0, // transformers.js does not provide token counts
                output_tokens: 0,
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


app.listen(port, () => {
    console.log(`Dev server listening on http://localhost:${port}`);
});
