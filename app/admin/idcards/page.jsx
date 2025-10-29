'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIDCardsPage() {
  const router = useRouter();
  const [idCards, setIDCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIDCard, setEditingIDCard] = useState(null);

  useEffect(() => {
    fetchIDCards();
  }, []);

  const fetchIDCards = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/idcards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIDCards(data.idCards);
      } else {
        console.error('Error fetching ID cards');
      }
    } catch (error) {
      console.error('Error fetching ID cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIDCard = async (idCardData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/idcards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(idCardData)
      });

      if (response.ok) {
        fetchIDCards();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding ID card');
      }
    } catch (error) {
      console.error('Error adding ID card:', error);
      alert('Error adding ID card');
    }
  };

  const handleUpdateIDCard = async (idCardId, idCardData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/idcards/${idCardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(idCardData)
      });

      if (response.ok) {
        fetchIDCards();
        setEditingIDCard(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating ID card');
      }
    } catch (error) {
      console.error('Error updating ID card:', error);
      alert('Error updating ID card');
    }
  };

  const handleDeleteIDCard = async (idCardId) => {
    if (!confirm('Are you sure you want to delete this ID card?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/idcards/${idCardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchIDCards();
      } else {
        alert('Error deleting ID card');
      }
    } catch (error) {
      console.error('Error deleting ID card:', error);
      alert('Error deleting ID card');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ID cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ID Card Management</h1>
              <p className="text-gray-600 mt-2">Manage student ID cards and generate new ones</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Add New ID Card
            </button>
          </div>
        </div>

        {/* ID Cards List */}
        <div className="bg-white rounded-lg shadow">
          {idCards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number / ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {idCards.map((idCard) => (
                    <tr key={idCard._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {idCard.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {idCard.photo ? (
                          <img
                            src={idCard.photo}
                            alt="Student photo"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Photo</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingIDCard(idCard)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => window.open(`/idcard/download/${idCard.rollNumber}`, '_blank')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteIDCard(idCard._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No ID cards found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first ID card.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Add ID Card
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingIDCard) && (
          <IDCardModal
            idCard={editingIDCard}
            onClose={() => {
              setShowAddModal(false);
              setEditingIDCard(null);
            }}
            onSave={editingIDCard ? handleUpdateIDCard : handleAddIDCard}
          />
        )}
      </div>
    </div>
  );
}

// ID Card Modal Component
function IDCardModal({ idCard, onClose, onSave }) {
  const [formData, setFormData] = useState({
    rollNumber: idCard?.rollNumber || '',
    photo: idCard?.photo || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedPhoto(result.url);
        setFormData(prev => ({ ...prev, photo: result.url }));
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('Submitting form data:', formData);
      console.log('Photo in formData:', formData.photo);

      if (idCard) {
        await onSave(idCard._id, formData);
      } else {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving ID card:', error);
      alert('Error saving ID card');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {idCard ? 'Edit ID Card' : 'Add New ID Card'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number / ID *</label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter roll number or ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
                {(uploadedPhoto || formData.photo) && (
                  <div className="mb-4">
                    <img
                      src={uploadedPhoto || formData.photo}
                      alt="Student photo preview"
                      className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                    />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                  />
                  {isUploading && (
                    <p className="text-sm text-red-600 mt-1">Uploading...</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (idCard ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
