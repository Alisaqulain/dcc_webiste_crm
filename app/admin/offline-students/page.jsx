'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MONTH_LABELS, buildYearMonthGrid, feeRecordLabel } from '@/lib/offlineStudentFees';

function StatusBadge({ status }) {
  const map = {
    paid: 'bg-green-100 text-green-800 border-green-200',
    partial: 'bg-amber-100 text-amber-900 border-amber-200',
    pending: 'bg-red-100 text-red-800 border-red-200',
    unpaid: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const label =
    status === 'paid'
      ? 'Paid'
      : status === 'partial'
        ? 'Partial'
        : status === 'pending'
          ? 'Pending'
          : 'Not recorded';
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${map[status] || map.unpaid}`}
    >
      {label}
    </span>
  );
}

export default function OfflineStudentsPage() {
  const router = useRouter();
  const [centers, setCenters] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [filterCenter, setFilterCenter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('students');

  const [centerForm, setCenterForm] = useState({ name: '', city: '', phone: '', address: '' });
  const [studentForm, setStudentForm] = useState({
    centerId: '',
    fullName: '',
    phone: '',
    email: '',
    guardianName: '',
    address: '',
    courseLabel: '',
    monthlyFeeAmount: '',
    admissionDate: new Date().toISOString().slice(0, 10),
  });

  const [selected, setSelected] = useState(null);
  const [gridYear, setGridYear] = useState(new Date().getFullYear());
  const [feeModal, setFeeModal] = useState(null);
  const [feeForm, setFeeForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amountDue: '',
    amountPaid: '',
    paymentMode: 'cash',
    paidAt: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  const loadCenters = async () => {
    const res = await fetch('/api/admin/offline-centers', { headers: headers() });
    const data = await res.json();
    if (res.ok) setCenters(data.centers || []);
  };

  const loadStudents = async () => {
    const params = new URLSearchParams();
    if (filterCenter) params.set('centerId', filterCenter);
    if (search.trim()) params.set('search', search.trim());
    const res = await fetch(`/api/admin/offline-students?${params}`, { headers: headers() });
    const data = await res.json();
    if (res.ok) {
      setStudents(data.students || []);
      setStats(data.stats || null);
    }
  };

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    await Promise.all([loadCenters(), loadStudents()]);
    setLoading(false);
  }, [router, filterCenter, search, headers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshStudent = (updated) => {
    if (!updated) return;
    setStudents((list) => list.map((s) => (s._id === updated._id ? updated : s)));
    setSelected(updated);
  };

  const openFee = (student, preset = {}) => {
    const year = preset.year ?? new Date().getFullYear();
    const month = preset.month ?? new Date().getMonth() + 1;
    const existing = (student.feeRecords || []).find(
      (r) => Number(r.year) === year && Number(r.month) === month
    );
    setFeeModal(student);
    setFeeForm({
      year,
      month,
      amountDue: String(existing?.amountDue ?? student.monthlyFeeAmount ?? ''),
      amountPaid: String(existing?.amountPaid ?? student.monthlyFeeAmount ?? ''),
      paymentMode: existing?.paymentMode || 'cash',
      paidAt: existing?.paidAt
        ? new Date(existing.paidAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      notes: existing?.notes || '',
    });
  };

  const recordFee = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/offline-students/${feeModal._id}/fees`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        ...feeForm,
        year: Number(feeForm.year),
        month: Number(feeForm.month),
        amountDue: Number(feeForm.amountDue) || feeModal.monthlyFeeAmount,
        amountPaid: Number(feeForm.amountPaid),
        paidAt: feeForm.paidAt,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed');
      return;
    }
    refreshStudent(data.student);
    setFeeModal(null);
  };

  const deleteFee = async (studentId, recordId) => {
    if (!confirm('Remove this fee record?')) return;
    const res = await fetch(
      `/api/admin/offline-students/${studentId}/fees?recordId=${recordId}`,
      { method: 'DELETE', headers: headers() }
    );
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed');
      return;
    }
    refreshStudent(data.student);
  };

  const addCenter = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/offline-centers', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(centerForm),
    });
    if (!res.ok) {
      alert((await res.json()).message || 'Failed');
      return;
    }
    setCenterForm({ name: '', city: '', phone: '', address: '' });
    loadCenters();
  };

  const addStudent = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/offline-students', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        ...studentForm,
        monthlyFeeAmount: Number(studentForm.monthlyFeeAmount) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed');
      return;
    }
    setStudentForm({
      centerId: studentForm.centerId,
      fullName: '',
      phone: '',
      email: '',
      guardianName: '',
      address: '',
      courseLabel: '',
      monthlyFeeAmount: '',
      admissionDate: new Date().toISOString().slice(0, 10),
    });
    await loadStudents();
    setSelected(data.student);
    setTab('students');
  };

  const monthGrid = useMemo(() => {
    if (!selected) return [];
    return buildYearMonthGrid(selected.feeRecords, gridYear);
  }, [selected, gridYear]);

  const existingFeeForForm =
    feeModal &&
    (feeModal.feeRecords || []).find(
      (r) => Number(r.year) === Number(feeForm.year) && Number(r.month) === Number(feeForm.month)
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Offline student management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Centers, admissions, and complete monthly fee history per student.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="text-sm border border-gray-300 bg-white px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase">Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="bg-white border rounded-lg p-4 border-l-4 border-l-green-500">
              <p className="text-xs text-gray-500">Paid this month</p>
              <p className="text-2xl font-bold text-green-700">{stats.paidThisMonth}</p>
            </div>
            <div className="bg-white border rounded-lg p-4 border-l-4 border-l-amber-400">
              <p className="text-xs text-gray-500">Partial this month</p>
              <p className="text-2xl font-bold text-amber-700">{stats.partialThisMonth}</p>
            </div>
            <div className="bg-white border rounded-lg p-4 border-l-4 border-l-red-400">
              <p className="text-xs text-gray-500">Unpaid this month</p>
              <p className="text-2xl font-bold text-red-700">{stats.unpaidThisMonth}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-xs text-gray-500">Total collected</p>
              <p className="text-xl font-bold">₹{stats.totalCollected.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200 mb-6">
          {['students', 'admit', 'centers'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t
                  ? 'border-red-600 text-red-700'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t === 'students' ? 'All students' : t === 'admit' ? 'New admission' : 'Centers'}
            </button>
          ))}
        </div>

        {tab === 'centers' && (
          <section className="bg-white border rounded-xl p-5 max-w-3xl">
            <h2 className="font-semibold mb-4">Add center</h2>
            <form onSubmit={addCenter} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Center name *"
                value={centerForm.name}
                onChange={(e) => setCenterForm({ ...centerForm, name: e.target.value })}
                required
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="City"
                value={centerForm.city}
                onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Phone"
                value={centerForm.phone}
                onChange={(e) => setCenterForm({ ...centerForm, phone: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                placeholder="Address"
                value={centerForm.address}
                onChange={(e) => setCenterForm({ ...centerForm, address: e.target.value })}
              />
              <button type="submit" className="sm:col-span-2 bg-gray-900 text-white rounded-lg py-2 text-sm">
                Save center
              </button>
            </form>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your centers</h3>
            <div className="flex flex-wrap gap-2">
              {centers.map((c) => (
                <span key={c._id} className="text-sm bg-gray-100 px-3 py-1.5 rounded-full">
                  {c.name}
                  {c.city ? ` · ${c.city}` : ''}
                </span>
              ))}
            </div>
          </section>
        )}

        {tab === 'admit' && (
          <section className="bg-white border rounded-xl p-5 max-w-3xl">
            <h2 className="font-semibold mb-4">New admission</h2>
            <form onSubmit={addStudent} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                value={studentForm.centerId}
                onChange={(e) => setStudentForm({ ...studentForm, centerId: e.target.value })}
                required
              >
                <option value="">Select center *</option>
                {centers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Full name *"
                value={studentForm.fullName}
                onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                required
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Phone"
                value={studentForm.phone}
                onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Email"
                value={studentForm.email}
                onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Guardian name"
                value={studentForm.guardianName}
                onChange={(e) => setStudentForm({ ...studentForm, guardianName: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Course / batch"
                value={studentForm.courseLabel}
                onChange={(e) => setStudentForm({ ...studentForm, courseLabel: e.target.value })}
              />
              <input
                type="number"
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Monthly fee (₹) *"
                value={studentForm.monthlyFeeAmount}
                onChange={(e) => setStudentForm({ ...studentForm, monthlyFeeAmount: e.target.value })}
                required
              />
              <input
                type="date"
                className="border rounded-lg px-3 py-2 text-sm"
                value={studentForm.admissionDate}
                onChange={(e) => setStudentForm({ ...studentForm, admissionDate: e.target.value })}
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                placeholder="Address"
                value={studentForm.address}
                onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
              />
              <button type="submit" className="sm:col-span-2 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium">
                Admit student
              </button>
            </form>
          </section>
        )}

        {tab === 'students' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2 bg-white border rounded-xl overflow-hidden">
              <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
                <h2 className="font-semibold">Students</h2>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="search"
                    placeholder="Search name, phone, course…"
                    className="border rounded-lg px-3 py-1.5 text-sm w-48"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <select
                    className="border rounded-lg px-2 py-1.5 text-sm"
                    value={filterCenter}
                    onChange={(e) => setFilterCenter(e.target.value)}
                  >
                    <option value="">All centers</option>
                    {centers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {loading ? (
                <p className="p-8 text-center text-gray-500">Loading…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left">
                      <tr>
                        <th className="p-3 font-medium">Student</th>
                        <th className="p-3 font-medium">Center</th>
                        <th className="p-3 font-medium">Monthly</th>
                        <th className="p-3 font-medium">This month</th>
                        <th className="p-3 font-medium">History</th>
                        <th className="p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr
                          key={s._id}
                          className={`border-t cursor-pointer hover:bg-red-50/40 ${
                            selected?._id === s._id ? 'bg-red-50' : ''
                          }`}
                          onClick={() => {
                            setSelected(s);
                            setGridYear(new Date().getFullYear());
                          }}
                        >
                          <td className="p-3">
                            <p className="font-semibold text-gray-900">{s.fullName}</p>
                            <p className="text-xs text-gray-500">{s.courseLabel || '—'}</p>
                            {s.phone && <p className="text-xs text-gray-400">{s.phone}</p>}
                          </td>
                          <td className="p-3 text-gray-700">{s.centerId?.name || '—'}</td>
                          <td className="p-3 font-medium">₹{s.monthlyFeeAmount || 0}</td>
                          <td className="p-3">
                            <StatusBadge status={s.feeSummary?.currentStatus || 'unpaid'} />
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            <span className="block">{s.feeSummary?.recordCount || 0} months logged</span>
                            <span className="block text-green-700">
                              ₹{s.feeSummary?.totalPaid?.toLocaleString('en-IN') || 0} collected
                            </span>
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="text-red-600 font-medium hover:underline mr-2"
                              onClick={() => openFee(s)}
                            >
                              Record fee
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No students found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white border rounded-xl p-4 min-h-[420px]">
              {!selected ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm p-8 text-center">
                  Select a student to see complete profile and every month&apos;s fee payment.
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{selected.fullName}</h2>
                    <p className="text-sm text-gray-600">{selected.centerId?.name}</p>
                    <p className="text-sm text-gray-600">{selected.courseLabel}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Monthly fee</p>
                      <p className="font-bold">₹{selected.monthlyFeeAmount || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Admission</p>
                      <p className="font-medium">
                        {selected.admissionDate
                          ? new Date(selected.admissionDate).toLocaleDateString('en-IN')
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Total paid</p>
                      <p className="font-bold text-green-800">
                        ₹{selected.feeSummary?.totalPaid?.toLocaleString('en-IN') || 0}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Months paid</p>
                      <p className="font-bold">{selected.feeSummary?.monthsPaid || 0}</p>
                    </div>
                  </div>

                  {(selected.phone || selected.email || selected.guardianName) && (
                    <div className="text-sm text-gray-700 space-y-1 border-t pt-3">
                      {selected.phone && <p>Phone: {selected.phone}</p>}
                      {selected.email && <p>Email: {selected.email}</p>}
                      {selected.guardianName && <p>Guardian: {selected.guardianName}</p>}
                      {selected.address && <p>Address: {selected.address}</p>}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Year overview</h3>
                      <select
                        className="border rounded text-sm px-2 py-1"
                        value={gridYear}
                        onChange={(e) => setGridYear(Number(e.target.value))}
                      >
                        {[gridYear - 1, gridYear, gridYear + 1].map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {monthGrid.map((cell) => (
                        <button
                          key={cell.month}
                          type="button"
                          onClick={() => openFee(selected, { year: gridYear, month: cell.month })}
                          className={`rounded-lg p-2 text-center text-xs border transition-colors ${
                            cell.status === 'paid'
                              ? 'bg-green-100 border-green-300 text-green-900'
                              : cell.status === 'partial'
                                ? 'bg-amber-100 border-amber-300 text-amber-900'
                                : cell.status === 'pending'
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                          }`}
                          title={
                            cell.record
                              ? `₹${cell.record.amountPaid}/${cell.record.amountDue}`
                              : 'Click to record fee'
                          }
                        >
                          <div className="font-semibold">{cell.label}</div>
                          {cell.record ? (
                            <div className="text-[10px] mt-0.5">₹{cell.record.amountPaid}</div>
                          ) : (
                            <div className="text-[10px] mt-0.5">—</div>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click a month to record or update payment.</p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">Complete fee history</h3>
                      <button
                        type="button"
                        onClick={() => openFee(selected)}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg"
                      >
                        + Record fee
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left">Month</th>
                            <th className="p-2 text-right">Due</th>
                            <th className="p-2 text-right">Paid</th>
                            <th className="p-2 text-left">Mode</th>
                            <th className="p-2 text-left">Date</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {(selected.feeRecords || []).map((r) => (
                            <tr key={r._id} className="border-t">
                              <td className="p-2 font-medium">{feeRecordLabel(r)}</td>
                              <td className="p-2 text-right">₹{r.amountDue}</td>
                              <td className="p-2 text-right text-green-700 font-medium">₹{r.amountPaid}</td>
                              <td className="p-2 capitalize">{r.paymentMode || '—'}</td>
                              <td className="p-2">
                                {r.paidAt
                                  ? new Date(r.paidAt).toLocaleDateString('en-IN')
                                  : '—'}
                              </td>
                              <td className="p-2">
                                <StatusBadge status={r.status} />
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  className="text-red-600 hover:underline mr-2"
                                  onClick={() =>
                                    openFee(selected, { year: r.year, month: r.month })
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="text-gray-500 hover:underline"
                                  onClick={() => deleteFee(selected._id, r._id)}
                                >
                                  Del
                                </button>
                              </td>
                            </tr>
                          ))}
                          {(!selected.feeRecords || selected.feeRecords.length === 0) && (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-gray-500">
                                No fees recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {selected.feeRecords?.some((r) => r.notes) && (
                      <div className="mt-2 text-xs text-gray-600">
                        {selected.feeRecords
                          .filter((r) => r.notes)
                          .map((r) => (
                            <p key={r._id}>
                              {feeRecordLabel(r)}: {r.notes}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {feeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={recordFee}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b">
              <h3 className="text-lg font-bold">Record monthly fee</h3>
              <p className="text-sm text-gray-600">{feeModal.fullName}</p>
              {existingFeeForForm && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded mt-2 px-2 py-1">
                  Updating existing entry for {MONTH_LABELS[feeForm.month - 1]} {feeForm.year}
                </p>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Year</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.year}
                    onChange={(e) => setFeeForm({ ...feeForm, year: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Month</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.month}
                    onChange={(e) => {
                      const month = Number(e.target.value);
                      const ex = (feeModal.feeRecords || []).find(
                        (r) =>
                          Number(r.year) === Number(feeForm.year) && Number(r.month) === month
                      );
                      setFeeForm({
                        ...feeForm,
                        month,
                        amountDue: String(ex?.amountDue ?? feeModal.monthlyFeeAmount ?? ''),
                        amountPaid: String(ex?.amountPaid ?? feeModal.monthlyFeeAmount ?? ''),
                        notes: ex?.notes || feeForm.notes,
                        paymentMode: ex?.paymentMode || feeForm.paymentMode,
                      });
                    }}
                  >
                    {MONTH_LABELS.map((m, i) => (
                      <option key={m} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Amount due (₹)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.amountDue}
                    onChange={(e) => setFeeForm({ ...feeForm, amountDue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Amount paid (₹)</label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.amountPaid}
                    onChange={(e) => setFeeForm({ ...feeForm, amountPaid: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Payment mode</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.paymentMode}
                    onChange={(e) => setFeeForm({ ...feeForm, paymentMode: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Payment date</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    value={feeForm.paidAt}
                    onChange={(e) => setFeeForm({ ...feeForm, paidAt: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  rows={2}
                  value={feeForm.notes}
                  onChange={(e) => setFeeForm({ ...feeForm, notes: e.target.value })}
                  placeholder="Receipt no., remarks…"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg text-sm"
                  onClick={() => setFeeModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">
                  Save payment
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
