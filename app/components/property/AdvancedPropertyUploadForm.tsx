"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Image as ImageIcon,
  Video,
  MapPin,
  DollarSign,
  Home,
  FileText,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  RefreshCw,
  ExternalLink,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useToast } from '@/components/ui/toast';
// Using native file inputs instead of react-dropzone

interface PropertyUploadFormData {
  // Step 1: Basic Information
  title: string;
  description: string;
  project: string;
  property_type: 'Apartment' | 'Villa' | 'Plot' | 'Commercial';
  bhk_type?: '1RK' | '1BHK' | '2BHK' | '3BHK' | '4BHK' | '5BHK+';
  
  // Step 2: Property Details
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  carpet_area?: number;
  builtup_area?: number;
  super_buildup_area?: number;
  plot_area?: number;
  floor?: number;
  total_floors?: number;
  facing?: string;
  parking?: number;
  balcony_count?: number;
  furnishing_status?: 'unfurnished' | 'semi-furnished' | 'fully-furnished';
  
  // Step 3: Location
  city: string;
  locality?: string;
  state?: string;
  address?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  
  // Step 4: Pricing
  price_inr: number;
  price_per_sqft?: number;
  negotiable: boolean;
  base_price?: number;
  
  // Step 5: Media
  images: string[];
  videos: string[];
  floor_plan_images: string[];
  virtual_tour_url?: string;
  
  // Step 6: Amenities & Features
  amenities: string[];
  
  // Step 7: Documents
  rera_id?: string;
  rera_verified: boolean;
  rera_certificate_url?: string;
  oc_certificate?: string;
  cc_certificate?: string;
  approved_plan_url?: string;
  
  // Step 8: Metadata
  property_metadata?: {
    rera_number?: string;
    completion_certificate?: boolean;
    occupancy_certificate?: boolean;
    approved_by?: string[];
    construction_year?: number;
    possession_date?: string;
    water_source?: string[];
    power_backup?: string;
    security_features?: string[];
    green_features?: string[];
    vastu_compliant?: boolean;
  };
  
  // Admin fields
  uploaded_for_builder_id?: string;
  upload_source: 'builder_direct' | 'admin_on_behalf' | 'api_import' | 'bulk_upload';
}

interface AdvancedPropertyUploadFormProps {
  builderId?: string; // For admin uploads
  onSuccess?: (propertyId: string) => void;
  onCancel?: () => void;
}

const TOTAL_STEPS = 8;

