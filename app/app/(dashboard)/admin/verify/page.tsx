'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Builder {
  id: string;
  company_name: string;
  email: string;
  gstin: string | null;
  rera_number: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
  user_name: string | null;
}

interface Stats {
  total_users: number;
  total_buyers: number;
  total_builders: number;
  pending_verifications: number;
  verified_builders: number;
  rejected_builders: number;
}

export default function AdminVerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [builders, setBuilders] = useState<{
    pending: Builder[];
    verified: Builder[];
    rejected: Builder[];
    all: Builder[];
  }>({
    pending: [],
    verified: [],
    rejected: [],
    all: [],
  });
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadStats();
      loadBuilders('pending');
      loadBuilders('verified');
      loadBuilders('rejected');
      loadBuilders('all');
    }
  }, [loading]);

  const checkAuth = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login?next=/admin/verify');
        return;
      }

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!roleData) {
        router.push('/unauthorized');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/login');
    }
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  };

  const loadStats = async () => {
    try {
      const data = await apiCall('/api/admin/stats');
      setStats(data.stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      showToast(error.message, 'error');
    }
  };

  const loadBuilders = async (status: 'pending' | 'verified' | 'rejected' | 'all') => {
    try {
      const endpoint = status === 'all'
        ? '/api/admin/builders'
        : `/api/admin/builders?status=${status}`;

      const data = await apiCall(endpoint);
      setBuilders(prev => ({ ...prev, [status]: data.builders || [] }));
    } catch (error: any) {
      console.error(`Error loading ${status} builders:`, error);
    }
  };

  const verifyBuilder = async (builderId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to verify "${companyName}"?`)) return;

    try {
      await apiCall('/api/admin/verify-builder', {
        method: 'POST',
        body: JSON.stringify({
          builder_id: builderId,
          action: 'verify',
        }),
      });

      showToast(`✅ ${companyName} verified successfully!`, 'success');
      await loadStats();
      await loadBuilders('pending');
      await loadBuilders('verified');
      await loadBuilders('all');
    } catch (error: any) {
      showToast('Failed to verify builder: ' + error.message, 'error');
    }
  };

  const rejectBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const submitRejection = async () => {
    if (!selectedBuilder || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await apiCall('/api/admin/verify-builder', {
        method: 'POST',
        body: JSON.stringify({
          builder_id: selectedBuilder.id,
          action: 'reject',
          rejection_reason: rejectionReason.trim(),
        }),
      });

      setShowRejectModal(false);
      showToast(`${selectedBuilder.company_name} application rejected`, 'success');
      await loadStats();
      await loadBuilders('pending');
      await loadBuilders('rejected');
      await loadBuilders('all');
    } catch (error: any) {
      showToast('Failed to reject builder: ' + error.message, 'error');
    }
  };

  const viewBuilder = (builder: Builder) => {
    setSelectedBuilder(builder);
    setShowViewModal(true);
  };

  const exportData = () => {
    const buildersToExport = builders[activeTab];
    const csv = [
      ['Company Name', 'Email', 'GSTIN', 'RERA', 'Status', 'Submitted', 'Verified At'].join(','),
      ...buildersToExport.map(b => [
        `"${b.company_name}"`,
        b.email,
        b.gstin || '-',
        b.rera_number || '-',
        b.verification_status,
        new Date(b.created_at).toLocaleDateString(),
        b.verified_at ? new Date(b.verified_at).toLocaleDateString() : '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tharaga-builders-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 CSV exported successfully!', 'success');
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredBuilders = builders[activeTab].filter(builder => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      builder.company_name.toLowerCase().includes(query) ||
      builder.email.toLowerCase().includes(query) ||
      (builder.gstin && builder.gstin.toLowerCase().includes(query)) ||
      (builder.rera_number && builder.rera_number.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filteredBuilders.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedBuilders = filteredBuilders.slice(startIdx, endIdx);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 border-l-4 border-l-yellow-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Total Users</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.total_users || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Total Buyers</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.total_buyers || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Total Builders</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.total_builders || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 border-l-4 border-l-orange-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Pending Review</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.pending_verifications || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 border-l-4 border-l-green-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Verified</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.verified_builders || 0}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 border-l-4 border-l-red-500">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Rejected</h3>
          <div className="text-2xl font-bold text-gray-100">{stats?.rejected_builders || 0}</div>
        </div>
      </div>

      {/* Search and Export */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          className="flex-1 min-w-[250px] px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          placeholder="🔍 Search by company name, email, GSTIN..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        <button
          onClick={exportData}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded-lg transition-colors"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b-2 border-gray-800 overflow-x-auto">
        {(['pending', 'verified', 'rejected', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCurrentPage(1);
              setSearchQuery('');
            }}
            className={`px-5 py-3 font-bold text-sm border-b-3 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'text-yellow-500 border-b-yellow-500'
                : 'text-gray-400 border-b-transparent hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}{' '}
            <span className={`px-2 py-1 rounded-full text-xs ${
              activeTab === tab ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-400'
            }`}>
              {builders[tab].length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        {paginatedBuilders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No {activeTab === 'all' ? '' : activeTab} builders found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800/60">
                  <tr>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">Company Name</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">Email</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">GSTIN</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">RERA</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">Status</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">Submitted</th>
                    <th className="px-3 py-3 text-left text-gray-300 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {paginatedBuilders.map((builder) => (
                    <tr key={builder.id} className="hover:bg-gray-800/30">
                      <td className="px-3 py-3 text-gray-200 font-semibold">{builder.company_name}</td>
                      <td className="px-3 py-3 text-gray-300">{builder.email}</td>
                      <td className="px-3 py-3 text-gray-300">{builder.gstin || '-'}</td>
                      <td className="px-3 py-3 text-gray-300">{builder.rera_number || '-'}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          builder.verification_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                          builder.verification_status === 'verified' ? 'bg-green-500/20 text-green-500' :
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {builder.verification_status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-gray-300">
                        {new Date(builder.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewBuilder(builder)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                          >
                            View
                          </button>
                          {builder.verification_status === 'pending' && (
                            <>
                              <button
                                onClick={() => verifyBuilder(builder.id, builder.company_name)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
                              >
                                Verify
                              </button>
                              <button
                                onClick={() => rejectBuilder(builder)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-4 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  Showing {startIdx + 1}-{Math.min(endIdx, filteredBuilders.length)} of {filteredBuilders.length} builders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-700 bg-gray-800 text-gray-300 rounded text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    ← Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded text-sm font-semibold ${
                          currentPage === pageNum
                            ? 'bg-yellow-500 text-gray-900 border-yellow-500'
                            : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-700 bg-gray-800 text-gray-300 rounded text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-gray-100">Builder Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-200 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Company Name</div>
                <div className="text-gray-100">{selectedBuilder.company_name}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Email</div>
                <div className="text-gray-100">{selectedBuilder.email}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Contact Person</div>
                <div className="text-gray-100">{selectedBuilder.user_name || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">GSTIN</div>
                <div className="text-gray-100">{selectedBuilder.gstin || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">RERA Number</div>
                <div className="text-gray-100">{selectedBuilder.rera_number || 'Not provided'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Status</div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  selectedBuilder.verification_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                  selectedBuilder.verification_status === 'verified' ? 'bg-green-500/20 text-green-500' :
                  'bg-red-500/20 text-red-500'
                }`}>
                  {selectedBuilder.verification_status}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Submitted On</div>
                <div className="text-gray-100">{new Date(selectedBuilder.created_at).toLocaleString()}</div>
              </div>
              {selectedBuilder.verified_at && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Verified On</div>
                  <div className="text-gray-100">{new Date(selectedBuilder.verified_at).toLocaleString()}</div>
                </div>
              )}
              {selectedBuilder.rejection_reason && (
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Rejection Reason</div>
                  <div className="text-gray-100">{selectedBuilder.rejection_reason}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedBuilder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold text-gray-100">Reject Builder Application</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-400 hover:text-gray-200 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-yellow-500 min-h-[120px] resize-y"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-semibold animate-slide-in`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

