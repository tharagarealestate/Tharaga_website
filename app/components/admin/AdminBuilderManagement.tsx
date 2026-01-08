"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Home,
  TrendingUp,
  Eye,
} from 'lucide-react';
import { AdvancedPropertyUploadForm } from '@/components/property/AdvancedPropertyUploadForm';

interface Builder {
  id: string;
  name: string;
  email: string;
  phone: string;
  logo_url?: string;
  total_properties: number;
  active_properties: number;
  total_leads: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
}

interface AdminBuilderAssignment {
  id: string;
  builder_id: string;
  builder: Builder;
  permissions: {
    upload_properties: boolean;
    edit_properties: boolean;
    view_analytics: boolean;
    manage_leads: boolean;
  };
  is_active: boolean;
  assigned_at: string;
}

export function AdminBuilderManagement() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [assignments, setAssignments] = useState<AdminBuilderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadBuilderId, setUploadBuilderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  useEffect(() => {
    loadBuilders();
    loadAssignments();
  }, []);

  const loadBuilders = async () => {
    try {
      const response = await fetch('/api/admin/builders');
      const data = await response.json();
      if (data.builders) {
        setBuilders(data.builders);
      }
    } catch (error) {
      console.error('Error loading builders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/admin/builder-assignments');
      const data = await response.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const handleAssignBuilder = async (builderId: string) => {
    try {
      const response = await fetch('/api/admin/builder-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          builder_id: builderId,
          permissions: {
            upload_properties: true,
            edit_properties: true,
            view_analytics: true,
            manage_leads: true,
          },
        }),
      });

      if (response.ok) {
        loadAssignments();
      }
    } catch (error) {
      console.error('Error assigning builder:', error);
    }
  };

  const handleUploadProperty = (builderId: string) => {
    setUploadBuilderId(builderId);
    setShowUploadForm(true);
  };

  const filteredBuilders = builders.filter((builder) => {
    const matchesSearch =
      builder.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      builder.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter =
      filterStatus === 'all' || builder.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getAssignedBuilder = (builderId: string) => {
    return assignments.find((a) => a.builder_id === builderId && a.is_active);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Builder Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage builders and upload properties on their behalf
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Upload Property
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search builders by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Builders List */}
      <div className="grid gap-4">
        {filteredBuilders.map((builder) => {
          const assignment = getAssignedBuilder(builder.id);
          const isAssigned = !!assignment;

          return (
            <motion.div
              key={builder.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Builder Logo */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {builder.logo_url ? (
                      <img
                        src={builder.logo_url}
                        alt={builder.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Builder Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{builder.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          builder.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : builder.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {builder.status}
                      </span>
                      {isAssigned && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Assigned
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {builder.email} • {builder.phone}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>
                          {builder.active_properties} / {builder.total_properties} Properties
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{builder.total_leads} Leads</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          {builder.total_properties > 0
                            ? Math.round((builder.active_properties / builder.total_properties) * 100)
                            : 0}
                          % Active
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {isAssigned ? (
                    <>
                      <button
                        onClick={() => handleUploadProperty(builder.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Property
                      </button>
                      <button className="p-2 border rounded-lg hover:bg-gray-50">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAssignBuilder(builder.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Assign to Me
                    </button>
                  )}
                </div>
              </div>

              {/* Assignment Details */}
              {isAssigned && assignment && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600">
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Permissions:</span>
                        {assignment.permissions.upload_properties && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Upload
                          </span>
                        )}
                        {assignment.permissions.edit_properties && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Edit
                          </span>
                        )}
                        {assignment.permissions.view_analytics && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Analytics
                          </span>
                        )}
                        {assignment.permissions.manage_leads && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            Leads
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {filteredBuilders.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No builders found</p>
        </div>
      )}

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Upload Property
                {uploadBuilderId && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    for {builders.find((b) => b.id === uploadBuilderId)?.name}
                  </span>
                )}
              </h2>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadBuilderId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <AdvancedPropertyUploadForm
                builderId={uploadBuilderId || undefined}
                onSuccess={(propertyId) => {
                  setShowUploadForm(false);
                  setUploadBuilderId(null);
                  alert(`Property ${propertyId} uploaded successfully!`);
                }}
                onCancel={() => {
                  setShowUploadForm(false);
                  setUploadBuilderId(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}























