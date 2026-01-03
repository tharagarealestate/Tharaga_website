/**
 * Advanced Property Upload API
 * Supports multi-step uploads, admin uploads on behalf of builders, and comprehensive validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { secureApiRoute } from '@/lib/security/api-security';
import { Permissions } from '@/lib/security/permissions';
import { AuditActions, AuditResourceTypes } from '@/lib/security/audit';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for advanced upload

// Comprehensive property upload schema
const advancedPropertyUploadSchema = z.object({
  // Basic Information
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').optional(),
  project: z.string().optional(),
  
  // Property Details
  property_type: z.enum(['Apartment', 'Villa', 'Plot', 'Commercial']),
  bhk_type: z.enum(['1RK', '1BHK', '2BHK', '3BHK', '4BHK', '5BHK+']).optional(),
  bedrooms: z.number().int().min(0).max(10).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  sqft: z.number().int().positive().optional(),
  carpet_area: z.number().optional(),
  builtup_area: z.number().optional(),
  super_buildup_area: z.number().optional(),
  plot_area: z.number().optional(),
  
  // Location
  city: z.string().min(2),
  locality: z.string().optional(),
  state: z.string().optional(),
  address: z.string().optional(),
  pincode: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  
  // Pricing
  price_inr: z.number().positive(),
  price_per_sqft: z.number().optional(),
  negotiable: z.boolean().default(true),
  base_price: z.number().optional(),
  
  // Status & Availability
  listing_status: z.enum(['active', 'inactive', 'sold', 'rented', 'pending']).default('pending'),
  listing_type: z.enum(['sale', 'rent']).default('sale'),
  availability_status: z.enum(['available', 'sold', 'under-offer', 'reserved']).default('available'),
  possession_status: z.enum(['ready-to-move', 'under-construction']).optional(),
  
  // Furnishing & Features
  furnishing_status: z.enum(['unfurnished', 'semi-furnished', 'fully-furnished']).optional(),
  facing: z.string().optional(),
  floor: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  parking: z.number().int().min(0).optional(),
  balcony_count: z.number().int().min(0).optional(),
  
  // Media
  images: z.array(z.string().url()).min(1, 'At least one image is required'),
  videos: z.array(z.string().url()).optional(),
  floor_plan_images: z.array(z.string().url()).optional(),
  virtual_tour_url: z.string().url().optional(),
  
  // Amenities
  amenities: z.array(z.string()).optional(),
  
  // Documents & Certificates
  rera_id: z.string().optional(),
  rera_verified: z.boolean().default(false),
  rera_certificate_url: z.string().url().optional(),
  oc_certificate: z.string().optional(),
  cc_certificate: z.string().optional(),
  approved_plan_url: z.string().url().optional(),
  
  // Metadata (from spec)
  property_metadata: z.object({
    rera_number: z.string().optional(),
    completion_certificate: z.boolean().optional(),
    occupancy_certificate: z.boolean().optional(),
    approved_by: z.array(z.string()).optional(),
    construction_year: z.number().int().optional(),
    possession_date: z.string().optional(),
    parking_slots: z.number().int().optional(),
    facing: z.string().optional(),
    floor_number: z.number().int().optional(),
    total_floors: z.number().int().optional(),
    furnished_status: z.string().optional(),
    water_source: z.array(z.string()).optional(),
    power_backup: z.string().optional(),
    security_features: z.array(z.string()).optional(),
    green_features: z.array(z.string()).optional(),
    vastu_compliant: z.boolean().optional(),
  }).optional(),
  
  location_intelligence: z.object({
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    nearby_metro_stations: z.array(z.object({
      name: z.string(),
      distance_km: z.number(),
      line: z.string(),
    })).optional(),
    nearby_schools: z.array(z.object({
      name: z.string(),
      distance_km: z.number(),
      rating: z.number().optional(),
    })).optional(),
    nearby_hospitals: z.array(z.object({
      name: z.string(),
      distance_km: z.number(),
    })).optional(),
    nearby_malls: z.array(z.object({
      name: z.string(),
      distance_km: z.number(),
    })).optional(),
    connectivity_score: z.number().min(0).max(100).optional(),
    livability_score: z.number().min(0).max(100).optional(),
  }).optional(),
  
  // Admin upload fields
  uploaded_for_builder_id: z.string().uuid().optional(), // Builder ID when admin uploads
  upload_source: z.enum(['builder_direct', 'admin_on_behalf', 'api_import', 'bulk_upload']).default('builder_direct'),
  
  // Verification
  verification_status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'requires_changes']).default('pending'),
  verification_notes: z.string().optional(),
});

/**
 * POST /api/properties/upload-advanced
 * Advanced property upload with admin support
 */