export function AdvancedPropertyUploadForm({
  builderId,
  onSuccess,
  onCancel,
}: AdvancedPropertyUploadFormProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // ── RERA verification state ────────────────────────────────────────────
  const [reraHasRera, setReraHasRera] = useState<boolean | null>(null);
  const [reraInputNumber, setReraInputNumber] = useState('');
  const [reraState, setReraState] = useState('Tamil Nadu');
  type ReraStatus = 'idle' | 'verifying' | 'verified' | 'pending_manual' | 'failed';
  const [reraStatus, setReraStatus] = useState<ReraStatus>('idle');
  const [reraResultData, setReraResultData] = useState<{
    reraNumber?: string;
    registeredName?: string;
    registrationType?: string;
    registrationDate?: string | null;
    expiryDate?: string | null;
    promoterName?: string | null;
    isActive?: boolean;
    complianceScore?: number;
    complaintsCount?: number;
    projectName?: string | null;
    status?: string | null;
  } | null>(null);
  const [reraExemptReason, setReraExemptReason] = useState('');
  const [reraExemptAcknowledged, setReraExemptAcknowledged] = useState(false);

  const [formData, setFormData] = useState<PropertyUploadFormData>({
    title: '',
    description: '',
    project: '',
    property_type: 'Apartment',
    bhk_type: undefined,
    bedrooms: undefined,
    bathrooms: undefined,
    sqft: undefined,
    carpet_area: undefined,
    builtup_area: undefined,
    super_buildup_area: undefined,
    plot_area: undefined,
    floor: undefined,
    total_floors: undefined,
    facing: undefined,
    parking: undefined,
    balcony_count: undefined,
    furnishing_status: undefined,
    city: '',
    locality: '',
    state: '',
    address: '',
    pincode: '',
    lat: undefined,
    lng: undefined,
    price_inr: 0,
    price_per_sqft: undefined,
    negotiable: true,
    base_price: undefined,
    images: [],
    videos: [],
    floor_plan_images: [],
    virtual_tour_url: '',
    amenities: [],
    rera_id: '',
    rera_verified: false,
    rera_certificate_url: '',
    oc_certificate: '',
    cc_certificate: '',
    approved_plan_url: '',
    property_metadata: {},
    uploaded_for_builder_id: builderId,
    upload_source: builderId ? 'admin_on_behalf' : 'builder_direct',
  });

  // File upload handlers using native file inputs
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            videos: [...prev.videos, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFloorPlanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData((prev) => ({
            ...prev,
            floor_plan_images: [...prev.floor_plan_images, reader.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 5) {
          newErrors.title = 'Title must be at least 5 characters';
        }
        if (!formData.property_type) {
          newErrors.property_type = 'Property type is required';
        }
        break;

      case 2:
        // Property details are mostly optional
        break;

      case 3:
        if (!formData.city || formData.city.length < 2) {
          newErrors.city = 'City is required';
        }
        break;

      case 4:
        if (!formData.price_inr || formData.price_inr <= 0) {
          newErrors.price_inr = 'Price is required and must be greater than 0';
        }
        break;

      case 5:
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;

      case 6:
        // Amenities — optional
        break;

      case 7:
        if (reraHasRera === null) {
          newErrors.rera = 'Please indicate if this property has RERA registration.';
        } else if (reraHasRera) {
          if (!reraInputNumber.trim()) {
            newErrors.rera = 'Please enter your RERA registration number.';
          } else if (reraStatus === 'idle') {
            newErrors.rera = 'Please click "Verify RERA" to authenticate this number.';
          } else if (reraStatus === 'verifying') {
            newErrors.rera = 'Verification is in progress. Please wait.';
          } else if (reraStatus === 'failed') {
            newErrors.rera = 'RERA verification failed. Check the number and try again.';
          }
        } else {
          // No RERA — require acknowledgment
          if (!reraExemptReason) {
            newErrors.rera = 'Please select a reason for RERA exemption.';
          } else if (!reraExemptAcknowledged) {
            newErrors.rera = 'Please acknowledge the RERA exemption declaration.';
          }
        }
        break;

      case 8:
        // Metadata — optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/properties/upload-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload property');
      }

      setPropertyId(data.propertyId);
      setSuccess(true);
      
      // Show success toast
      showToast({
        type: 'success',
        title: 'Property Uploaded Successfully!',
        message: 'Your property is pending verification.',
      });
      
      if (onSuccess) {
        onSuccess(data.propertyId);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload property. Please try again.';
      setErrors({ submit: errorMessage });
      
      // Show error toast
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const removeFloorPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      floor_plan_images: prev.floor_plan_images.filter((_, i) => i !== index),
    }));
  };

  // ── RERA real-time verification ────────────────────────────────────────
  const verifyRera = useCallback(async () => {
    const num = reraInputNumber.trim().toUpperCase();
    if (!num) return;
    setReraStatus('verifying');
    setReraResultData(null);
    try {
      const res = await fetch('/api/rera/verify', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rera_number: num,
          state: reraState,
          type: 'property',
        }),
      });
      const data = await res.json();
      if (data.success && data.verified) {
        setReraStatus('verified');
        setReraResultData(data.data || null);
        setFormData((prev) => ({
          ...prev,
          rera_id: num,
          rera_verified: true,
          property_metadata: {
            ...prev.property_metadata,
            rera_number: num,
          },
        }));
      } else if (data.success && !data.verified) {
        // Number exists but couldn't auto-verify — mark for manual review
        setReraStatus('pending_manual');
        setReraResultData(data.data || null);
        setFormData((prev) => ({
          ...prev,
          rera_id: num,
          rera_verified: false,
          property_metadata: {
            ...prev.property_metadata,
            rera_number: num,
          },
        }));
      } else {
        setReraStatus('failed');
      }
    } catch {
      setReraStatus('failed');
    }
  }, [reraInputNumber, reraState]);

  // Common amenities list
  const commonAmenities = [
    'Swimming Pool', 'Gym', 'Park', 'Security', 'Power Backup', 'Lift',
    'Parking', 'Clubhouse', 'Playground', 'Garden', 'WiFi', 'CCTV',
    'Water Supply', 'Rainwater Harvesting', 'Solar Power', 'Waste Management',
  ];

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto p-8 bg-slate-800/95 glow-border rounded-xl shadow-2xl border border-slate-700/50"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white">Property Uploaded Successfully!</h2>
          <p className="text-slate-300 mb-4">
            Your property has been uploaded and is pending verification.
          </p>
          {propertyId && (
            <p className="text-sm text-slate-400 mb-6">Property ID: {propertyId}</p>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setSuccess(false);
                setCurrentStep(1);
                setFormData({
                  ...formData,
                  title: '',
                  description: '',
                  images: [],
                  videos: [],
                  floor_plan_images: [],
                });
              }}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              Upload Another Property
            </motion.button>
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="px-8 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white transition-all border border-slate-600/50"
              >
                Close
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  const formSteps = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'details', label: 'Details' },
    { id: 'location', label: 'Location' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'images', label: 'Images' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'rera', label: 'RERA' },
    { id: 'review', label: 'Review' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Progress Bar */}
      <ProgressBar 
        steps={formSteps}
        currentStep={currentStep - 1}
        className="mb-8"
      />

      {/* Form Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Home className="w-6 h-6 text-amber-300" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Property Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Luxury 3BHK Apartment in Prime Location"
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                      placeholder="Describe your property..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Project Name</label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, project: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Green Valley Residency"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">
                        Property Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            property_type: e.target.value as any,
                          }))
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    {formData.property_type === 'Apartment' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 text-slate-300">BHK Type</label>
                        <select
                          value={formData.bhk_type || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              bhk_type: e.target.value as any,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        >
                          <option value="">Select BHK</option>
                          <option value="1RK">1RK</option>
                          <option value="1BHK">1BHK</option>
                          <option value="2BHK">2BHK</option>
                          <option value="3BHK">3BHK</option>
                          <option value="4BHK">4BHK</option>
                          <option value="5BHK+">5BHK+</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Property Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <Building2 className="w-6 h-6 text-amber-300" />
                  Property Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Bedrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.bedrooms || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bedrooms: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Bathrooms</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.bathrooms || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          bathrooms: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Carpet Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.carpet_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          carpet_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Built-up Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.builtup_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          builtup_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Super Built-up Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.super_buildup_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          super_buildup_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Plot Area (sqft)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.plot_area || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          plot_area: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Floor Number</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.floor || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          floor: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Total Floors</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.total_floors || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          total_floors: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Facing</label>
                    <select
                      value={formData.facing || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, facing: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">Select Facing</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                      <option value="North-East">North-East</option>
                      <option value="North-West">North-West</option>
                      <option value="South-East">South-East</option>
                      <option value="South-West">South-West</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Parking Slots</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.parking || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          parking: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Furnishing Status</label>
                    <select
                      value={formData.furnishing_status || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          furnishing_status: e.target.value as any,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi-furnished">Semi-Furnished</option>
                      <option value="fully-furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <MapPin className="w-6 h-6 text-amber-300" />
                  Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      City <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Bangalore"
                    />
                    {errors.city && (
                      <p className="text-red-400 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Locality</label>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, locality: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Whitefield"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="e.g., Karnataka"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="Full address..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-slate-300">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, pincode: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                        placeholder="560001"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Pricing */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <DollarSign className="w-6 h-6 text-amber-300" />
                  Pricing
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Price (INR) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={formData.price_inr || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_inr: e.target.value ? parseFloat(e.target.value) : 0,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="5000000"
                    />
                    {errors.price_inr && (
                      <p className="text-red-400 text-sm mt-1">{errors.price_inr}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Price per sqft</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formData.price_per_sqft || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price_per_sqft: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="Auto-calculated if area provided"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="negotiable"
                      checked={formData.negotiable}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, negotiable: e.target.checked }))
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="negotiable" className="text-sm font-medium text-slate-300">
                      Price is negotiable
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Media */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2 text-white">
                  <ImageIcon className="w-6 h-6 text-amber-300" />
                  Media
                </h2>
                <div className="space-y-6">
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">
                      Property Images <span className="text-red-400">*</span>
                    </label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select images
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, WebP (max 10MB each)
                      </p>
                    </label>
                    {errors.images && (
                      <p className="text-red-400 text-sm mt-1">{errors.images}</p>
                    )}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Property ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Videos */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Property Videos</label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/webm"
                        multiple
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                      <Video className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select videos
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        MP4, MOV, WebM (max 50MB each)
                      </p>
                    </label>
                    {formData.videos.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.videos.map((video, index) => (
                          <div key={index} className="relative group">
                            <video
                              src={video}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                              controls
                            />
                            <button
                              onClick={() => removeVideo(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Floor Plans */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Floor Plans</label>
                    <label className="border-2 border-dashed border-slate-600/50 rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-slate-700/30 transition-all block glow-border">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        multiple
                        onChange={handleFloorPlanChange}
                        className="hidden"
                      />
                      <FileText className="w-12 h-12 mx-auto mb-2 text-amber-300" />
                      <p className="text-sm text-slate-300">
                        Click to select floor plans
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPEG, PNG, PDF (max 10MB each)
                      </p>
                    </label>
                    {formData.floor_plan_images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.floor_plan_images.map((plan, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={plan}
                              alt={`Floor Plan ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-600/50 glow-border"
                            />
                            <button
                              onClick={() => removeFloorPlan(index)}
                              className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1.5 shadow-lg transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Virtual Tour */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Virtual Tour URL</label>
                    <input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, virtual_tour_url: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Amenities */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Amenities & Features</h2>
                <div className="grid grid-cols-3 gap-3">
                  {commonAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: [...prev.amenities, amenity],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              amenities: prev.amenities.filter((a) => a !== amenity),
                            }));
                          }
                        }}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm text-slate-300">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: RERA Verification */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2 text-white">
                  <Shield className="w-6 h-6 text-amber-300" />
                  RERA Verification
                </h2>
                <p className="text-sm text-slate-400 mb-6">
                  All residential and commercial properties above a threshold must be registered under RERA.
                  We verify directly with the official state portal in real time.
                </p>

                {/* ── Has RERA? toggle ──────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setReraHasRera(true);
                      setReraStatus('idle');
                      setReraResultData(null);
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      reraHasRera === true
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-slate-600/50 bg-slate-700/30 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <ShieldCheck className="w-7 h-7" />
                    <span className="text-sm font-semibold">Yes, RERA Registered</span>
                    <span className="text-xs opacity-70 text-center">I have a RERA registration number</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReraHasRera(false);
                      setFormData((prev) => ({ ...prev, rera_id: '', rera_verified: false }));
                    }}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      reraHasRera === false
                        ? 'border-slate-400 bg-slate-700/50 text-slate-200'
                        : 'border-slate-600/50 bg-slate-700/30 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <ShieldQuestion className="w-7 h-7" />
                    <span className="text-sm font-semibold">Not Applicable</span>
                    <span className="text-xs opacity-70 text-center">Exempt / Under-construction / Plot</span>
                  </button>
                </div>

                {/* ── RERA Registered flow ─────────────────────────── */}
                {reraHasRera === true && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="has-rera"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* State + Number inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            State
                          </label>
                          <select
                            value={reraState}
                            onChange={(e) => {
                              setReraState(e.target.value);
                              setReraStatus('idle');
                              setReraResultData(null);
                            }}
                            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                          >
                            {[
                              'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Gujarat',
                              'Telangana', 'Kerala', 'Delhi', 'Punjab',
                              'Haryana', 'Rajasthan', 'Uttar Pradesh', 'West Bengal',
                              'Andhra Pradesh', 'Madhya Pradesh', 'Bihar', 'Odisha',
                            ].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            RERA Registration Number <span className="text-red-400">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={reraInputNumber}
                              onChange={(e) => {
                                setReraInputNumber(e.target.value);
                                if (reraStatus !== 'idle') {
                                  setReraStatus('idle');
                                  setReraResultData(null);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') verifyRera();
                              }}
                              placeholder={
                                reraState === 'Tamil Nadu'
                                  ? 'TN/01/Building/12345/2024'
                                  : reraState === 'Karnataka'
                                  ? 'PRM/KA/RERA/1251/308/PR/…'
                                  : reraState === 'Maharashtra'
                                  ? 'P51900012345'
                                  : 'Enter RERA number'
                              }
                              className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={verifyRera}
                              disabled={!reraInputNumber.trim() || reraStatus === 'verifying'}
                              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-400 font-semibold rounded-lg text-sm transition-all whitespace-nowrap"
                            >
                              {reraStatus === 'verifying' ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
                              ) : (reraStatus === 'verified' || reraStatus === 'pending_manual') ? (
                                <><RefreshCw className="w-4 h-4" /> Re-verify</>
                              ) : (
                                <><Shield className="w-4 h-4" /> Verify RERA</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* ── Verification result card ─────────────────── */}
                      <AnimatePresence mode="wait">
                        {reraStatus === 'verifying' && (
                          <motion.div
                            key="verifying"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            className="flex items-center gap-3 p-4 bg-slate-700/40 border border-slate-600/40 rounded-xl"
                          >
                            <Loader2 className="w-5 h-5 text-amber-400 animate-spin flex-shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-white">Contacting {reraState} RERA Portal…</p>
                              <p className="text-xs text-slate-400 mt-0.5">Fetching live registration data. This takes 5–15 seconds.</p>
                            </div>
                          </motion.div>
                        )}

                        {reraStatus === 'verified' && reraResultData && (
                          <motion.div
                            key="verified"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl overflow-hidden"
                          >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-emerald-300">RERA Verified Successfully</p>
                                <p className="text-xs text-emerald-400/70">Matched against official {reraState} RERA portal</p>
                              </div>
                              {reraResultData.complianceScore != null && (
                                <div className="text-right flex-shrink-0">
                                  <p className="text-xs text-slate-400">Compliance</p>
                                  <p className={`text-lg font-bold ${
                                    reraResultData.complianceScore >= 70 ? 'text-emerald-400' :
                                    reraResultData.complianceScore >= 40 ? 'text-amber-400' : 'text-red-400'
                                  }`}>{reraResultData.complianceScore}%</p>
                                </div>
                              )}
                            </div>
                            {/* Details grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-700/20 text-sm">
                              {[
                                { label: 'Project Name', value: reraResultData.projectName },
                                { label: 'Promoter', value: reraResultData.promoterName },
                                { label: 'Registered As', value: reraResultData.registeredName },
                                { label: 'Type', value: reraResultData.registrationType },
                                {
                                  label: 'Expires',
                                  value: reraResultData.expiryDate
                                    ? new Date(reraResultData.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : null,
                                },
                                {
                                  label: 'Status',
                                  value: reraResultData.isActive ? 'Active ✓' : 'Inactive ✗',
                                },
                              ].filter(r => r.value).map(row => (
                                <div key={row.label} className="px-4 py-2.5 bg-slate-800/30">
                                  <p className="text-xs text-slate-500 mb-0.5">{row.label}</p>
                                  <p className="text-sm text-slate-200 font-medium truncate">{row.value}</p>
                                </div>
                              ))}
                            </div>
                            {(reraResultData.complaintsCount ?? 0) > 0 && (
                              <div className="px-4 py-2.5 bg-amber-500/5 border-t border-amber-500/20 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <p className="text-xs text-amber-300">{reraResultData.complaintsCount} complaint(s) on record. Buyers may see this.</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {reraStatus === 'pending_manual' && (
                          <motion.div
                            key="pending"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-amber-300">Queued for Manual Verification</p>
                                <p className="text-xs text-amber-400/80 mt-1">
                                  We couldn't auto-verify this number from the portal right now (may be due to portal downtime).
                                  Your property will be submitted with <strong>rera_verified: false</strong> and our team will
                                  manually verify within 24 hours before the listing goes live.
                                </p>
                                {reraResultData?.projectName && (
                                  <p className="text-xs text-slate-400 mt-2">Project on record: <span className="text-white">{reraResultData.projectName}</span></p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {reraStatus === 'failed' && (
                          <motion.div
                            key="failed"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="border border-red-500/30 bg-red-500/5 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-red-300">Verification Failed</p>
                                <p className="text-xs text-red-400/80 mt-1">
                                  No matching registration found for <span className="font-mono text-red-300">{reraInputNumber.toUpperCase()}</span> in {reraState}.
                                  Please double-check the number format and try again.
                                </p>
                                <a
                                  href="https://rera.tn.gov.in"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Look up on {reraState} RERA portal
                                </a>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* OC / CC below the RERA block */}
                      {(reraStatus === 'verified' || reraStatus === 'pending_manual') && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-700/40"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                              Occupancy Certificate No. <span className="text-slate-600">(optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.oc_certificate}
                              onChange={(e) => setFormData((prev) => ({ ...prev, oc_certificate: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                              placeholder="OC/2024/XXXXX"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                              Completion Certificate No. <span className="text-slate-600">(optional)</span>
                            </label>
                            <input
                              type="text"
                              value={formData.cc_certificate}
                              onChange={(e) => setFormData((prev) => ({ ...prev, cc_certificate: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                              placeholder="CC/2024/XXXXX"
                            />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* ── RERA Not Applicable flow ─────────────────────── */}
                {reraHasRera === false && (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="no-rera"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Reason for Exemption <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { value: 'under_construction', label: 'Under Construction', desc: 'Project is ongoing — RERA applied for' },
                            { value: 'plot_sale', label: 'Plot / Land Sale', desc: 'Plots below threshold area are exempt' },
                            { value: 'small_project', label: 'Small Project', desc: 'Less than 8 units or 500 sq m plot' },
                            { value: 'government_project', label: 'Govt. / Authority Project', desc: 'Developed by state housing board' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setReraExemptReason(opt.value)}
                              className={`text-left p-3 rounded-xl border-2 transition-all ${
                                reraExemptReason === opt.value
                                  ? 'border-slate-400 bg-slate-700/60 text-white'
                                  : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:border-slate-600'
                              }`}
                            >
                              <p className="text-sm font-semibold">{opt.label}</p>
                              <p className="text-xs mt-0.5 opacity-70">{opt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {reraExemptReason && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-start gap-3 p-4 bg-slate-700/30 border border-slate-600/40 rounded-xl"
                        >
                          <input
                            type="checkbox"
                            id="exempt-ack"
                            checked={reraExemptAcknowledged}
                            onChange={(e) => setReraExemptAcknowledged(e.target.checked)}
                            className="w-4 h-4 mt-0.5 accent-amber-500 flex-shrink-0 cursor-pointer"
                          />
                          <label htmlFor="exempt-ack" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                            I declare that this property is exempt from RERA registration as per the
                            Real Estate (Regulation and Development) Act, 2016. I understand that
                            providing false information is a punishable offence and the listing may
                            be removed if found non-compliant.
                          </label>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* Validation error */}
                {errors.rera && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-300">{errors.rera}</p>
                  </motion.div>
                )}

                {/* Info note */}
                <div className="flex items-start gap-2 p-3 bg-slate-800/40 border border-slate-700/40 rounded-lg">
                  <BadgeCheck className="w-4 h-4 text-amber-400/70 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    RERA-verified properties get a trust badge on Tharaga and rank higher in search results.
                    Verification happens live against the official state RERA portal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Additional Metadata */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Additional Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Construction Year</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear() + 5}
                      value={formData.property_metadata?.construction_year || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            construction_year: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-slate-300">Possession Date</label>
                    <input
                      type="date"
                      value={formData.property_metadata?.possession_date || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            possession_date: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vastu_compliant"
                      checked={formData.property_metadata?.vastu_compliant || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          property_metadata: {
                            ...prev.property_metadata,
                            vastu_compliant: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-amber-500"
                    />
                    <label htmlFor="vastu_compliant" className="text-sm font-medium text-slate-300">
                      Vastu Compliant
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Message - Billing Design System */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-rose-500/20 border border-rose-400/50 rounded-lg flex items-center gap-2 text-rose-100"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{errors.submit}</p>
        </motion.div>
      )}

      {/* Navigation Buttons - Billing Design System */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
        <button
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={loading}
          className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white disabled:opacity-50 flex items-center gap-2 transition-all duration-300 border border-slate-600/50"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        <div className="flex gap-4">
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 font-semibold rounded-lg disabled:opacity-50 flex items-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 glow-border"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Property
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

