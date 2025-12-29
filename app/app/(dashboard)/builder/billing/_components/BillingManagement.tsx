'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Zap,
  Crown,
  Rocket,
  Building2,
  Users,
  Mail,
  HardDrive,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Receipt,
  Clock,
  Sparkles
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  description: string;
  pricing: {
    monthly: { amount: number; display: string };
    quarterly?: { amount: number; display: string; savings: string };
    yearly: { amount: number; display: string; savings: string };
  };
  features: {
    properties_limit: number;
    leads_limit: number;
    email_quota: number;
    storage_gb: number;
    team_members_limit: number;
    [key: string]: any;
  };
  features_list: string[];
  popular?: boolean;
}

interface Subscription {
  id: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  amount: number;
  current_start: string;
  current_end: string;
  next_billing_at: string;
  properties_limit: number;
  leads_limit: number;
  email_quota: number;
  storage_gb: number;
  team_members_limit: number;
  properties_used: number;
  leads_generated: number;
  emails_sent: number;
  storage_used_gb: number;
  razorpay_subscription_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  pdf_url: string | null;
  line_items: any[];
  razorpay_payment_id: string | null;
}

export default function BillingManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const supabase = createClient();
  
  useEffect(() => {
    loadRazorpayScript();
    fetchBillingData();
  }, []);
  
  const loadRazorpayScript = () => {
    if (typeof window !== 'undefined' && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };
  
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: builder } = await supabase
        .from('builders')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!builder) throw new Error('Builder profile not found');
      
      // Fetch plans
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      setPlans(plansData.plans || []);
      
      // Fetch subscription
      const { data: sub, error: subError } = await supabase
        .from('billing_subscriptions')
        .select('*')
        .eq('builder_id', builder.id)
        .single();
      
      if (subError && subError.code !== 'PGRST116') {
        console.error('Subscription fetch error:', subError);
      }
      
      setSubscription(sub);
      
      // Fetch invoices
      if (sub) {
        const { data: invs } = await supabase
          .from('billing_invoices')
          .select('*')
          .eq('builder_id', builder.id)
          .order('invoice_date', { ascending: false })
          .limit(20);
        
        setInvoices(invs || []);
      }
      
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubscribe = async (planId: string) => {
    try {
      setProcessing(true);
      setError('');
      
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_type: planId,
          billing_cycle: billingCycle
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Subscription failed');
      }
      
      const { subscription_id, short_url } = await response.json();
      
      // Open Razorpay payment page
      if (short_url) {
        window.location.href = short_url;
      } else {
        throw new Error('Payment URL not received');
      }
      
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription?.id,
          reason: cancelReason
        })
      });
      
      if (!response.ok) {
        throw new Error('Cancellation failed');
      }
      
      await fetchBillingData();
      setShowCancelDialog(false);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };
  
  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download invoice');
    }
  };
  
  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };
  
  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
  };
  
  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return <Zap className="h-5 w-5" />;
      case 'professional': return <Crown className="h-5 w-5" />;
      case 'enterprise': return <Rocket className="h-5 w-5" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 flex items-center gap-2"
        >
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </motion.div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-300/20 pb-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'plans', label: 'Plans & Pricing' },
          { id: 'invoices', label: 'Invoices' },
          { id: 'usage', label: 'Usage Analytics' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-amber-300 border-b-2 border-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {subscription ? (
            <>
              {/* Current Plan Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/95 glow-border rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${
                      subscription.plan_type === 'starter' ? 'bg-blue-500/20' :
                      subscription.plan_type === 'professional' ? 'bg-purple-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {getPlanIcon(subscription.plan_type)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white capitalize">{subscription.plan_type} Plan</h3>
                      <p className="text-sm text-slate-400">
                        {subscription.billing_cycle === 'yearly' ? 'Annual' : 
                         subscription.billing_cycle === 'quarterly' ? 'Quarterly' : 'Monthly'} billing
                      </p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    subscription.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : subscription.status === 'cancelled'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Current Period</p>
                    <p className="font-medium text-white">
                      {new Date(subscription.current_start).toLocaleDateString('en-IN')} - {new Date(subscription.current_end).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Next Billing</p>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(subscription.next_billing_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-700/30 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Amount</p>
                    <p className="font-medium text-lg text-white flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(subscription.amount)}
                    </p>
                  </div>
                </div>
                
                {/* Usage Meters */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-white">Resource Usage</h4>
                  
                  {/* Properties */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-300">
                        <Building2 className="h-4 w-4" />
                        Properties
                      </span>
                      <span className="font-medium text-white">
                        {subscription.properties_used} / {subscription.properties_limit === -1 ? '∞' : subscription.properties_limit}
                      </span>
                    </div>
                    {subscription.properties_limit !== -1 && (
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscription.properties_used, subscription.properties_limit) >= 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscription.properties_used, subscription.properties_limit) >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${getUsagePercentage(subscription.properties_used, subscription.properties_limit)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Leads */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-300">
                        <Users className="h-4 w-4" />
                        Leads Generated
                      </span>
                      <span className="font-medium text-white">
                        {subscription.leads_generated} / {subscription.leads_limit === -1 ? '∞' : subscription.leads_limit}
                      </span>
                    </div>
                    {subscription.leads_limit !== -1 && (
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscription.leads_generated, subscription.leads_limit) >= 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscription.leads_generated, subscription.leads_limit) >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${getUsagePercentage(subscription.leads_generated, subscription.leads_limit)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Emails */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-4 w-4" />
                        Marketing Emails
                      </span>
                      <span className="font-medium text-white">
                        {subscription.emails_sent} / {subscription.email_quota === -1 ? '∞' : subscription.email_quota}
                      </span>
                    </div>
                    {subscription.email_quota !== -1 && (
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscription.emails_sent, subscription.email_quota) >= 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscription.emails_sent, subscription.email_quota) >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${getUsagePercentage(subscription.emails_sent, subscription.email_quota)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Storage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-slate-300">
                        <HardDrive className="h-4 w-4" />
                        Storage
                      </span>
                      <span className="font-medium text-white">
                        {subscription.storage_used_gb.toFixed(2)} GB / {subscription.storage_gb === -1 ? '∞' : subscription.storage_gb} GB
                      </span>
                    </div>
                    {subscription.storage_gb !== -1 && (
                      <div className="w-full bg-slate-700/50 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            getUsagePercentage(subscription.storage_used_gb, subscription.storage_gb) >= 90 
                              ? 'bg-red-500' 
                              : getUsagePercentage(subscription.storage_used_gb, subscription.storage_gb) >= 75
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${getUsagePercentage(subscription.storage_used_gb, subscription.storage_gb)}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    Upgrade Plan
                  </button>
                  
                  <button
                    onClick={() => setShowCancelDialog(true)}
                    className="px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-all ml-auto"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </motion.div>
              
              {/* Quick Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: "This Month's Spend", value: formatCurrency(subscription.amount), icon: DollarSign },
                  { label: "Active Properties", value: subscription.properties_used, icon: Building2 },
                  { label: "Total Leads", value: subscription.leads_generated, icon: Users },
                  { label: "Emails Sent", value: subscription.emails_sent, icon: Mail }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-slate-800/95 glow-border rounded-lg p-4"
                  >
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white flex items-center gap-2">
                      <stat.icon className="h-5 w-5 text-amber-300" />
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/95 glow-border rounded-lg p-8 text-center"
            >
              <Sparkles className="h-12 w-12 text-amber-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Active Subscription</h3>
              <p className="text-slate-400 mb-6">
                Choose a plan to get started with Tharaga's premium features
              </p>
              <button
                onClick={() => setActiveTab('plans')}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all"
              >
                View Plans
              </button>
            </motion.div>
          )}
        </div>
      )}
      
      {/* PLANS & PRICING TAB */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-slate-800/50 rounded-lg">
            {(['monthly', 'quarterly', 'yearly'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-4 py-2 rounded-md transition-colors capitalize ${
                  billingCycle === cycle
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cycle}
                {(cycle === 'quarterly' || cycle === 'yearly') && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                    Save {cycle === 'yearly' ? '20%' : '10%'}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {/* Plans Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentPlan = subscription?.plan_type === plan.id;
              const pricing = plan.pricing[billingCycle];
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative bg-slate-800/95 glow-border rounded-lg overflow-hidden ${
                    plan.popular ? 'ring-2 ring-amber-300' : ''
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full border border-green-400/30">
                        Current Plan
                      </span>
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${
                        plan.id === 'starter' ? 'bg-blue-500/20' :
                        plan.id === 'professional' ? 'bg-purple-500/20' :
                        'bg-orange-500/20'
                      }`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      <h3 className="text-xl font-bold text-white capitalize">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">{plan.description}</p>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-white">{pricing.display}</span>
                        <span className="text-slate-400">
                          /{billingCycle === 'yearly' ? 'year' : billingCycle === 'quarterly' ? 'quarter' : 'month'}
                        </span>
                      </div>
                      {pricing.savings && (
                        <p className="text-sm text-green-400 mt-1">Save {pricing.savings}</p>
                      )}
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {plan.features_list.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-slate-700/50 text-slate-400 rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processing}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                          plan.popular
                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1'
                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        } disabled:opacity-50 flex items-center justify-center gap-2`}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Get Started'
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* INVOICES TAB */}
      {activeTab === 'invoices' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/95 glow-border rounded-lg p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Billing History</h3>
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">No invoices yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-slate-700/50">
                        <td className="py-3 px-4 text-white font-medium">{invoice.invoice_number}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {new Date(invoice.invoice_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-white">{formatCurrency(invoice.total_amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : invoice.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => downloadInvoice(invoice.id)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* USAGE ANALYTICS TAB */}
      {activeTab === 'usage' && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/95 glow-border rounded-lg p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Usage Trends</h3>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">Usage analytics coming soon</p>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 glow-border rounded-lg p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-2">Cancel Subscription</h3>
            <p className="text-slate-400 mb-4">
              Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
            </p>
            
            <textarea
              className="w-full min-h-[100px] p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 mb-4"
              placeholder="Reason for cancellation (optional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            
            {subscription && (
              <div className="p-3 bg-amber-500/20 border border-amber-400/30 rounded-lg mb-4">
                <p className="text-sm text-amber-200">
                  Your subscription will remain active until {new Date(subscription.current_end).toLocaleDateString('en-IN')}. You will not be charged again.
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-700 transition-colors"
                disabled={processing}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-colors"
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                    Cancelling...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}