export const POST = secureApiRoute(
  async (request: NextRequest, user) => {
    const supabase = getSupabase();
    const body = await request.json();
    const validatedData = advancedPropertyUploadSchema.parse(body);
    
    // Check if user is admin uploading for a builder
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const isAdmin = userProfile?.role === 'admin';
    let targetBuilderId: string | null = null;
    
    if (isAdmin && validatedData.uploaded_for_builder_id) {
      // Admin uploading for a builder - verify assignment
      const { data: assignment } = await supabase
        .from('admin_builder_assignments')
        .select('*')
        .eq('admin_user_id', user.id)
        .eq('builder_id', validatedData.uploaded_for_builder_id)
        .eq('is_active', true)
        .single();
      
      if (!assignment) {
        return NextResponse.json(
          { error: 'You are not assigned to manage this builder' },
          { status: 403 }
        );
      }
      
      // Check permissions
      const permissions = assignment.permissions as any;
      if (!permissions?.upload_properties) {
        return NextResponse.json(
          { error: 'You do not have permission to upload properties for this builder' },
          { status: 403 }
        );
      }
      
      targetBuilderId = validatedData.uploaded_for_builder_id;
    } else if (isAdmin && !validatedData.uploaded_for_builder_id) {
      return NextResponse.json(
        { error: 'Admin must specify builder_id when uploading' },
        { status: 400 }
      );
    } else {
      // Builder uploading for themselves
      // Get builder_id from user's builder profile
      const { data: builderProfile } = await supabase
        .from('builder_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();
      
      if (!builderProfile) {
        return NextResponse.json(
          { error: 'Builder profile not found' },
          { status: 404 }
        );
      }
      
      // Get builder ID from builders table
      const { data: builder } = await supabase
        .from('builders')
        .select('id')
        .eq('id', user.id) // Assuming builder.id matches user.id
        .single();
      
      if (!builder) {
        return NextResponse.json(
          { error: 'Builder not found' },
          { status: 404 }
        );
      }
      
      targetBuilderId = builder.id;
    }
    
    // Prepare property data
    const propertyData: any = {
      builder_id: targetBuilderId,
      title: validatedData.title,
      description: validatedData.description,
      project: validatedData.project,
      property_type: validatedData.property_type,
      bhk_type: validatedData.bhk_type,
      bedrooms: validatedData.bedrooms,
      bathrooms: validatedData.bathrooms,
      sqft: validatedData.sqft,
      carpet_area: validatedData.carpet_area,
      builtup_area: validatedData.builtup_area,
      super_buildup_area: validatedData.super_buildup_area,
      plot_area: validatedData.plot_area,
      city: validatedData.city,
      locality: validatedData.locality,
      state: validatedData.state,
      address: validatedData.address,
      pincode: validatedData.pincode,
      lat: validatedData.lat,
      lng: validatedData.lng,
      price_inr: validatedData.price_inr,
      price_per_sqft: validatedData.price_per_sqft,
      negotiable: validatedData.negotiable,
      base_price: validatedData.base_price,
      listing_status: validatedData.listing_status,
      listing_type: validatedData.listing_type,
      availability_status: validatedData.availability_status,
      possession_status: validatedData.possession_status,
      furnishing_status: validatedData.furnishing_status,
      facing: validatedData.facing,
      floor: validatedData.floor,
      total_floors: validatedData.total_floors,
      parking: validatedData.parking,
      balcony_count: validatedData.balcony_count,
      images: validatedData.images,
      videos: validatedData.videos || [],
      floor_plan_images: validatedData.floor_plan_images || [],
      virtual_tour_url: validatedData.virtual_tour_url,
      amenities: validatedData.amenities || [],
      rera_id: validatedData.rera_id,
      rera_verified: validatedData.rera_verified,
      rera_certificate_url: validatedData.rera_certificate_url,
      oc_certificate: validatedData.oc_certificate,
      cc_certificate: validatedData.cc_certificate,
      approved_plan_url: validatedData.approved_plan_url,
      property_metadata: validatedData.property_metadata || {},
      location_intelligence: validatedData.location_intelligence || {},
      
      // Upload tracking
      uploaded_by_admin: isAdmin,
      admin_user_id: isAdmin ? user.id : null,
      upload_source: validatedData.upload_source,
      verification_status: validatedData.verification_status,
      verification_notes: validatedData.verification_notes,
    };
    
    // Insert property
    const { data: property, error: insertError } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();
    
    if (insertError || !property) {
      console.error('[Advanced Property Upload] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save property', details: insertError?.message },
        { status: 500 }
      );
    }
    
    // Create upload log
    const uploadLogData = {
      property_id: property.id,
      uploaded_by: user.id,
      uploaded_for_builder_id: targetBuilderId,
      upload_source: validatedData.upload_source,
      upload_method: 'web_form',
      files_uploaded_count: validatedData.images.length + (validatedData.videos?.length || 0),
      images_processed_count: validatedData.images.length,
      videos_processed_count: validatedData.videos?.length || 0,
      processing_status: 'completed',
      validation_passed: true,
      upload_started_at: new Date().toISOString(),
      upload_completed_at: new Date().toISOString(),
    };
    
    await supabase
      .from('property_upload_logs')
      .insert([uploadLogData])
      .catch(err => {
        console.error('[Advanced Property Upload] Log creation error:', err);
        // Non-critical
      });
    
    return NextResponse.json({
      success: true,
      message: isAdmin 
        ? `Property uploaded successfully on behalf of builder. Property ID: ${property.id}`
        : 'Property uploaded successfully',
      propertyId: property.id,
      property: {
        id: property.id,
        title: property.title,
        verification_status: property.verification_status,
      },
    }, { status: 200 });
  },
  {
    requireAuth: true,
    requireRole: ['builder', 'admin'],
    requirePermission: Permissions.PROPERTY_CREATE,
    rateLimit: 'strict',
    validateSchema: advancedPropertyUploadSchema,
    auditAction: AuditActions.PROPERTY_CREATE,
    auditResourceType: AuditResourceTypes.PROPERTY
  }
);








