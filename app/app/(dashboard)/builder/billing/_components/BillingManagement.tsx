'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Zap,
  Loader2,
  Receipt,
  Sparkles,
  Check,
  Link as LinkIcon,
  TrendingUp,
  BarChart3,
  Clock,
  Shield,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  Activity,
  Users,
  Building2,
  Mail,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  pricing: {
    monthly: { amount: number; display: string; perMonth: string };
    yearly: { amount: number; display: string; perMonth: string; savings: string; totalYearly: string };
  };
  features_list: string[];
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
  razorpay_subscription_id: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  status: string;
  pdf_url: string | null;
}

interface UsageStats {
  properties: number;
  leads: number;
  emails_sent: number;
  storage_used_gb: number;
}

export default function BillingManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [builderId, setBuilderId] = useState<string | null>(null);
  
  const supabase = getSupabase();
  
  useEffect(() => {
    loadRazorpayScript();
    fetchBillingData();
  }, []);
  
  const loadRazorpayScript = () => {
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  };
  
  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated. Please log in.');
      }
      
      // Try to get builder profile from multiple sources
      let builderProfile = null;
      let builderIdValue: string | null = null;
      
      // First try builder_profiles (newer table)
      const { data: builderProfileData } = await supabase
        .from('builder_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (builderProfileData) {
        builderIdValue = builderProfileData.id;
        builderProfile = builderProfileData;
      } else {
        // Fallback to builders table
        const { data: builderData } = await supabase
          .from('builders')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (builderData) {
          builderIdValue = builderData.id;
          builderProfile = builderData;
        } else {
          // Try profiles table as last resort
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profileData) {
            builderIdValue = profileData.id;
            builderProfile = profileData;
          }
        }
      }
      
      setBuilderId(builderIdValue);
      
      // If no builder profile found, still allow viewing pricing
      // but show a message to complete profile
      if (!builderProfile) {
        console.warn('Builder profile not found, but allowing access to pricing');
        // Don't throw error, just continue without subscription data
      }
      
      // Fetch plan (single Tharaga Pro plan)
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      if (plansData.success && plansData.plan) {
        setPlan(plansData.plan);
      }
      
      // Only fetch subscription if we have a builder ID
      if (builderIdValue) {
        // Try builder_subscriptions first (new structure)
        const { data: sub, error: subError } = await supabase
          .from('builder_subscriptions')
          .select('*')
          .eq('builder_id', builderIdValue)
          .maybeSingle();
        
        if (subError && subError.code !== 'PGRST116') {
          console.error('Subscription fetch error:', subError);
        }
        
        if (sub) {
          // Map builder_subscriptions to our Subscription interface
          setSubscription({
            id: sub.id,
            plan_type: 'tharaga_pro',
            billing_cycle: sub.billing_cycle || 'monthly',
            status: sub.status || 'active',
            amount: sub.current_price || 0,
            current_start: sub.current_period_start || new Date().toISOString(),
            current_end: sub.current_period_end || new Date().toISOString(),
            next_billing_at: sub.current_period_end || new Date().toISOString(),
            razorpay_subscription_id: sub.razorpay_subscription_id || ''
          });
          
          // Fetch invoices
          const { data: invs } = await supabase
            .from('billing_invoices')
            .select('*')
            .eq('builder_id', builderIdValue)
            .order('invoice_date', { ascending: false })
            .limit(20);
          
          setInvoices(invs || []);
        }
        
        // Fetch usage stats
        try {
          const [propertiesResult, leadsResult] = await Promise.all([
            supabase.from('properties').select('id', { count: 'exact', head: true }).eq('builder_id', builderIdValue),
            supabase.from('leads').select('id', { count: 'exact', head: true }).eq('builder_id', builderIdValue)
          ]);
          
          setUsageStats({
            properties: propertiesResult.count || 0,
            leads: leadsResult.count || 0,
            emails_sent: 0, // TODO: Fetch from email logs
            storage_used_gb: 0 // TODO: Calculate from storage
          });
        } catch (statsError) {
          console.error('Error fetching usage stats:', statsError);
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubscribe = async () => {
    try {
      setProcessing(true);
      setError('');
      
      if (!plan) {
        throw new Error('Plan not loaded');
      }
      
      // Use the same API endpoint as pricing page
      const response = await fetch('/api/pricing/plans');
      const plansData = await response.json();
      
      if (!plansData.success || !plansData.plans || plansData.plans.length === 0) {
        throw new Error('Unable to load plans. Please try again.');
      }
      
      // Find the plan that matches Tharaga Pro
      const dbPlan = plansData.plans.find((p: any) => 
        p.slug === 'scale' || p.slug === 'enterprise' || p.slug === 'pro' || p.slug === 'tharaga-pro'
      ) || plansData.plans[plansData.plans.length - 1];
      
      if (!dbPlan) {
        throw new Error('Plan not found. Please contact support.');
      }
      
      const subscribeResponse = await fetch('/api/pricing/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: dbPlan.id,
          billingCycle: billingCycle
        })
      });
      
      const subscribeData = await subscribeResponse.json();
      
      if (!subscribeData.success || !subscribeData.subscriptionId) {
        throw new Error(subscribeData.error || 'Unable to start checkout. Please try again.');
      }
      
      // Open Razorpay checkout
      if ((window as any).Razorpay) {
        openRazorpayCheckout(subscribeData);
      } else {
        const checkRazorpay = setInterval(() => {
          if ((window as any).Razorpay) {
            clearInterval(checkRazorpay);
            openRazorpayCheckout(subscribeData);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkRazorpay);
          if (!(window as any).Razorpay) {
            throw new Error('Payment gateway failed to load');
          }
        }, 5000);
      }
      
    } catch (err: any) {
      setError(err.message);
      setProcessing(false);
    }
  };
  
  const openRazorpayCheckout = (subData: any) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || (window as any).RAZORPAY_KEY_ID,
      subscription_id: subData.subscriptionId,
      name: 'Tharaga',
      description: `Tharaga Pro - ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}`,
      prefill: {
        email: (window as any).__thgUserEmail || '',
      },
      theme: {
        color: '#D4AF37'
      },
      handler: function () {
        window.location.href = '/builder/billing?success=1';
      },
      modal: {
        ondismiss: function() {
          setProcessing(false);
        }
      }
    };
    
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }
    
    try {
      setProcessing(true);
      setError('');
      
      if (!subscription?.razorpay_subscription_id) {
        throw new Error('No active subscription found');
      }
      
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_id: subscription.id,
          razorpay_subscription_id: subscription.razorpay_subscription_id
        })
      });
      
      if (!response.ok) {
        throw new Error('Cancellation failed');
      }
      
      await fetchBillingData();
      
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
  
  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toLocaleString('en-IN')}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-300 mx-auto mb-4" />
          <p className="text-slate-400">Loading billing information...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-100 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-rose-300 hover:text-rose-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Profile Notice */}
      {!builderId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-100 flex items-start gap-3"
        >
          <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Complete Your Profile</p>
            <p className="text-sm text-amber-200/80">
              To manage subscriptions and view invoices, please complete your builder profile in settings.
            </p>
          </div>
        </motion.div>
      )}
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-amber-300/20 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'pricing', label: 'Pricing', icon: CreditCard },
          { id: 'invoices', label: 'Invoices', icon: Receipt }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-amber-300 border-b-2 border-amber-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      
      {/* OVERVIEW TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Subscription Status Card */}
            {subscription ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border-b glow-border border-b-amber-300/25 p-6 sm:p-8">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-amber-500/20 rounded-lg">
                        <Sparkles className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Tharaga Pro</h2>
                        <p className="text-slate-300 text-sm sm:text-base">Active Subscription</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscription.status === 'active' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                      }`}>
                        {subscription.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Subscription Details */}
                <div className="p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Current Period</p>
                      <p className="font-semibold text-white text-sm">
                        {formatDate(subscription.current_start)} - {formatDate(subscription.current_end)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Next Billing</p>
                      <p className="font-semibold text-white text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-amber-300" />
                        {formatDate(subscription.next_billing_at)}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Amount</p>
                      <p className="font-semibold text-xl text-white flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-300" />
                        {formatCurrency(subscription.amount)}
                        <span className="text-sm text-slate-400 font-normal">
                          /{subscription.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                        </span>
                      </p>
                    </div>
                    
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Billing Cycle</p>
                      <p className="font-semibold text-white text-sm capitalize">
                        {subscription.billing_cycle}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      Manage Plan
                    </button>
                    
                    <button
                      onClick={handleCancelSubscription}
                      disabled={processing}
                      className="px-6 py-3 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" />
                          Cancel Subscription
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl p-8 sm:p-12 text-center"
              >
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-amber-500/20 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-amber-300" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">No Active Subscription</h3>
                  <p className="text-slate-400 mb-8 text-lg">
                    Choose a plan to unlock unlimited properties, AI-powered leads, and full automation
                  </p>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="px-8 py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all inline-flex items-center gap-2"
                  >
                    View Plans
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
            
            {/* Usage Statistics */}
            {usageStats && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Building2 className="h-8 w-8 text-amber-300" />
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{usageStats.properties}</p>
                  <p className="text-sm text-slate-400">Properties Listed</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-amber-300" />
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{usageStats.leads}</p>
                  <p className="text-sm text-slate-400">AI-Scored Leads</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Mail className="h-8 w-8 text-amber-300" />
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{usageStats.emails_sent}</p>
                  <p className="text-sm text-slate-400">Emails Sent</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 bg-slate-800/95 glow-border rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <BarChart3 className="h-8 w-8 text-amber-300" />
                    <Shield className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">{usageStats.storage_used_gb} GB</p>
                  <p className="text-sm text-slate-400">Storage Used</p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
        
        {/* PRICING TAB */}
        {activeTab === 'pricing' && plan && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Link to Full Pricing Page */}
            <div className="text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View Full Pricing Page
              </Link>
            </div>
            
            {/* Pricing Card - Professional Design */}
            <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20 border-b glow-border border-b-amber-300/25 p-8 sm:p-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-lg">
                    <Sparkles className="w-8 h-8 text-amber-300" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">Tharaga Pro</h2>
                </div>
                <p className="text-lg sm:text-xl text-slate-300">Everything Unlimited. One Simple Price.</p>
              </div>

              {/* Pricing */}
              <div className="p-8 sm:p-12 text-center border-b glow-border border-b-amber-300/25 bg-gradient-to-b from-slate-800/50 to-transparent">
                {/* Billing Cycle Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  {(['monthly', 'yearly'] as const).map((cycle) => (
                    <button
                      key={cycle}
                      onClick={() => setBillingCycle(cycle)}
                      className={`px-6 py-3 rounded-lg transition-all capitalize font-medium ${
                        billingCycle === cycle
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cycle}
                      {cycle === 'yearly' && (
                        <span className="ml-2 text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded-full">
                          Save 17%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-center gap-8 mb-8 flex-wrap">
                  {billingCycle === 'monthly' ? (
                    <div className="text-center">
                      <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Monthly</div>
                      <div className="text-5xl sm:text-6xl font-bold text-white mb-2">{plan.pricing.monthly.display}</div>
                      <div className="text-lg text-slate-400">per month</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Monthly</div>
                        <div className="text-4xl font-bold text-white line-through text-slate-500 mb-2">{plan.pricing.monthly.display}</div>
                        <div className="text-sm text-slate-400">per month</div>
                      </div>
                      <div className="text-slate-400 text-3xl">→</div>
                      <div className="relative text-center">
                        <div className="absolute -top-4 -right-4 px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-full glow-border shadow-lg">
                          Save 17%
                        </div>
                        <div className="text-sm text-slate-400 mb-2 uppercase tracking-wide">Yearly</div>
                        <div className="text-5xl sm:text-6xl font-bold text-green-300 mb-2">{plan.pricing.yearly.display}</div>
                        <div className="text-lg text-slate-400">per month</div>
                        <div className="text-sm text-slate-500 mt-2">{plan.pricing.yearly.totalYearly}</div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleSubscribe}
                  disabled={processing || subscription?.status === 'active'}
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 glow-border text-slate-900 font-bold text-lg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      Processing...
                    </>
                  ) : subscription?.status === 'active' ? (
                    <>
                      <CheckCircle2 className="h-6 w-6" />
                      Current Plan
                    </>
                  ) : (
                    <>
                      Subscribe Now
                      <Zap className="w-6 h-6" />
                    </>
                  )}
                </button>

                <p className="text-sm text-slate-400 mt-6 flex items-center justify-center gap-2">
                  <Shield className="h-4 w-4" />
                  {subscription?.status === 'active' 
                    ? 'Your subscription is active' 
                    : '14-day free trial · No credit card required · Cancel anytime'}
                </p>
              </div>

              {/* Features */}
              <div className="p-8 sm:p-12">
                <h3 className="text-xl font-bold text-white mb-6 text-center">Everything Included</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plan.features_list.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-colors"
                    >
                      <Check className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* INVOICES TAB */}
        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 sm:p-8 border-b border-slate-700/50">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Billing History</h3>
                    <p className="text-slate-400 text-sm">View and download your invoices</p>
                  </div>
                  {invoices.length > 0 && (
                    <div className="text-sm text-slate-400">
                      {invoices.length} {invoices.length === 1 ? 'invoice' : 'invoices'}
                    </div>
                  )}
                </div>
              </div>
              
              {invoices.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Receipt className="h-10 w-10 text-slate-500" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">No invoices yet</h4>
                  <p className="text-slate-400 mb-6">Your invoices will appear here once you subscribe</p>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all inline-flex items-center gap-2"
                  >
                    View Plans
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-800/50">
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">Invoice #</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">Date</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">Amount</th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">Status</th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-slate-300 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice, index) => (
                        <motion.tr
                          key={invoice.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{invoice.invoice_number}</div>
                          </td>
                          <td className="py-4 px-6 text-slate-300">
                            {formatDate(invoice.invoice_date)}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-semibold text-white">{formatCurrency(invoice.total_amount)}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                              invoice.status === 'paid' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                : invoice.status === 'cancelled'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                            }`}>
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => downloadInvoice(invoice.id)}
                              className="p-2 text-slate-400 hover:text-amber-300 transition-colors rounded-lg hover:bg-slate-700/30"
                              title="Download invoice"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
