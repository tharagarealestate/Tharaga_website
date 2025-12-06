'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Folder, FolderPlus, Plus, Trash2, Edit3,
  TrendingDown, TrendingUp, Minus, MapPin, MoreVertical, Star,
  X, Check, ArrowRight, Grid3X3, List
} from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import Image from 'next/image';
import Link from 'next/link';

interface SavedProperty {
  id: string;
  property_id: string;
  saved_at: string;
  notes: string | null;
  priority: number;
  folder_name: string;
  price_at_save: number;
  current_price: number;
  price_change_percent: number;
  view_count: number;
  last_viewed_at: string | null;
  property: {
    id: string;
    title: string;
    locality: string;
    city: string;
    price: number;
    sqft: number;
    bedrooms: number;
    images: string[];
    status: string;
  };
}

interface Folder {
  name: string;
  count: number;
  color: string;
}

export default function SavedProperties() {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>('All Saved');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const { supabase } = useSupabase();

  // Folder colors
  const FOLDER_COLORS = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];

  // Fetch saved properties
  const fetchSaved = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          *,
          property:properties (
            id, title, locality, city, price, sqft, bedrooms, images, status
          )
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedProperties(data || []);

      // Calculate folders
      const folderMap = new Map<string, number>();
      data?.forEach(item => {
        const count = folderMap.get(item.folder_name) || 0;
        folderMap.set(item.folder_name, count + 1);
      });

      const folderList: Folder[] = [
        { name: 'All Saved', count: data?.length || 0, color: FOLDER_COLORS[0] }
      ];

      let colorIndex = 1;
      folderMap.forEach((count, name) => {
        if (name !== 'All Saved') {
          folderList.push({
            name,
            count,
            color: FOLDER_COLORS[colorIndex % FOLDER_COLORS.length]
          });
          colorIndex++;
        }
      });

      setFolders(folderList);
    } catch (err) {
      console.error('Error fetching saved:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  // Real-time subscription
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('favorites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_favorites',
        },
        () => {
          fetchSaved();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchSaved]);

  // Create new folder
  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setFolders(prev => [
      ...prev,
      {
        name: newFolderName.trim(),
        count: 0,
        color: FOLDER_COLORS[prev.length % FOLDER_COLORS.length]
      }
    ]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  // Move to folder
  const moveToFolder = async (propertyId: string, folderName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_favorites')
      .update({ folder_name: folderName })
      .eq('user_id', user.id)
      .eq('property_id', propertyId);
    fetchSaved();
  };

  // Toggle priority
  const togglePriority = async (saved: SavedProperty) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newPriority = saved.priority === 2 ? 0 : saved.priority + 1;
    await supabase
      .from('user_favorites')
      .update({ priority: newPriority })
      .eq('id', saved.id);
    setSavedProperties(prev =>
      prev.map(s => s.id === saved.id ? { ...s, priority: newPriority } : s)
    );
  };

  // Update note
  const updateNote = async (savedId: string) => {
    await supabase
      .from('user_favorites')
      .update({ notes: tempNote })
      .eq('id', savedId);
    setSavedProperties(prev =>
      prev.map(s => s.id === savedId ? { ...s, notes: tempNote } : s)
    );
    setEditingNote(null);
    setTempNote('');
  };

  // Remove saved
  const removeSaved = async (savedId: string) => {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('id', savedId);
    setSavedProperties(prev => prev.filter(s => s.id !== savedId));
    fetchSaved();
  };

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(0)}L`;
    return `₹${price.toLocaleString('en-IN')}`;
  };

  // Get price change indicator
  const getPriceChange = (change: number) => {
    if (change < -1) {
      return (
        <span className="flex items-center gap-1 text-green-400 text-xs">
          <TrendingDown className="w-3.5 h-3.5" />
          {Math.abs(change).toFixed(1)}% down
        </span>
      );
    } else if (change > 1) {
      return (
        <span className="flex items-center gap-1 text-red-400 text-xs">
          <TrendingUp className="w-3.5 h-3.5" />
          {change.toFixed(1)}% up
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-gray-500 text-xs">
        <Minus className="w-3.5 h-3.5" />
        No change
      </span>
    );
  };

  // Filter properties by folder
  const filteredProperties = activeFolder === 'All Saved'
    ? savedProperties
    : savedProperties.filter(s => s.folder_name === activeFolder);

  // Priority badge
  const getPriorityBadge = (priority: number) => {
    if (priority === 2) {
      return (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full
          bg-gradient-to-r from-[#D4AF37] to-[#F0D78C]
          text-slate-900 text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Top Pick
        </div>
      );
    }
    if (priority === 1) {
      return (
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full
          bg-blue-500/80 text-white text-xs font-medium">
          High Priority
        </div>
      );
    }
    return null;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 w-32 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-500/5
            border border-rose-500/30">
            <Heart className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Your Saved Properties</h2>
            <p className="text-sm text-gray-400">{savedProperties.length} properties saved</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folder Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {folders.map((folder) => (
          <motion.button
            key={folder.name}
            onClick={() => setActiveFolder(folder.name)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full
              whitespace-nowrap text-sm font-medium
              transition-all duration-300
              ${activeFolder === folder.name
                ? 'bg-gradient-to-r ' + folder.color + ' text-white shadow-lg'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Folder className="w-4 h-4" />
            <span>{folder.name}</span>
            <span className={`
              px-2 py-0.5 rounded-full text-xs
              ${activeFolder === folder.name
                ? 'bg-white/20'
                : 'bg-white/10'
              }
            `}>
              {folder.count}
            </span>
          </motion.button>
        ))}

        {/* Add Folder Button */}
        <AnimatePresence mode="wait">
          {showNewFolder ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20
                  text-white text-sm placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]
                  w-40"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              />
              <button
                onClick={createFolder}
                className="p-2 rounded-full bg-emerald-500/20 text-emerald-400
                  hover:bg-emerald-500/30 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
                className="p-2 rounded-full bg-white/5 text-gray-400
                  hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowNewFolder(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full
                border border-dashed border-white/20 text-gray-400
                hover:border-white/30 hover:text-gray-300 transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              <span className="text-sm">New Folder</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProperties.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-2xl backdrop-blur-xl bg-white/[0.04] border border-white/10 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-500/10
            flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {activeFolder === 'All Saved' ? 'No Saved Properties' : `No properties in "${activeFolder}"`}
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            {activeFolder === 'All Saved'
              ? 'Start saving properties you like and they will appear here'
              : 'Move properties to this folder to organize your search'
            }
          </p>
          <Link
            href="/property-listing"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
              bg-gradient-to-r from-[#3A6FF8] to-[#6A5ACD]
              text-white font-semibold
              hover:shadow-lg hover:shadow-[#3A6FF8]/20
              transition-all"
          >
            Browse Properties
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Properties Grid/List */}
      {filteredProperties.length > 0 && (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
          : 'space-y-3'
        }>
          <AnimatePresence mode="popLayout">
            {filteredProperties.map((saved, index) => (
              <motion.div
                key={saved.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative rounded-2xl overflow-hidden
                  backdrop-blur-xl bg-white/[0.04] border border-white/10
                  hover:bg-white/[0.08] hover:border-white/20
                  transition-all duration-300 group
                  ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : ''}
                `}
              >
                {/* Property Image */}
                <div className={`relative overflow-hidden ${
                  viewMode === 'grid' ? 'h-40' : 'w-32 h-24 rounded-xl flex-shrink-0'
                }`}>
                  <Image
                    src={saved.property.images?.[0] || '/property1.jpg'}
                    alt={saved.property.title}
                    fill
                    className="object-cover transition-transform duration-500
                      group-hover:scale-110"
                  />

                  {/* Priority Badge */}
                  {viewMode === 'grid' && getPriorityBadge(saved.priority)}

                  {/* Status Overlay */}
                  {saved.property.status !== 'active' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm">
                        {saved.property.status === 'sold' ? 'Sold' : 'Not Available'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={viewMode === 'grid' ? 'p-4 space-y-3' : 'flex-1 py-1'}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/properties/${saved.property_id}`}
                        className="text-white font-semibold line-clamp-1 hover:text-[#D4AF37] transition-colors"
                      >
                        {saved.property.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-sm">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{saved.property.locality}, {saved.property.city}</span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative group/menu">
                      <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      <div className="absolute right-0 top-full mt-1 w-48 py-2
                        backdrop-blur-xl bg-slate-800/95 border border-white/10 rounded-xl
                        shadow-xl opacity-0 invisible group-hover/menu:opacity-100
                        group-hover/menu:visible transition-all z-10">
                        <button
                          onClick={() => togglePriority(saved)}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300
                            hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <Star className="w-4 h-4" />
                          {saved.priority === 2 ? 'Remove priority' : 'Mark as priority'}
                        </button>
                        <button
                          onClick={() => { setEditingNote(saved.id); setTempNote(saved.notes || ''); }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-300
                            hover:bg-white/5 hover:text-white flex items-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          {saved.notes ? 'Edit note' : 'Add note'}
                        </button>
                        <div className="border-t border-white/10 my-1" />
                        {folders.slice(1).map(folder => (
                          <button
                            key={folder.name}
                            onClick={() => moveToFolder(saved.property_id, folder.name)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300
                              hover:bg-white/5 hover:text-white flex items-center gap-2"
                          >
                            <Folder className="w-4 h-4" />
                            Move to {folder.name}
                          </button>
                        ))}
                        <div className="border-t border-white/10 my-1" />
                        <button
                          onClick={() => removeSaved(saved.id)}
                          className="w-full px-4 py-2 text-left text-sm text-red-400
                            hover:bg-red-500/10 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-[#D4AF37]">
                        {formatPrice(saved.property.price)}
                      </span>
                      <div className="mt-0.5">
                        {getPriceChange(saved.price_change_percent || 0)}
                      </div>
                    </div>

                    <div className="text-right text-sm text-gray-400">
                      <div>{saved.property.bedrooms} BHK</div>
                      <div>{saved.property.sqft?.toLocaleString() || 'N/A'} sqft</div>
                    </div>
                  </div>

                  {/* Note */}
                  {saved.notes && editingNote !== saved.id && (
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-sm text-gray-400 italic">"{saved.notes}"</p>
                    </div>
                  )}

                  {/* Edit Note */}
                  <AnimatePresence>
                    {editingNote === saved.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <textarea
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="Add a note..."
                          className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20
                            text-white text-sm placeholder-gray-500 resize-none
                            focus:outline-none focus:border-[#D4AF37]"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => { setEditingNote(null); setTempNote(''); }}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => updateNote(saved.id)}
                            className="px-3 py-1.5 text-sm rounded-lg bg-[#D4AF37] text-slate-900
                              font-medium hover:bg-[#F0D78C] transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

