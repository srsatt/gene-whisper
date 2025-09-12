import { Link, Outlet } from '@tanstack/react-router';
import React, { useEffect, useState } from 'react';
import * as Icons from '@radix-ui/react-icons';

const Root: React.FC = () => {
	const [isOffline, setIsOffline] = useState(!navigator.onLine);
	const [hasWebGpu, setHasWebGpu] = useState(false);

	useEffect(() => {
		const onlineHandler = () => setIsOffline(false);
		const offlineHandler = () => setIsOffline(true);
		window.addEventListener('online', onlineHandler);
		window.addEventListener('offline', offlineHandler);

		if ('gpu' in navigator) {
			(navigator as any).gpu.requestAdapter().then((adapter: any) => {
				setHasWebGpu(!!adapter);
			});
		}

		return () => {
			window.removeEventListener('online', onlineHandler);
			window.removeEventListener('offline', offlineHandler);
		};
	}, []);

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			{/* Educational Banner */}
			<div className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-900 py-2 px-4 text-center text-sm font-medium">
				<div className="flex items-center justify-center space-x-2">
					<Icons.InfoCircledIcon className="w-4 h-4" />
					<span>Educational only, not medical advice.</span>
				</div>
			</div>

			{/* Navigation */}
			<nav className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-8">
							<Link 
								to="/" 
								className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200 group"
								activeProps={{ className: 'flex items-center space-x-2 text-blue-600 font-medium' }}
							>
								<Icons.ChatBubbleIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
								<span>Chat</span>
							</Link>
							<Link 
								to="/assets" 
								className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200 group"
								activeProps={{ className: 'flex items-center space-x-2 text-blue-600 font-medium' }}
							>
								<Icons.FileTextIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
								<span>Assets</span>
							</Link>
							<Link 
								to="/settings" 
								className="flex items-center space-x-2 text-slate-700 hover:text-blue-600 font-medium transition-colors duration-200 group"
								activeProps={{ className: 'flex items-center space-x-2 text-blue-600 font-medium' }}
							>
								<Icons.GearIcon className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
								<span>Settings</span>
							</Link>
						</div>
						
						<div className="flex items-center space-x-6 text-sm">
							<div className="flex items-center space-x-2">
								<div className={`w-2 h-2 rounded-full ${hasWebGpu ? 'bg-green-500' : 'bg-red-500'}`}></div>
								<span className={`font-medium ${hasWebGpu ? 'text-green-700' : 'text-red-700'}`}>
									WebGPU: {hasWebGpu ? 'Available' : 'Unavailable'}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500' : 'bg-green-500'}`}></div>
								<span className={`font-medium ${isOffline ? 'text-red-700' : 'text-green-700'}`}>
									{isOffline ? 'Offline' : 'Online'}
								</span>
							</div>
						</div>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="flex-1">
				<Outlet />
			</main>
		</div>
	);
};

export default Root;
