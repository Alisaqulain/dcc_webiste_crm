'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/certificates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates);
      } else {
        console.error('Error fetching certificates');
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCertificate = async (certificateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/certificates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(certificateData)
      });

      if (response.ok) {
        fetchCertificates();
        setShowAddModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Error adding certificate');
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      alert('Error adding certificate');
    }
  };

  const handleUpdateCertificate = async (certificateId, certificateData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/certificates/${certificateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(certificateData)
      });

      if (response.ok) {
        fetchCertificates();
        setEditingCertificate(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Error updating certificate');
      }
    } catch (error) {
      console.error('Error updating certificate:', error);
      alert('Error updating certificate');
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/certificates/${certificateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCertificates();
      } else {
        alert('Error deleting certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      alert('Error deleting certificate');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificates...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Certificate Management</h1>
              <p className="text-gray-600 mt-2">Manage student certificates and generate new ones</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Add New Certificate
            </button>
          </div>
        </div>

        {/* Certificates List */}
        <div className="bg-white rounded-lg shadow">
          {certificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent/Guardian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {certificates.map((certificate) => (
                    <tr key={certificate._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {certificate.studentName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {certificate.parentName} ({certificate.relation})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {certificate.courseName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {certificate.duration} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {certificate.rollNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCertificate(certificate)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => window.open(`/certificate/download/${certificate.rollNumber}`, '_blank')}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download
                          </button>
                          <button
                            onClick={() => handleDeleteCertificate(certificate._id)}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first certificate.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Add Certificate
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(showAddModal || editingCertificate) && (
          <CertificateModal
            certificate={editingCertificate}
            onClose={() => {
              setShowAddModal(false);
              setEditingCertificate(null);
            }}
            onSave={editingCertificate ? handleUpdateCertificate : handleAddCertificate}
          />
        )}
      </div>
    </div>
  );
}

// Certificate Modal Component
function CertificateModal({ certificate, onClose, onSave }) {
  const [formData, setFormData] = useState({
    studentName: certificate?.studentName || '',
    parentName: certificate?.parentName || '',
    relation: certificate?.relation || 's/o',
    courseName: certificate?.courseName || '',
    duration: certificate?.duration || '',
    startDate: certificate?.startDate || '',
    endDate: certificate?.endDate || '',
    rollNumber: certificate?.rollNumber || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (certificate) {
        await onSave(certificate._id, formData);
      } else {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Error saving certificate:', error);
      alert('Error saving certificate');
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
              {certificate ? 'Edit Certificate' : 'Add New Certificate'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Name *</label>
                <input
                  type="text"
                  required
                  value={formData.studentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter student name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parent/Guardian Name *</label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter parent/guardian name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                <select
                  required
                  value={formData.relation}
                  onChange={(e) => setFormData(prev => ({ ...prev, relation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="s/o">Son of</option>
                  <option value="d/o">Daughter of</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name *</label>
                <input
                  type="text"
                  required
                  value={formData.courseName}
                  onChange={(e) => setFormData(prev => ({ ...prev, courseName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter course name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Days) *</label>
                <input
                  type="number"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter duration in days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={formData.rollNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, rollNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter roll number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
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
                {isSubmitting ? 'Saving...' : (certificate ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
