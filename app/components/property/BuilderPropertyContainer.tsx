'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Building2, Sparkles } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyCard } from './PropertyCard';
import { cn } from '@/lib/utils';

interface BuilderGroup {
  builderId: string;
  builderName: string;
  builderLogo?: string;
  builderVerified: boolean;
  properties: Property[];
}

interface BuilderPropertyContainerProps {
  properties: Property[];
  defaultExpanded?: boolean; // If true, all builders expanded by default when filters applied
}

/**
 * Builder Property Container
 * Groups properties by builder with collapse/expand functionality
 * When filters are applied, shows matching properties collapsed under each builder
 */
export function BuilderPropertyContainer({ 
  properties, 
  defaultExpanded = false 
}: BuilderPropertyContainerProps) {
  const [expandedBuilders, setExpandedBuilders] = useState<Set<string>>(new Set());

  // Group properties by builder
  const builderGroups = useMemo<BuilderGroup[]>(() => {
    const groupsMap = new Map<string, BuilderGroup>();

    properties.forEach(property => {
      const builderId = property.builder_id || 'unknown';
      const builderName = property.builder?.company_name || 'Unknown Builder';
      const builderLogo = property.builder?.logo_url;
      const builderVerified = property.builder?.verified || false;

      if (!groupsMap.has(builderId)) {
        groupsMap.set(builderId, {
          builderId,
          builderName,
          builderLogo,
          builderVerified,
          properties: [],
        });
      }

      groupsMap.get(builderId)!.properties.push(property);
    });

    // Sort by property count (descending)
    return Array.from(groupsMap.values()).sort(
      (a, b) => b.properties.length - a.properties.length
    );
  }, [properties]);

  // Initialize expanded state
  useMemo(() => {
    if (defaultExpanded) {
      // When filters applied, expand all builders by default
      setExpandedBuilders(new Set(builderGroups.map(g => g.builderId)));
    } else {
      // Default: expand first builder only
      if (builderGroups.length > 0 && expandedBuilders.size === 0) {
        setExpandedBuilders(new Set([builderGroups[0].builderId]));
      }
    }
  }, [defaultExpanded, builderGroups.length]);

  const toggleBuilder = (builderId: string) => {
    setExpandedBuilders(prev => {
      const next = new Set(prev);
      if (next.has(builderId)) {
        next.delete(builderId);
      } else {
        next.add(builderId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedBuilders(new Set(builderGroups.map(g => g.builderId)));
  };

  const collapseAll = () => {
    setExpandedBuilders(new Set());
  };

  const allExpanded = expandedBuilders.size === builderGroups.length;
  const allCollapsed = expandedBuilders.size === 0;

  if (builderGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 text-lg">No properties found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      {builderGroups.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-slate-300">
            Showing properties from <span className="font-semibold text-amber-300">{builderGroups.length}</span> builders
          </div>
          <div className="flex gap-2">
            {!allExpanded && (
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30 transition-colors"
              >
                Expand All
              </button>
            )}
            {!allCollapsed && (
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700/70 transition-colors"
              >
                Collapse All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Builder Groups */}
      {builderGroups.map((group, index) => {
        const isExpanded = expandedBuilders.has(group.builderId);
        const propertyCount = group.properties.length;

        return (
          <motion.div
            key={group.builderId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border-2 border-amber-300/20 overflow-hidden hover:border-amber-300/40 transition-all duration-300"
          >
            {/* Builder Header */}
            <button
              onClick={() => toggleBuilder(group.builderId)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Builder Logo/Icon */}
                <div className="relative">
                  {group.builderLogo ? (
                    <img
                      src={group.builderLogo}
                      alt={group.builderName}
                      className="w-12 h-12 rounded-lg object-cover border-2 border-amber-300/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center border-2 border-amber-300/30">
                      <Building2 className="w-6 h-6 text-slate-900" />
                    </div>
                  )}
                  {group.builderVerified && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Builder Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {group.builderName}
                    </h3>
                    {group.builderVerified && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-green-500/20 text-green-300 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                  </p>
                </div>

                {/* Property Count Badge */}
                <div className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full text-sm font-semibold">
                  {propertyCount}
                </div>
              </div>

              {/* Expand/Collapse Icon */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="ml-4"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-amber-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-amber-300 transition-colors" />
                )}
              </motion.div>
            </button>

            {/* Properties Grid - Collapsible */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-6 py-6 bg-slate-900/30 border-t border-amber-300/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {group.properties.map((property) => (
                        <PropertyCard key={property.id} property={property} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}





