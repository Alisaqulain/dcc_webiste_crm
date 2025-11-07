'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AccountSettingsPage() {
	const { data: session } = useSession();
	const [userData, setUserData] = useState(null);
	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		mobile: '',
		state: ''
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState({ type: '', text: '' });
	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const response = await fetch('/api/user/profile');
				if (response.ok) {
					const data = await response.json();
					setUserData(data);
					setFormData({
						firstName: data.profile?.firstName || '',
						lastName: data.profile?.lastName || '',
						email: data.email || session?.user?.email || '',
						mobile: data.profile?.mobile || '',
						state: data.profile?.state || ''
					});
				}
			} catch (error) {
				console.error('Error fetching user data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (session) {
			fetchUserData();
		}
	}, [session]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSaving(true);
		setMessage({ type: '', text: '' });

		try {
			const response = await fetch('/api/user/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					profile: {
						firstName: formData.firstName,
						lastName: formData.lastName,
						mobile: formData.mobile,
						state: formData.state
					}
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setMessage({ type: 'success', text: 'Profile updated successfully!' });
				setUserData({ ...userData, profile: { ...formData } });
			} else {
				setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
			}
		} catch (error) {
			setMessage({ type: 'error', text: 'Error updating profile. Please try again.' });
		} finally {
			setIsSaving(false);
		}
	};

	const handleReset = () => {
		if (userData) {
			setFormData({
				firstName: userData.profile?.firstName || '',
				lastName: userData.profile?.lastName || '',
				email: userData.email || session?.user?.email || '',
				mobile: userData.profile?.mobile || '',
				state: userData.profile?.state || ''
			});
			setMessage({ type: '', text: '' });
		}
	};

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setIsChangingPassword(true);
		setPasswordMessage({ type: '', text: '' });

		// Validation
		if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
			setPasswordMessage({ type: 'error', text: 'All password fields are required' });
			setIsChangingPassword(false);
			return;
		}

		if (passwordData.newPassword.length < 6) {
			setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters long' });
			setIsChangingPassword(false);
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setPasswordMessage({ type: 'error', text: 'New password and confirm password do not match' });
			setIsChangingPassword(false);
			return;
		}

		try {
			const response = await fetch('/api/user/change-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
				setPasswordData({
					currentPassword: '',
					newPassword: '',
					confirmPassword: ''
				});
			} else {
				setPasswordMessage({ type: 'error', text: data.message || 'Failed to change password' });
			}
		} catch (error) {
			setPasswordMessage({ type: 'error', text: 'Error changing password. Please try again.' });
		} finally {
			setIsChangingPassword(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="bg-white border rounded-md p-4">
				<h2 className="text-lg font-semibold">Account Settings</h2>
				<div className="mt-3 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700">
					Change profile not available
				</div>
				<form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
					<label className="block">
						<div className="mb-1">First Name</div>
						<input 
							className="w-full border rounded px-2 py-1 bg-gray-100" 
							value={formData.firstName}
							onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
							disabled
							readOnly
						/>
					</label>
					<label className="block">
						<div className="mb-1">Last Name</div>
						<input 
							className="w-full border rounded px-2 py-1 bg-gray-100" 
							value={formData.lastName}
							onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
							disabled
							readOnly
						/>
					</label>
					<label className="block">
						<div className="mb-1">Email</div>
						<input 
							type="email" 
							className="w-full border rounded px-2 py-1 bg-gray-100" 
							value={formData.email}
							readOnly
							disabled
						/>
					</label>
					<label className="block">
						<div className="mb-1">Phone</div>
						<input 
							className="w-full border rounded px-2 py-1 bg-gray-100" 
							value={formData.mobile}
							onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
							placeholder="+91 00000 00000"
							disabled
							readOnly
						/>
					</label>
					<label className="block sm:col-span-2">
						<div className="mb-1">State</div>
						<input 
							className="w-full border rounded px-2 py-1 bg-gray-100" 
							value={formData.state}
							onChange={(e) => setFormData({ ...formData, state: e.target.value })}
							placeholder="Enter your state"
							disabled
							readOnly
						/>
					</label>
					<div className="sm:col-span-2 flex gap-2 mt-2">
						<button 
							type="submit" 
							disabled={true}
							className="px-4 py-1.5 rounded bg-gray-400 text-white cursor-not-allowed opacity-50"
						>
							Save Changes
						</button>
						<button 
							type="button" 
							onClick={handleReset}
							disabled={true}
							className="px-4 py-1.5 rounded border bg-gray-100 cursor-not-allowed opacity-50"
						>
							Reset
						</button>
					</div>
				</form>
			</div>

			<div className="bg-white border rounded-md p-4">
				<h3 className="font-semibold">Change Password</h3>
				{passwordMessage.text && (
					<div className={`mt-3 p-3 rounded-md ${
						passwordMessage.type === 'success' 
							? 'bg-green-50 border border-green-200 text-green-700' 
							: 'bg-red-50 border border-red-200 text-red-700'
					}`}>
						{passwordMessage.text}
					</div>
				)}
				<form onSubmit={handlePasswordChange} className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
					<input 
						type="password" 
						placeholder="Current password" 
						className="border rounded px-2 py-1" 
						value={passwordData.currentPassword}
						onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
						required
					/>
					<input 
						type="password" 
						placeholder="New password" 
						className="border rounded px-2 py-1" 
						value={passwordData.newPassword}
						onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
						required
						minLength={6}
					/>
					<input 
						type="password" 
						placeholder="Confirm new password" 
						className="border rounded px-2 py-1" 
						value={passwordData.confirmPassword}
						onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
						required
						minLength={6}
					/>
					<div className="sm:col-span-3">
						<button 
							type="submit" 
							disabled={isChangingPassword}
							className="px-4 py-1.5 rounded bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isChangingPassword ? 'Updating...' : 'Update Password'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}


