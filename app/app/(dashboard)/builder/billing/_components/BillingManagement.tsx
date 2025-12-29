'use client';

import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
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
  Link as LinkIcon
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

export default function BillingManagement() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data: builder } = await supabase
        .from('builders')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!builder) throw new Error('Builder profile not found');
      
      // Fetch plan (single Tharaga Pro plan)
      const plansResponse = await fetch('/api/billing/plans');
      const plansData = await plansResponse.json();
      if (plansData.success && plansData.plan) {
        setPlan(plansData.plan);
      }
      
      // Fetch subscription from builder_subscriptions (using pricing API structure)
      const { data: sub, error: subError } = await supabase
        .from('builder_subscriptions')
        .select('*')
        .eq('builder_id', builder.id)
        .single();
      
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
      
      // Find the plan that matches Tharaga Pro (usually the highest tier)
      // For now, use the first plan or find by slug
      const dbPlan = plansData.plans.find((p: any) => 
        p.slug === 'scale' || p.slug === 'enterprise' || p.slug === 'pro'
      ) || plansData.plans[plansData.plans.length - 1]; // Fallback to last plan
      
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
        // Wait for script to load
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
          { id: 'pricing', label: 'Pricing' },
          { id: 'invoices', label: 'Invoices' }
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
              {/* Current Plan Summary - Match Pricing Page Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/95 glow-border rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b glow-border border-b-amber-300/25 p-8 text-center">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                    <h2 className="text-3xl font-bold text-white">Tharaga Pro</h2>
                  </div>
                  <p className="text-lg text-slate-300">Your active subscription</p>
                </div>
                
                {/* Subscription Details */}
                <div className="p-8">
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
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                      <LinkIcon className="h-4 w-4" />
                      View Full Pricing
                    </button>
                    
                    <button
                      onClick={handleCancelSubscription}
                      disabled={processing}
                      className="px-4 py-2 bg-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-500/30 border border-rose-400/30 transition-all ml-auto disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
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
                onClick={() => setActiveTab('pricing')}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all"
              >
                View Plans
              </button>
            </motion.div>
          )}
        </div>
      )}
      
      {/* PRICING TAB - Match Pricing Page Structure */}
      {activeTab === 'pricing' && plan && (
        <div className="space-y-6">
          {/* Link to Full Pricing Page */}
          <div className="text-center">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-amber-300 hover:text-amber-200 transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              View Full Pricing Page
            </Link>
          </div>
          
          {/* Pricing Card - Match Pricing Page Style */}
          <div className="bg-slate-800/95 glow-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-b glow-border border-b-amber-300/25 p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <h2 className="text-3xl font-bold text-white">Tharaga Pro</h2>
              </div>
              <p className="text-lg text-slate-300">The only plan you'll ever need</p>
            </div>

            {/* Pricing */}
            <div className="p-8 text-center border-b glow-border border-b-amber-300/25">
              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {(['monthly', 'yearly'] as const).map((cycle) => (
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
                    {cycle === 'yearly' && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                        Save 17%
                      </span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-8 mb-6 flex-wrap">
                {billingCycle === 'monthly' ? (
                  <>
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Monthly</div>
                      <div className="text-4xl font-bold text-white">{plan.pricing.monthly.display}</div>
                      <div className="text-sm text-slate-400">per month</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-slate-400 mb-2">Monthly</div>
                      <div className="text-4xl font-bold text-white line-through text-slate-500">{plan.pricing.monthly.display}</div>
                      <div className="text-sm text-slate-400">per month</div>
                    </div>
                    <div className="text-slate-400 text-2xl">or</div>
                    <div className="relative">
                      <div className="absolute -top-3 -right-3 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full glow-border">
                        Save 17%
                      </div>
                      <div className="text-sm text-slate-400 mb-2">Yearly</div>
                      <div className="text-4xl font-bold text-green-300">{plan.pricing.yearly.display}</div>
                      <div className="text-sm text-slate-400">per month</div>
                      <div className="text-xs text-slate-500 mt-1">{plan.pricing.yearly.totalYearly}</div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={processing || subscription?.status === 'active'}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 glow-border text-slate-900 font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : subscription?.status === 'active' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Current Plan
                  </>
                ) : (
                  <>
                    Subscribe Now
                    <Zap className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-sm text-slate-400 mt-4">
                {subscription?.status === 'active' 
                  ? 'Your subscription is active' 
                  : 'No credit card required · Cancel anytime'}
              </p>
            </div>

            {/* Features */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.features_list.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
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
    </div>
  );
}
