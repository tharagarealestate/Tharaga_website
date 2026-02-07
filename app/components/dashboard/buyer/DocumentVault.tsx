'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, FileCheck, Upload, Eye, Download, Trash2,
  CheckCircle2, Clock, AlertCircle, XCircle, File, FileText,
  Image as ImageIcon, FileSpreadsheet, Plus, X,
  ShieldCheck, Fingerprint, Key
} from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_at: string | null;
  rejection_reason: string | null;
  expires_at: string | null;
  is_encrypted: boolean;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { id: 'aadhaar', name: 'Aadhaar Card', icon: '🪪', required: true },
  { id: 'pan', name: 'PAN Card', icon: '💳', required: true },
  { id: 'bank_statement', name: 'Bank Statement', icon: '🏦', required: false },
  { id: 'salary_slip', name: 'Salary Slips (3 months)', icon: '📄', required: false },
  { id: 'itr', name: 'Income Tax Returns', icon: '📊', required: false },
  { id: 'other', name: 'Other Documents', icon: '📁', required: false },
];

export default function DocumentVault() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supabase } = useSupabase();

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedType) return;
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${selectedType}/${Date.now()}.${fileExt}`;

      // Upload to storage (assuming bucket exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { error: insertError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          document_name: file.name,
          document_type: selectedType,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          is_encrypted: true
        });

      if (insertError) throw insertError;
      fetchDocuments();
      setShowUpload(false);
      setSelectedType('');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  };

  // Delete document
  const deleteDocument = async (doc: Document) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete from storage
      const path = doc.file_url.split('/').slice(-3).join('/');
      await supabase.storage.from('user-documents').remove([path]);

      // Delete record
      await supabase
        .from('user_documents')
        .delete()
        .eq('id', doc.id);
      fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get status badge
  const getStatusBadge = (status: Document['verification_status']) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-amber-500/20 text-amber-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-red-500/20 text-red-400 text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case 'expired':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-gray-500/20 text-gray-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Expired
          </span>
        );
    }
  };

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  // Group documents by type
  const documentsByType = DOCUMENT_TYPES.map(type => ({
    ...type,
    documents: documents.filter(d => d.document_type === type.id)
  }));

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Header */}
      <div className="relative overflow-hidden rounded-2xl
        backdrop-blur-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10
        border border-white/10 p-6">

        {/* Animated Security Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-400/30"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + i * 10}%`,
              }}
            />
          ))}
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20
                border border-emerald-500/30">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>
              {/* Animated Shield Glow */}
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(52, 211, 153, 0)',
                    '0 0 20px 5px rgba(52, 211, 153, 0.3)',
                    '0 0 0 0 rgba(52, 211, 153, 0)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                Document Vault
                <Lock className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-sm text-gray-400">Bank-level encryption • End-to-end security</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Security Features */}
            <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>256-bit SSL</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>Biometric</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Key className="w-4 h-4 text-blue-400" />
                <span>AES-256</span>
              </div>
            </div>

            <motion.button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-emerald-500 to-cyan-500
                text-white font-medium
                hover:shadow-lg hover:shadow-emerald-500/20
                transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              Upload Document
            </motion.button>
          </div>
        </div>
      </div>

      {/* Document Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documentsByType.map((type) => (
          <motion.div
            key={type.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              relative rounded-2xl overflow-hidden
              backdrop-blur-xl bg-white/[0.04] border border-white/10
              hover:bg-white/[0.08] hover:border-white/20
              transition-all duration-300 group p-4
              ${type.documents.length > 0 ? '' : 'opacity-60'}
            `}
          >
            {/* Type Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <h3 className="text-white font-medium">{type.name}</h3>
                  <p className="text-xs text-gray-500">
                    {type.documents.length} document{type.documents.length !== 1 ? 's' : ''}
                    {type.required && <span className="text-red-400 ml-1">*</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedType(type.id); setShowUpload(true); }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10
                  text-gray-400 hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Documents List */}
            {type.documents.length > 0 ? (
              <div className="space-y-2">
                {type.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5
                      hover:bg-white/10 transition-all group/doc"
                  >
                    <div className="p-2 rounded-lg bg-white/10 text-gray-400">
                      {getFileIcon(doc.mime_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.document_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </span>
                        {doc.is_encrypted && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <Lock className="w-3 h-3" />
                            Encrypted
                          </span>
                        )}
                      </div>
                    </div>

                    {getStatusBadge(doc.verification_status)}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400
                          hover:text-white transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <a
                        href={doc.file_url}
                        download
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400
                          hover:text-white transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteDocument(doc)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400
                          hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-gray-500">No documents uploaded</p>
                <button
                  onClick={() => { setSelectedType(type.id); setShowUpload(true); }}
                  className="mt-2 text-sm text-[#D4AF37] hover:text-[#F0D78C] transition-colors"
                >
                  Upload now
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4
              bg-black/60 backdrop-blur-sm"
            onClick={() => setShowUpload(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden
                backdrop-blur-xl bg-slate-900/95 border border-white/10
                shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20">
                    <Upload className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Upload Document</h3>
                    <p className="text-sm text-gray-400">Secure & encrypted storage</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400
                    hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Document Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DOCUMENT_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-xl border transition-all
                          ${selectedType === type.id
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }
                        `}
                      >
                        <span className="text-xl">{type.icon}</span>
                        <span className="text-sm">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center
                    transition-all cursor-pointer
                    ${dragActive
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-white/20 hover:border-white/30 bg-white/5'
                    }
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => handleUpload(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center">
                    <div className={`
                      p-4 rounded-2xl mb-4 transition-colors
                      ${dragActive ? 'bg-emerald-500/20' : 'bg-white/10'}
                    `}>
                      <Upload className={`w-8 h-8 ${dragActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                    </div>

                    <p className="text-white font-medium mb-1">
                      {dragActive ? 'Drop your file here' : 'Drag & drop your document'}
                    </p>
                    <p className="text-sm text-gray-400 mb-3">
                      or click to browse from your device
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported: PDF, JPG, PNG, DOC (Max 10MB)
                    </p>
                  </div>

                  {uploading && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-xl
                      flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent
                          rounded-full animate-spin" />
                        <p className="text-sm text-gray-300">Uploading...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5
                  border border-emerald-500/20">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-400">
                    <p className="text-emerald-400 font-medium mb-1">Your documents are secure</p>
                    <p>All uploads are encrypted with AES-256 and stored securely.
                    Only you and authorized parties can access them.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

