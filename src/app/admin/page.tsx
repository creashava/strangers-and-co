'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Registration, SlotCounts } from '@/lib/types';
import {
  Shield, LogIn, LogOut, Users, IndianRupee, Zap, Download,
  CheckCircle2, XCircle, Eye, X, RefreshCw, Search
} from 'lucide-react';

interface AdminData {
  registrations: (Registration & { screenshot_signed_url?: string | null })[];
  slotCounts: SlotCounts;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin', {
        headers: { 'x-admin-key': adminKey },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setError('Invalid admin key');
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch');

      const json: AdminData = await res.json();
      setData(json);
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  // Auto-refresh every 8 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminKey('');
    setData(null);
  };

  const handleStatusUpdate = async (id: string, status: 'verified' | 'rejected') => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({ id, status }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      setError('Failed to update status');
    }
  };

  const exportCSV = () => {
    if (!data?.registrations) return;

    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Amount', 'UTR', 'Status', 'Date'];
    const rows = data.registrations.map(r => [
      r.full_name,
      r.email,
      r.phone,
      r.tier,
      r.amount_paid,
      r.utr_number || 'N/A',
      r.status,
      new Date(r.created_at).toLocaleString('en-IN'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strangers-co-registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredRegistrations = data?.registrations.filter(r => {
    const matchesSearch = searchQuery === '' ||
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.utr_number && r.utr_number.includes(searchQuery));

    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;

    return matchesSearch && matchesStatus;
  }) || [];

  // ─── Login Screen ───
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mb-3">
              <Shield size={22} />
            </div>
            <h1 className="text-xl font-black text-stone-900">Taranga Admin Portal</h1>
            <p className="text-xs text-stone-500 mt-0.5">Strangers &amp; Co • Mysore Event</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <LogIn size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                placeholder="Enter Admin Secret Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-2xl px-4 py-3 pl-10 text-stone-900 placeholder-stone-400 text-xs outline-none focus:border-[#15803D] focus:bg-white transition-all font-medium"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
                <XCircle size={13} /> {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs tracking-wide shadow-sm shadow-emerald-700/20 active:scale-[0.98] transition-all"
            >
              Access Event Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ─── Dashboard ───
  const counts = data?.slotCounts;
  const totalRevenue = data?.registrations
    .filter(r => r.status === 'verified')
    .reduce((sum, r) => sum + Number(r.amount_paid), 0) || 0;
  const verifiedCount = data?.registrations.filter(r => r.status === 'verified').length || 0;
  const earlyBirdVerified = data?.registrations.filter(r => r.tier === 'early_bird' && r.status === 'verified').length || 0;

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#1C1917]">
      {/* Screenshot Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white p-2 rounded-3xl shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 p-1"
            >
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Payment Screenshot" className="max-h-[80vh] rounded-2xl object-contain mx-auto" />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#15803D]" />
              <h1 className="text-base font-black text-stone-900">
                Strangers &amp; Co — Registration Desk
              </h1>
            </div>
            <p className="text-xs text-stone-500 font-medium">Organised by Taranga • Avinya Cafe, Mysore</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-all text-xs font-bold"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-xs font-bold"
            >
              <LogOut size={14} /> Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-emerald-800 font-bold uppercase tracking-wider">
              <IndianRupee size={14} />
              <span>Total Revenue</span>
            </div>
            <p className="text-2xl font-black text-emerald-900">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-orange-800 font-bold uppercase tracking-wider">
              <Zap size={14} />
              <span>Early Bird Filled</span>
            </div>
            <p className="text-2xl font-black text-orange-900">
              {earlyBirdVerified} / 10
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-blue-800 font-bold uppercase tracking-wider">
              <Users size={14} />
              <span>Total Confirmed</span>
            </div>
            <p className="text-2xl font-black text-blue-900">
              {verifiedCount} / 40
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs text-purple-800 font-bold uppercase tracking-wider">
              <Shield size={14} />
              <span>Active Locks</span>
            </div>
            <p className="text-2xl font-black text-purple-900">
              {counts?.total_taken || 0}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by attendee name, email, phone, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-2xl px-4 py-2.5 pl-10 text-stone-900 placeholder-stone-400 text-xs outline-none focus:border-[#15803D] transition-all font-medium"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'verified', 'reserved', 'rejected', 'expired'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Registration Table */}
        <div className="rounded-3xl border border-stone-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <th className="text-left py-3.5 px-4">Time</th>
                  <th className="text-left py-3.5 px-4">Attendee</th>
                  <th className="text-left py-3.5 px-4">Contact</th>
                  <th className="text-left py-3.5 px-4">Tier</th>
                  <th className="text-left py-3.5 px-4">Paid</th>
                  <th className="text-left py-3.5 px-4">UTR Number</th>
                  <th className="text-left py-3.5 px-4">Status</th>
                  <th className="text-left py-3.5 px-4">Receipt</th>
                  <th className="text-left py-3.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-stone-400 font-medium">
                      {isLoading ? 'Refreshing registrations...' : 'No registrations found'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-stone-500 whitespace-nowrap">
                        {new Date(reg.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900">
                        {reg.full_name === 'PENDING' ? (
                          <span className="text-stone-400 italic font-normal">Pending fill</span>
                        ) : (
                          reg.full_name
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-800 font-medium">{reg.email !== 'PENDING' ? reg.email : '—'}</div>
                        <div className="text-stone-500">{reg.phone !== 'PENDING' ? reg.phone : '—'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          reg.tier === 'early_bird'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {reg.tier === 'early_bird' ? 'Early Bird' : 'Regular'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-stone-900">₹{reg.amount_paid}</td>
                      <td className="py-3.5 px-4 font-mono text-stone-700 font-bold">
                        {reg.utr_number || '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {reg.screenshot_signed_url ? (
                          <button
                            onClick={() => setSelectedImage(reg.screenshot_signed_url!)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all inline-flex items-center gap-1"
                            title="View receipt"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {reg.status === 'verified' || reg.status === 'expired' ? (
                          <span className="text-stone-300 text-[11px]">—</span>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatusUpdate(reg.id, 'verified')}
                              className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-all font-bold"
                              title="Verify & Confirm"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                              className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 transition-all font-bold"
                              title="Reject"
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-stone-400 mt-4 text-center">
          Showing {filteredRegistrations.length} of {data?.registrations.length || 0} attendees • Auto-refreshing live
        </p>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    reserved: 'bg-amber-100 text-amber-800 border-amber-200',
    rejected: 'bg-rose-100 text-rose-800 border-rose-200',
    expired: 'bg-stone-100 text-stone-500 border-stone-200',
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[status] || styles.expired}`}>
      {status}
    </span>
  );
}
