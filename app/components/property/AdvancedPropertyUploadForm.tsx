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
} from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [propertyId, setPropertyId] = useState<string | null>(null);

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
      case 7:
      case 8:
        // Optional steps
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
      
      if (onSuccess) {
        onSuccess(data.propertyId);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setErrors({ submit: error.message || 'Failed to upload property. Please try again.' });
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

  // Common amenities list
  const commonAmenities = [
    'Swimming Pool', 'Gym', 'Park', 'Security', 'Power Backup', 'Lift',
    'Parking', 'Clubhouse', 'Playground', 'Garden', 'WiFi', 'CCTV',
    'Water Supply', 'Rainwater Harvesting', 'Solar Power', 'Waste Management',
  ];

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Property Uploaded Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your property has been uploaded and is pending verification.
          </p>
          {propertyId && (
            <p className="text-sm text-gray-500 mb-6">Property ID: {propertyId}</p>
          )}
          <div className="flex gap-4 justify-center">
            <button
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Another Property
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
          <div
            key={step}
            className={`flex-1 mx-1 h-2 rounded ${
              step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Home className="w-6 h-6" />
                  Basic Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Property Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Luxury 3BHK Apartment in Prime Location"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your property..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, project: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Green Valley Residency"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Property Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.property_type}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            property_type: e.target.value as any,
                          }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Apartment">Apartment</option>
                        <option value="Villa">Villa</option>
                        <option value="Plot">Plot</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>

                    {formData.property_type === 'Apartment' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">BHK Type</label>
                        <select
                          value={formData.bhk_type || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              bhk_type: e.target.value as any,
                            }))
                          }
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Property Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bedrooms</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bathrooms</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Carpet Area (sqft)</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Built-up Area (sqft)</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Super Built-up Area (sqft)</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Plot Area (sqft)</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Floor Number</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Total Floors</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Facing</label>
                    <select
                      value={formData.facing || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, facing: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium mb-2">Parking Slots</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Furnishing Status</label>
                    <select
                      value={formData.furnishing_status || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          furnishing_status: e.target.value as any,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Location
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bangalore"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Locality</label>
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, locality: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Whitefield"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Karnataka"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, address: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Full address..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Pincode</label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, pincode: e.target.value }))
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Pricing
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price (INR) <span className="text-red-500">*</span>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="5000000"
                    />
                    {errors.price_inr && (
                      <p className="text-red-500 text-sm mt-1">{errors.price_inr}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Price per sqft</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-4 h-4"
                    />
                    <label htmlFor="negotiable" className="text-sm font-medium">
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
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-6 h-6" />
                  Media
                </h2>
                <div className="space-y-6">
                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Property Images <span className="text-red-500">*</span>
                    </label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition block">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to select images
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, WebP (max 10MB each)
                      </p>
                    </label>
                    {errors.images && (
                      <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                    )}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={img}
                              alt={`Property ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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
                    <label className="block text-sm font-medium mb-2">Property Videos</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition block">
                      <input
                        type="file"
                        accept="video/mp4,video/mov,video/webm"
                        multiple
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                      <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to select videos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, MOV, WebM (max 50MB each)
                      </p>
                    </label>
                    {formData.videos.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.videos.map((video, index) => (
                          <div key={index} className="relative">
                            <video
                              src={video}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                            />
                            <button
                              onClick={() => removeVideo(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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
                    <label className="block text-sm font-medium mb-2">Floor Plans</label>
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition block">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        multiple
                        onChange={handleFloorPlanChange}
                        className="hidden"
                      />
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to select floor plans
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPEG, PNG, PDF (max 10MB each)
                      </p>
                    </label>
                    {formData.floor_plan_images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {formData.floor_plan_images.map((plan, index) => (
                          <div key={index} className="relative">
                            <img
                              src={plan}
                              alt={`Floor Plan ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeFloorPlan(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
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
                    <label className="block text-sm font-medium mb-2">Virtual Tour URL</label>
                    <input
                      type="url"
                      value={formData.virtual_tour_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, virtual_tour_url: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                <h2 className="text-2xl font-bold mb-4">Amenities & Features</h2>
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
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Documents */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Documents & Certificates
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">RERA ID</label>
                    <input
                      type="text"
                      value={formData.rera_id}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rera_id: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., PRM/KA/RERA/1251/308/PR/171021/004234"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rera_verified"
                      checked={formData.rera_verified}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, rera_verified: e.target.checked }))
                      }
                      className="w-4 h-4"
                    />
                    <label htmlFor="rera_verified" className="text-sm font-medium">
                      RERA Verified
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">RERA Certificate URL</label>
                    <input
                      type="url"
                      value={formData.rera_certificate_url}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          rera_certificate_url: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Occupancy Certificate</label>
                    <input
                      type="text"
                      value={formData.oc_certificate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, oc_certificate: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="OC Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Completion Certificate</label>
                    <input
                      type="text"
                      value={formData.cc_certificate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, cc_certificate: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="CC Number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Approved Plan URL</label>
                    <input
                      type="url"
                      value={formData.approved_plan_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, approved_plan_url: e.target.value }))
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Additional Metadata */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Additional Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Construction Year</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Possession Date</label>
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-4 h-4"
                    />
                    <label htmlFor="vastu_compliant" className="text-sm font-medium">
                      Vastu Compliant
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Error Message */}
      {errors.submit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{errors.submit}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={loading}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </button>

        <div className="flex gap-4">
          {currentStep < TOTAL_STEPS ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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

