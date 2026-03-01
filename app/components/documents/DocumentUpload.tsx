'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, Check, AlertCircle, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/SelectGroup';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabase';

interface DocumentUploadProps {
  propertyId: string;
  onUploadComplete?: (document: any) => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

export default function DocumentUpload({ propertyId, onUploadComplete }: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentType, setDocumentType] = useState('brochure');
  const [accessLevel, setAccessLevel] = useState('verified');
  const [smartscoreRequired, setSmartscoreRequired] = useState(60);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabase();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => {
      const validTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validTypes.includes(file.type);
    });

    if (droppedFiles.length === 0) {
      toast.error('Invalid file type. Please upload PDF, Images, or Word documents.');
      return;
    }

    // Check file sizes (max 10MB)
    const validFiles = droppedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(file => {
      const validTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      return validTypes.includes(file.type);
    });

    if (selectedFiles.length === 0) {
      toast.error('Invalid file type. Please upload PDF, Images, or Word documents.');
      return;
    }

    const validFiles = selectedFiles.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDocuments = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to upload documents');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('property_id', propertyId);
        formData.append('document_type', documentType);
        formData.append('access_level', accessLevel);
        formData.append('smartscore_required', smartscoreRequired.toString());
        formData.append('uploaded_by', user.id);

        const response = await fetch(`${API_URL}/api/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Upload failed');
        }

        const result = await response.json();
        setUploadProgress(((i + 1) / files.length) * 100);

        if (onUploadComplete) {
          onUploadComplete(result);
        }
      }

      toast.success(`${files.length} document(s) uploaded successfully!`);
      setFiles([]);
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else {
      return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 relative overflow-hidden p-6">
      {/* Animated Background Elements */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-20 left-10 w-96 h-96 bg-gold-500 rounded-full blur-3xl animate-pulse-slow' />
        <div 
          className='absolute bottom-20 right-10 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-3xl animate-pulse-slow' 
          style={{ animationDelay: '1s' }} 
        />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Upload Documents</h2>
          <p className="text-white/60">Secure document storage with access control</p>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl border-2 border-dashed p-12 text-center cursor-pointer
            ${isDragActive 
              ? 'border-gold-500 bg-gold-500/10' 
              : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
            }
          `}
        >
          {/* Shimmer Effect */}
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="relative z-10">
            <div className="bg-gold-500/20 border border-gold-500/30 rounded-full p-6 mx-auto w-fit mb-6">
              <Upload className="w-12 h-12 text-gold-500 mx-auto" />
            </div>
            
            {isDragActive ? (
              <p className="text-gold-400 font-medium text-lg">Drop files here...</p>
            ) : (
              <div>
                <p className="text-white font-medium mb-2 text-lg">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-white/60 text-sm">
                  PDF, Images, Word documents (max 10MB per file)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 space-y-3">
            <h3 className="text-white font-semibold mb-4">Selected Files</h3>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getFileIcon(file)}</div>
                  <div>
                    <p className="font-medium text-sm text-white">{file.name}</p>
                    <p className="text-xs text-white/60">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  variant="invisible"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Configuration */}
        {files.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
            <h3 className="text-white font-semibold mb-4">Document Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Document Type</label>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <option value="floor_plan">Floor Plan</option>
                  <option value="brochure">Brochure</option>
                  <option value="legal_doc">Legal Document</option>
                  <option value="noc">NOC</option>
                  <option value="property_paper">Property Paper</option>
                </Select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Access Level</label>
                <Select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <option value="public">Public</option>
                  <option value="verified">Verified Users</option>
                  <option value="high_score">High Score Only</option>
                  <option value="premium">Premium Only</option>
                </Select>
              </div>
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  SmartScore Required
                </label>
                <Select
                  value={smartscoreRequired.toString()}
                  onChange={(e) => setSmartscoreRequired(parseInt(e.target.value))}
                  className="bg-white/5 border-white/20 text-white"
                >
                  <option value="0">No Requirement</option>
                  <option value="50">50+ (Warm)</option>
                  <option value="70">70+ (Hot)</option>
                  <option value="85">85+ (Very Hot)</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="relative rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Uploading...</span>
              <span className="text-white/60 text-sm">{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && !uploading && (
          <Button
            onClick={uploadDocuments}
            variant="primary"
            className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-primary-950 shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload {files.length} Document{files.length > 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </div>
  );
}

