'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function DownloadFilesPage() {
	const { data: session } = useSession();
	const [files, setFiles] = useState([]);
	const [downloading, setDownloading] = useState({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState('');

	const fetchFileInfo = async () => {
		setIsLoading(true);
		setError('');
		try {
			const response = await fetch('/api/crm/file/info', { cache: 'no-store' });
			if (response.ok) {
				const data = await response.json();
				console.log('File info response:', data);
				if (data.hasFile && data.files && data.files.length > 0) {
					// Show all files, filter out ones that don't exist
					const existingFiles = data.files.filter(f => f.fileExists);
					if (existingFiles.length > 0) {
						setFiles(existingFiles);
						setError('');
					} else {
						setFiles([]);
						setError('Files were uploaded but not found on server. Please contact admin.');
					}
				} else if (data.hasFile && data.file) {
					// Backward compatibility: single file
					if (data.fileExists) {
						setFiles([data.file]);
						setError('');
					} else {
						setFiles([]);
						setError('File was uploaded but not found on server. Please contact admin.');
					}
				} else {
					setFiles([]);
					setError(data.message || 'No file has been uploaded for your account yet. Please contact admin.');
				}
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Failed to load file information');
				setFiles([]);
			}
		} catch (error) {
			console.error('Error fetching file info:', error);
			setError('Failed to load file information. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (session) {
			fetchFileInfo();
		}
	}, [session]);

	const handleDownload = async (file) => {
		const fileId = file._id || file.filename;
		setDownloading(prev => ({ ...prev, [fileId]: true }));
		setError('');
		try {
			// Download specific file by URL, passing file identifier to track download
			const fileUrl = file.url;
			if (!fileUrl) {
				throw new Error('File URL not available');
			}

			// Use the download API to track download status
			const downloadUrl = `/api/admin/crm-file/download?${file._id ? `fileId=${file._id}` : `url=${encodeURIComponent(fileUrl)}`}`;
			const response = await fetch(downloadUrl);
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
				throw new Error(errorData.message || 'Download failed');
			}

			// Get filename from Content-Disposition header or use file info
			const contentDisposition = response.headers.get('Content-Disposition');
			let filename = file.originalName || file.filename || 'crm-file.xlsx';
			if (contentDisposition) {
				const filenameMatch = contentDisposition.match(/filename="(.+)"/);
				if (filenameMatch) {
					filename = filenameMatch[1];
				}
			}

			// Create blob and download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			// Refresh file info to update download status
			setTimeout(() => {
				fetchFileInfo();
			}, 1000);
		} catch (error) {
			setError('Failed to download file: ' + error.message);
		} finally {
			setDownloading(prev => ({ ...prev, [fileId]: false }));
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading file information...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Download Files</h1>
						<p className="text-gray-600">Download your assigned resources and files</p>
					</div>
					<button
						onClick={fetchFileInfo}
						disabled={isLoading}
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						Refresh
					</button>
				</div>
			</div>

			{/* Files List */}
			{files.length > 0 ? (
				<div className="space-y-4">
					{files.map((file, index) => {
						const fileId = file._id || file.filename || index;
						const isDownloading = downloading[fileId];
						return (
							<div key={fileId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
								<div className="flex items-center justify-between mb-6">
									<div className="flex items-center gap-4">
										<div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
											<svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
											</svg>
										</div>
										<div>
											<div className="flex items-center gap-2">
												<h3 className="text-lg font-semibold text-gray-900">{file.originalName || file.filename}</h3>
												{file.downloaded && (
													<span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full">
														<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
														</svg>
													</span>
												)}
											</div>
											<p className="text-sm text-gray-500">
												Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'N/A'}
											</p>
											{file.downloadedAt && (
												<p className="text-xs text-green-600 mt-1">
													Downloaded: {new Date(file.downloadedAt).toLocaleString()}
												</p>
											)}
											{file.size && (
												<p className="text-xs text-gray-400 mt-1">
													Size: {(file.size / 1024 / 1024).toFixed(2)} MB
												</p>
											)}
										</div>
									</div>
								</div>

								<button
									onClick={() => handleDownload(file)}
									disabled={isDownloading}
									className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
								>
									{isDownloading ? (
										<>
											<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
											<span>Downloading...</span>
										</>
									) : (
										<>
											<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
											</svg>
											<span>Download File</span>
										</>
									)}
								</button>
							</div>
						);
					})}
					{files.length > 1 && (
						<div className="text-center text-sm text-gray-500 mt-4">
							Total: {files.length} file{files.length !== 1 ? 's' : ''} available
						</div>
					)}
				</div>
			) : (
				<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
					<div className="flex items-start">
						<svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
						<div>
							<h3 className="text-lg font-semibold text-yellow-800 mb-2">No File Available</h3>
							<p className="text-yellow-700">{error || 'No file has been uploaded for your account yet.'}</p>
							<p className="text-sm text-yellow-600 mt-2">
								Please contact the administrator to upload a file for your account.
							</p>
						</div>
					</div>
				</div>
			)}

			{error && files.length === 0 && (
				<div className="bg-red-50 border border-red-200 rounded-xl p-4">
					<p className="text-sm text-red-800">{error}</p>
				</div>
			)}
		</div>
	);
}

