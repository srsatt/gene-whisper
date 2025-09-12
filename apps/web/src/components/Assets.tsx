import React, { useState } from 'react';
import { getChatPipeline, getEmbeddingPipeline } from '../models';

const ModelAsset: React.FC<{ modelName: string; pipeline: 'chat' | 'embedding' }> = ({ modelName, pipeline }) => {
	const [progress, setProgress] = useState(0);
	const [status, setStatus] = useState('Not loaded');
	const [loadedBytes, setLoadedBytes] = useState(0);
	const [totalBytes, setTotalBytes] = useState(0);

	const loadModel = async () => {
		setStatus('Loading...');
		const loader = pipeline === 'chat' ? getChatPipeline : getEmbeddingPipeline;
		try {
			await loader(modelName, (progressData: any) => {
				if (progressData.status === 'progress' && progressData.progress) {
					setProgress(progressData.progress);
					setLoadedBytes(progressData.loaded || 0);
					setTotalBytes(progressData.total || 0);
				} else if (progressData.status === 'done') {
					setStatus('Loaded');
					setProgress(100);
				}
			});
		} catch (e) {
			console.error('Failed to load model:', e);
			setStatus('Error');
		}
	};

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className="bg-white p-6 rounded-lg shadow-md mb-4">
			<h4 className="text-lg font-semibold text-gray-800">{modelName}</h4>
			<div className="flex justify-between items-center mt-2 text-sm text-gray-600">
				<p>Status: <span className={`font-medium ${status === 'Error' ? 'text-red-600' : 'text-gray-800'}`}>{status}</span></p>
				{status === 'Loading...' && (
					<p>{formatBytes(loadedBytes)} / {formatBytes(totalBytes)}</p>
				)}
			</div>
			{status !== 'Loaded' && (
				<div className="mt-4">
					<div className="w-full bg-gray-200 rounded-full h-2.5">
						<div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
					</div>
					<button
						type="button"
						onClick={loadModel}
						disabled={status === 'Loading...'}
						className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
					>
						{status === 'Loading...' ? 'Loading...' : 'Load Model'}
					</button>
				</div>
			)}
			{status === 'Error' && (
				<p className="mt-4 text-red-600">Failed to load model. Check the console for details.</p>
			)}
		</div>
	);
};

const Assets: React.FC = () => {
	return (
		<div className="max-w-2xl mx-auto">
			<h2 className="text-2xl font-bold text-gray-800 mb-2">Assets</h2>
			<p className="text-gray-600 mb-6">Preload models into the browser's cache to use the application offline. This may take some time.</p>
			<ModelAsset modelName="Xenova/LaMini-Flan-T5-77M" pipeline="chat" />
			<ModelAsset modelName="Xenova/bge-small-en-v1.5" pipeline="embedding" />
		</div>
	);
};

export default Assets;
