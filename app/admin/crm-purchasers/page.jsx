'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { FaTrashAlt } from 'react-icons/fa';
import ConfirmDialog from '@/app/components/admin/ConfirmDialog';

function autoRemoveLabel(uploadedAt) {
  if (!uploadedAt) return null;
  const d = new Date(uploadedAt);
  if (Number.isNaN(d.getTime())) return null;
  const expires = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
  return expires.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const deleteFileBtnClass =
  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 transition-colors flex-shrink-0 shadow-sm';

export default function CRMPurchasersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploading, setUploading] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(null); // Store userId instead of boolean
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDelete, setFileDelete] = useState(null);
  const [fileDeleting, setFileDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    loadUsers();
  }, [router, currentPage, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm })
      });
      const res = await fetch(`/api/admin/crm-purchasers?${params}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load');
      }
      
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      
      // Show message if no CRM courses found (this is a warning, not an error)
      if (data.message && data.message.includes('No courses with CRM access')) {
        setError(data.message);
      } else {
        setError(''); // Clear error if data loaded successfully
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };


  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
        'text/csv'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        alert('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.');
        return;
      }

      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size too large. Maximum size is 50MB.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const deleteCrmFile = async () => {
    if (!fileDelete) return;
    setFileDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const body = fileDelete.legacy
        ? { userId: fileDelete.userId, legacy: true }
        : {
            userId: fileDelete.userId,
            ...(fileDelete.fileId ? { fileId: fileDelete.fileId } : {}),
            ...(fileDelete.fileUrl ? { fileUrl: fileDelete.fileUrl } : {}),
          };
      if (!fileDelete.legacy && !body.fileId && !body.fileUrl) {
        toast.error('Cannot delete: missing file reference');
        return;
      }
      const res = await fetch('/api/admin/crm-file/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      toast.success('File removed');
      setFileDelete(null);
      loadUsers();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setFileDeleting(false);
    }
  };

  const handleUpload = async (userId) => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    setUploading(prev => ({ ...prev, [userId]: true }));
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', userId);

      const res = await fetch('/api/admin/crm-file/upload-user', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      toast.success('File uploaded for user');
      setShowUploadModal(null);
      setSelectedFile(null);
      
      // Reload users after a short delay to ensure database is updated
      setTimeout(() => {
        loadUsers();
      }, 500);
    } catch (e) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploading(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Course Purchasers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Each file shows when it will auto-delete (30 days after upload). Cleanup also runs when you open this page.
            Optional: schedule <code className="text-xs bg-gray-100 px-1 rounded">GET /api/cron/maintenance</code> with{' '}
            <code className="text-xs bg-gray-100 px-1 rounded">CRON_SECRET</code> for extra runs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded text-sm"
            onClick={loadUsers}
          >
            Reload
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">{error}</p>
              {error.includes('No courses with CRM access') && (
                <p className="text-sm text-yellow-700 mt-1">
                  To fix this: Go to <strong>Courses</strong> → Edit the course → Check <strong>"Include CRM Access"</strong> → Save
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by email, name, or mobile..."
          className="w-full border rounded px-3 py-2"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">CRM Courses</th>
                <th className="py-3 px-4">Files (delete / auto-remove)</th>
                <th className="py-3 px-4">Downloaded</th>
                <th className="py-3 px-4">Downloaded At</th>
                <th className="py-3 px-4">Actions</th>
                <th className="py-3 px-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-red-50/30 transition-colors">
                  <td className="py-3 px-4">
                    {user.profile?.firstName || ''} {user.profile?.lastName || ''}
                  </td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.profile?.mobile || 'N/A'}</td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {user.crmCourses?.map((course, idx) => (
                        <div key={idx} className="text-xs text-gray-600">
                          • {course.title}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {user.crmFiles && user.crmFiles.length > 0 ? (
                      <div className="space-y-1">
                        {user.crmFiles.map((file, idx) => {
                          const fid = file._id != null ? String(file._id) : null;
                          const fUrl = typeof file.url === 'string' && file.url ? file.url : '';
                          const canDelete = Boolean(fid || fUrl);
                          return (
                          <div key={fid || fUrl || idx} className="text-xs border-b border-gray-200 pb-2 last:border-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <p className="text-gray-800 font-medium truncate max-w-[140px]" title={file.originalName || file.filename}>
                                  {file.originalName || file.filename}
                                </p>
                                {file.downloaded && (
                                  <span className="inline-flex items-center justify-center w-4 h-4 bg-green-100 text-green-600 rounded-full flex-shrink-0">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                              {canDelete ? (
                                <button
                                  type="button"
                                  aria-label={`Delete ${file.originalName || file.filename}`}
                                  title="Delete this file from storage and database"
                                  onClick={() =>
                                    setFileDelete({
                                      userId: user._id,
                                      ...(fid ? { fileId: fid } : {}),
                                      ...(fUrl ? { fileUrl: fUrl } : {}),
                                      label: file.originalName || file.filename,
                                    })
                                  }
                                  className={deleteFileBtnClass}
                                >
                                  <FaTrashAlt className="w-3 h-3" />
                                  Delete
                                </button>
                              ) : null}
                            </div>
                            <p className="text-gray-500 text-[11px] mt-0.5">
                              Uploaded {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : '—'}
                              {autoRemoveLabel(file.uploadedAt) ? (
                                <span className="text-amber-700"> · Auto-remove by {autoRemoveLabel(file.uploadedAt)}</span>
                              ) : null}
                            </p>
                          </div>
                          );
                        })}
                        <p className="text-gray-400 text-xs mt-1">({user.crmFiles.length} file{user.crmFiles.length !== 1 ? 's' : ''})</p>
                      </div>
                    ) : user.crmFile?.originalName ? (
                      <div className="text-xs flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-gray-800 font-medium truncate max-w-[140px]" title={user.crmFile.originalName}>
                            {user.crmFile.originalName}
                          </p>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            Uploaded {user.crmFile.uploadedAt ? new Date(user.crmFile.uploadedAt).toLocaleDateString() : '—'}
                            {autoRemoveLabel(user.crmFile.uploadedAt) ? (
                              <span className="text-amber-700"> · Auto-remove by {autoRemoveLabel(user.crmFile.uploadedAt)}</span>
                            ) : null}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label="Delete legacy CRM file"
                          title="Delete this file from storage and database"
                          onClick={() =>
                            setFileDelete({
                              userId: user._id,
                              legacy: true,
                              label: user.crmFile.originalName,
                            })
                          }
                          className={deleteFileBtnClass}
                        >
                          <FaTrashAlt className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No file</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {user.crmFiles && user.crmFiles.length > 0 ? (
                      <div className="space-y-1">
                        {user.crmFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-center">
                            {file.downloaded ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : user.crmFileDownloaded ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-600 rounded-full">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {user.crmFiles && user.crmFiles.length > 0 ? (
                      <div className="space-y-1">
                        {user.crmFiles.map((file, idx) => (
                          <div key={idx} className="text-xs">
                            {file.downloadedAt
                              ? new Date(file.downloadedAt).toLocaleString()
                              : '—'}
                          </div>
                        ))}
                      </div>
                    ) : user.crmFileDownloadedAt ? (
                      new Date(user.crmFileDownloadedAt).toLocaleString()
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setShowUploadModal(user._id)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      {(user.crmFiles && user.crmFiles.length > 0) || user.crmFile?.originalName ? 'Add File' : 'Upload'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="py-8 px-4 text-center text-gray-500" colSpan={9}>
                    No CRM course purchasers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => {
              const w = 4;
              return n === 1 || n === totalPages || (n >= currentPage - w && n <= currentPage + w);
            })
            .reduce((acc, n, i, arr) => {
              if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
              acc.push(n);
              return acc;
            }, [])
            .map((n, i) =>
              n === '…' ? (
                <span key={`e-${i}`} className="px-2 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCurrentPage(n)}
                  className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === n
                      ? 'bg-red-600 text-white shadow'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              )
            )}
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!fileDelete}
        title="Delete CRM file"
        message={
          fileDelete
            ? `Remove "${fileDelete.label}" from storage and database? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete file"
        onConfirm={deleteCrmFile}
        onCancel={() => setFileDelete(null)}
        loading={fileDeleting}
      />

      {/* Upload Modal */}
      {showUploadModal && (() => {
        const user = users.find(u => u._id === showUploadModal);
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Upload File for {user?.profile?.firstName} {user?.profile?.lastName}
                </h2>
                <button
                  onClick={() => {
                    setShowUploadModal(null);
                    setSelectedFile(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(user?.crmFiles && user.crmFiles.length > 0) || user?.crmFile?.originalName ? (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    {user.crmFiles && user.crmFiles.length > 0 
                      ? `Current files (${user.crmFiles.length}):`
                      : 'Current file:'}
                  </p>
                  {user.crmFiles && user.crmFiles.length > 0 ? (
                    <div className="space-y-2">
                      {user.crmFiles.map((file, idx) => {
                        const fid = file._id != null ? String(file._id) : null;
                        const fUrl = typeof file.url === 'string' && file.url ? file.url : '';
                        const canDelete = Boolean(fid || fUrl);
                        return (
                          <div key={fid || fUrl || idx} className="flex items-start justify-between gap-2 text-xs text-blue-700 border-l-2 border-blue-300 pl-2">
                            <div>
                              <p className="font-medium">{file.originalName || file.filename}</p>
                              <p className="text-blue-600">
                                Uploaded: {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'N/A'}
                                {autoRemoveLabel(file.uploadedAt) ? (
                                  <span className="text-amber-800"> · Auto-remove by {autoRemoveLabel(file.uploadedAt)}</span>
                                ) : null}
                              </p>
                            </div>
                            {canDelete ? (
                              <button
                                type="button"
                                title="Delete file from storage and database"
                                aria-label="Delete file"
                                onClick={() => {
                                  setFileDelete({
                                    userId: user._id,
                                    ...(fid ? { fileId: fid } : {}),
                                    ...(fUrl ? { fileUrl: fUrl } : {}),
                                    label: file.originalName || file.filename,
                                  });
                                }}
                                className={deleteFileBtnClass}
                              >
                                <FaTrashAlt className="w-3 h-3" />
                                Delete
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 text-xs text-blue-700">
                      <div>
                        <p className="font-medium">{user.crmFile.originalName}</p>
                        <p className="text-blue-600 mt-1">
                          Uploaded: {user.crmFile.uploadedAt ? new Date(user.crmFile.uploadedAt).toLocaleString() : 'N/A'}
                          {autoRemoveLabel(user.crmFile.uploadedAt) ? (
                            <span className="text-amber-800"> · Auto-remove by {autoRemoveLabel(user.crmFile.uploadedAt)}</span>
                          ) : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        title="Delete file from storage and database"
                        aria-label="Delete legacy file"
                        onClick={() =>
                          setFileDelete({
                            userId: user._id,
                            legacy: true,
                            label: user.crmFile.originalName,
                          })
                        }
                        className={deleteFileBtnClass}
                      >
                        <FaTrashAlt className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Excel File (.xlsx, .xls, or .csv)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="w-full border rounded px-3 py-2"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowUploadModal(null);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  disabled={uploading[showUploadModal]}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpload(showUploadModal)}
                  disabled={!selectedFile || uploading[showUploadModal]}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
                >
                  {uploading[showUploadModal] ? 'Uploading...' : 'Add File'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

