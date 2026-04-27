'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Upload, Sparkles, CheckCircle, XCircle, Loader2, Image as ImageIcon, Zap } from 'lucide-react';

interface StagingProgress {
  job_id: string;
  progress_pct: number;
  current_step: string;
  estimated_time_remaining_sec: number;
}

interface VirtualStagingUploaderProps {
  propertyId: string;
  onStagingComplete?: (stagedUrl: string) => void;
}

export default function VirtualStagingUploader({
  propertyId,
  onStagingComplete
}: VirtualStagingUploaderProps) {
  const supabase = createClientComponentClient();
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [stagingStyle, setStagingStyle] = useState<string>('modern');
  const [roomType, setRoomType] = useState<string>('living_room');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<StagingProgress | null>(null);
  const [stagedResult, setStagedResult] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  const styles = [
    { value: 'modern', label: 'Modern', emoji: '✨' },
    { value: 'luxury', label: 'Luxury', emoji: '👑' },
    { value: 'minimalist', label: 'Minimalist', emoji: '🎯' },
    { value: 'traditional', label: 'Traditional', emoji: '🏛️' },
    { value: 'scandinavian', label: 'Scandinavian', emoji: '🌲' }
  ];
  
  const rooms = [
    { value: 'living_room', label: 'Living Room', emoji: '🛋️' },
    { value: 'bedroom', label: 'Bedroom', emoji: '🛏️' },
    { value: 'kitchen', label: 'Kitchen', emoji: '🍳' },
    { value: 'bathroom', label: 'Bathroom', emoji: '🚿' },
    { value: 'dining_room', label: 'Dining Room', emoji: '🍽️' }
  ];
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }
    
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };
  
  const uploadAndStage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    setError('');
    
    try {
      // 1. Upload original image to Supabase Storage
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(`originals/${fileName}`, selectedImage);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(`originals/${fileName}`);
      
      // 2. Create staging job
      const response = await fetch('/api/ai/virtual-staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          original_image_url: publicUrl,
          staging_style: stagingStyle,
          room_type: roomType
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to start staging');
      }
      
      // 3. Subscribe to real-time progress
      subscribeToProgress(result.data.job_id);
      
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
      setIsProcessing(false);
    }
  };
  
  const subscribeToProgress = (jobId: string) => {
    // Real-time subscription to staging_progress table
    const channel = supabase
      .channel(`staging-progress-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'staging_progress',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          const newProgress = payload.new as StagingProgress;
          setProgress(newProgress);
          
          // Check if completed
          if (newProgress.progress_pct === 100) {
            fetchCompletedJob(jobId);
          }
        }
      )
      .subscribe();
    
    // Also subscribe to job status changes
    supabase
      .channel(`staging-job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'virtual_staging_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const job = payload.new as any;
          
          if (job.status === 'failed') {
            setError(job.error_message || 'Staging failed');
            setIsProcessing(false);
          } else if (job.status === 'completed' && job.staged_image_url) {
            setStagedResult(job.staged_image_url);
            setIsProcessing(false);
            onStagingComplete?.(job.staged_image_url);
          }
        }
      )
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  };
  
  const fetchCompletedJob = async (jobId: string) => {
    const { data: job } = await supabase
      .from('virtual_staging_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (job?.staged_image_url) {
      setStagedResult(job.staged_image_url);
      setIsProcessing(false);
      onStagingComplete?.(job.staged_image_url);
    }
  };
  
  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      'queued': 'In Queue',
      'downloading': 'Downloading Image',
      'analyzing': 'Analyzing Room',
      'generating': 'AI Staging Magic ✨',
      'enhancing': 'Enhancing Quality',
      'finalizing': 'Finalizing',
      'completed': 'Complete!'
    };
    return labels[step] || step;
  };
  
  return (
    <div className="relative group">
      {/* Card Container */}
      <div className="
        relative h-full
        rounded-3xl overflow-hidden
        transition-all duration-500
        backdrop-blur-xl bg-white/10 border border-white/20
        hover:shadow-2xl hover:-translate-y-2
      ">
        {/* Shimmer Effect on Hover */}
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none' />
        
        <div className='relative p-6'>
          {/* Header */}
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl'>
              <Sparkles className='w-6 h-6 text-white' />
            </div>
            <div>
              <h3 className='text-xl font-bold text-white flex items-center gap-2'>
                AI Virtual Staging
                <Zap className='w-5 h-5 text-gold-400' />
              </h3>
              <p className='text-sm text-gray-400'>Transform empty rooms into furnished showrooms</p>
            </div>
          </div>
          
          {/* Image Upload */}
          {!previewUrl && !stagedResult && (
            <label className="block cursor-pointer">
              <div className="
                border-2 border-dashed border-white/30 rounded-xl p-12 text-center 
                hover:border-blue-500/50 hover:bg-white/5 transition-all duration-300
                backdrop-blur-sm
              ">
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-white font-medium mb-1">Click to upload image</p>
                <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageSelect}
                disabled={isProcessing}
              />
            </label>
          )}
          
          {/* Preview & Options */}
          {previewUrl && !stagedResult && (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden border border-white/20">
                <img
                  src={previewUrl}
                  alt="Original"
                  className="w-full h-64 object-cover"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
                      <p className="font-medium mb-2 text-lg">{getStepLabel(progress?.current_step || 'processing')}</p>
                      <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                          style={{ width: `${progress?.progress_pct || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-300">
                        {progress?.estimated_time_remaining_sec 
                          ? `~${progress.estimated_time_remaining_sec}s remaining`
                          : 'Processing...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {!isProcessing && (
                <>
                  {/* Style Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Staging Style</label>
                    <div className="grid grid-cols-5 gap-3">
                      {styles.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setStagingStyle(style.value)}
                          className={`
                            p-3 rounded-xl border-2 transition-all backdrop-blur-sm
                            ${stagingStyle === style.value
                              ? 'border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/30'
                              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                            }
                          `}
                        >
                          <div className="text-2xl mb-1">{style.emoji}</div>
                          <div className="text-xs font-medium text-white">{style.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Room Type Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Room Type</label>
                    <div className="grid grid-cols-5 gap-3">
                      {rooms.map((room) => (
                        <button
                          key={room.value}
                          onClick={() => setRoomType(room.value)}
                          className={`
                            p-3 rounded-xl border-2 transition-all backdrop-blur-sm
                            ${roomType === room.value
                              ? 'border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                              : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                            }
                          `}
                        >
                          <div className="text-2xl mb-1">{room.emoji}</div>
                          <div className="text-xs font-medium text-white">{room.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={uploadAndStage}
                      disabled={isProcessing}
                      className="
                        flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl 
                        font-medium hover:shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-1 
                        transition-all duration-300 flex items-center justify-center gap-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      <Sparkles className="w-5 h-5" />
                      Start AI Staging
                    </button>
                    <button
                      onClick={() => {
                        setPreviewUrl('');
                        setSelectedImage(null);
                        setError('');
                      }}
                      className="
                        px-6 py-3 rounded-xl border-2 border-white/20 text-white font-medium 
                        hover:bg-white/10 hover:border-white/30 transition-all duration-300
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Result Comparison */}
          {stagedResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle className="w-5 h-5" />
                Staging Complete!
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="backdrop-blur-sm bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-sm font-medium text-gray-300 mb-2">Before</p>
                  <img 
                    src={previewUrl} 
                    alt="Before" 
                    className="w-full h-48 object-cover rounded-lg" 
                  />
                </div>
                <div className="backdrop-blur-sm bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-3 border border-purple-500/30">
                  <p className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    After (AI Staged)
                    <Sparkles className="w-4 h-4 text-gold-400" />
                  </p>
                  <img 
                    src={stagedResult} 
                    alt="After" 
                    className="w-full h-48 object-cover rounded-lg" 
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  setPreviewUrl('');
                  setSelectedImage(null);
                  setStagedResult(null);
                  setProgress(null);
                  setError('');
                }}
                className="
                  w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl 
                  font-medium hover:shadow-lg transition-all duration-300
                "
              >
                Stage Another Image
              </button>
            </div>
          )}
          
          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3 backdrop-blur-sm">
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

