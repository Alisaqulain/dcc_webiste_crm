'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function TrainingVideosPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const [videos, setVideos] = useState([]);
	const [courses, setCourses] = useState([]);
	const [selectedVideo, setSelectedVideo] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchVideos = async () => {
			try {
				const response = await fetch('/api/crm/training-videos');
				if (response.ok) {
					const data = await response.json();
					setVideos(data.videos || []);
					setCourses(data.courses || []);
					if (data.videos && data.videos.length > 0) {
						setSelectedVideo(data.videos[0]);
					}
				}
			} catch (error) {
				console.error('Error fetching videos:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (session) {
			fetchVideos();
		}
	}, [session]);

	// Extract YouTube video ID from URL
	const getYouTubeEmbedUrl = (url) => {
		if (!url) return null;
		const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
		const match = url.match(regExp);
		return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}?rel=0` : null;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (!selectedVideo && videos.length === 0) {
		return (
			<div className="space-y-6">
				<div className="bg-white border rounded-md p-6 text-center">
					<h2 className="text-lg font-semibold mb-2">No Training Videos Available</h2>
					<p className="text-sm text-gray-600">Purchase a course to access training videos.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 bg-white border rounded-md overflow-hidden">
					{selectedVideo && (
						<>
							<div className="aspect-video bg-black">
								{selectedVideo.youtubeUrl ? (
									<iframe
										title={selectedVideo.title}
										className="w-full h-full"
										src={getYouTubeEmbedUrl(selectedVideo.youtubeUrl)}
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
										allowFullScreen
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center text-white">
										<p>Video not available</p>
									</div>
								)}
							</div>
							<div className="p-3 border-t">
								<div className="font-semibold text-sm">{selectedVideo.title}</div>
								{selectedVideo.description && (
									<div className="text-xs text-gray-600 mt-1">{selectedVideo.description}</div>
								)}
								<div className="text-xs text-gray-500 mt-1">Course: {selectedVideo.courseTitle} • Duration: {selectedVideo.duration}</div>
								<div className="mt-3">
									<button
										onClick={() => router.push('/my-courses')}
										className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
									>
										Watch Video in My Courses
									</button>
								</div>
							</div>
						</>
					)}
				</div>

				<div className="space-y-3">
					<div className="text-sm font-semibold">More Videos</div>
					<div className="bg-white border rounded-md divide-y max-h-[600px] overflow-y-auto">
						{videos.length > 0 ? (
							videos.map((v, i) => (
								<div 
									key={i} 
									className={`flex gap-3 p-2 cursor-pointer hover:bg-gray-50 ${selectedVideo?.id === v.id ? 'bg-blue-50' : ''}`}
									onClick={() => setSelectedVideo(v)}
								>
									<div className="w-28 h-16 bg-gray-200 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
										{v.courseThumbnail ? (
											<img src={v.courseThumbnail} alt={v.title} className="h-full w-full object-cover" />
										) : (
											<span className="text-xs text-gray-400">No thumbnail</span>
										)}
									</div>
									<div className="min-w-0">
										<div className="text-sm font-medium truncate">{v.title}</div>
										<div className="text-xs text-gray-500 truncate">{v.courseTitle} • {v.duration}</div>
									</div>
								</div>
							))
						) : (
							<div className="p-4 text-center text-sm text-gray-500">No videos available</div>
						)}
					</div>
				</div>
			</div>

			{courses.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
					{courses.map((c) => (
						<div key={c.id} className="bg-white border rounded-md p-3 text-center">
							<div className="h-28 w-full bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
								{c.thumbnail ? (
									<img src={c.thumbnail} alt={c.title} className="h-full w-full object-cover" />
								) : (
									<span className="text-xs text-gray-400">No image</span>
								)}
							</div>
							<div className="text-sm font-semibold">{c.title}</div>
							<div className="text-xs text-gray-500 mt-1">{c.videoCount} videos</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}


