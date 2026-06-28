'use client';

import { motion } from 'framer-motion';
import { Users, Building, Home, Mail, DollarSign, TrendingDown } from 'lucide-react';

interface Props {
  totalBuilders: number;
  totalBuyers: number;
  totalProperties: number;
  totalLeads: number;
  mrr: number;
  churnRate: number;
}

export function MetricsGrid({
  totalBuilders,
  totalBuyers,
  totalProperties,
  totalLeads,
  mrr,
  churnRate
}: Props) {
  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const metrics = [
    {
      label: 'Total Builders',
      value: totalBuilders,
      change: '+12%',
      changeType: 'positive' as const,
      icon: Building,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Total Buyers',
      value: totalBuyers,
      change: '+28%',
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      label: 'Properties Listed',
      value: totalProperties,
      change: '+15%',
      changeType: 'positive' as const,
      icon: Home,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Total Leads',
      value: totalLeads,
      change: '+34%',
      changeType: 'positive' as const,
      icon: Mail,
      color: 'from-amber-500 to-amber-600'
    },
    {
      label: 'Monthly Revenue (MRR)',
      value: formatCurrency(mrr),
      change: '+22%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      label: 'Churn Rate',
      value: `${churnRate}%`,
      change: '-2%',
      changeType: 'positive' as const,
      icon: TrendingDown,
      color: 'from-red-500 to-red-600'
    }
  ];

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN');
    }
    return value;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl shadow-sm p-6 hover:border-gray-700 transition-all"
        >
          <div className={`w-12 h-12 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center mb-4`}>
            <metric.icon className="w-6 h-6 text-white" />
          </div>

          <div className="text-3xl font-bold text-gray-100 mb-1">
            {formatValue(metric.value)}
          </div>

          <div className="text-sm text-gray-400 mb-2">
            {metric.label}
          </div>

          <div className={`text-xs font-medium ${
            metric.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {metric.change} vs last month
          </div>
        </motion.div>
      ))}
    </div>
  );
}

