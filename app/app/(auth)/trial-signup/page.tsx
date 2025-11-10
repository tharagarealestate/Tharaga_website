"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import {
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  MapPin,
  Home,
} from "lucide-react";

function generateSecurePassword(length: number = 16): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
  const array = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback (unlikely on browser) – still generate something non-trivial
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 4294967295);
  }
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[array[i] % alphabet.length];
  return out;
}

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

type FormState = {
  companyName: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  properties: string;
  accepted: boolean;
};

const defaultForm: FormState = {
  companyName: "",
  name: "",
  phone: "",
  email: "",
  location: "",
  properties: "",
  accepted: false,
};

const locations = [
  "Bengaluru",
  "Chennai",
  "Hyderabad",
  "Mumbai",
  "Pune",
  "Delhi NCR",
  "Other",
];

const propertyBands = ["1-5", "6-20", "21-50", "51-100", "100+"];

export default function TrialSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabase(), []);

  const [form, setForm] = useState<FormState>({ ...defaultForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [resendIn, setResendIn] = useState<number>(0);

  // Exit intent modal
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [exitPrefill, setExitPrefill] = useState<{ email?: string; phone?: string }>({});
  const hasTriggeredExit = useRef(false);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseLeave = (e: MouseEvent) => {
      if (hasTriggeredExit.current) return;
      if (e.clientY <= 0) {
        hasTriggeredExit.current = true;
        setShowExitIntent(true);
      }
    };
    // Avoid on touch devices
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    if (!isTouch) {
      window.addEventListener("mouseout", onMouseLeave);
    }
    return () => {
      if (!isTouch) window.removeEventListener("mouseout", onMouseLeave);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const canSubmit =
    !!form.companyName &&
    !!form.name &&
    !!form.phone &&
    !!form.email &&
    !!form.location &&
    !!form.properties &&
    !!form.accepted &&
    phoneVerified &&
    !loading;

  const scrollToForm = useCallback(() => {
    document.getElementById("trial-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const sendOtp = useCallback(async () => {
    setError(null);
    if (!form.phone) {
      setError("Enter your mobile number to receive OTP");
      return;
    }
    // Basic phone validation
    const phoneOk = /^\+?[0-9]{10,13}$/.test(form.phone.replace(/\s|-/g, ""));
    if (!phoneOk) {
      setError("Enter a valid phone number with country code");
      return;
    }
    if (resendIn > 0) return;
    try {
      setOtpVerifying(true);
      // Try sending via Supabase phone OTP. Requires SMS provider configured.
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        phone: form.phone,
        options: {
          channel: "sms",
          // If your auth settings require existing user, you may need shouldCreateUser: true
          // shouldCreateUser: true,
        } as any,
      });
      if (otpErr) throw otpErr;
      setOtpSent(true);
      setSuccess("OTP sent to your mobile");
      setResendIn(30);
      const timer = setInterval(() => {
        setResendIn((n) => {
          if (n <= 1) {
            clearInterval(timer);
            return 0;
          }
          return n - 1;
        });
        return undefined as unknown as number;
      }, 1000);
    } catch (e: any) {
      // Optional dev fallback: allow fake OTP if env flag is set
      if (process.env.NEXT_PUBLIC_FAKE_OTP === "1") {
        setOtpSent(true);
        setSuccess("Dev mode: use 000000 as OTP");
      } else {
        setError(e?.message || "Could not send OTP. Try again.");
      }
    } finally {
      setOtpVerifying(false);
    }
  }, [form.phone, supabase.auth, resendIn]);

  const verifyOtp = useCallback(async () => {
    setError(null);
    if (!otpCode || otpCode.length < 4) {
      setError("Enter the OTP you received");
      return;
    }
    try {
      setOtpVerifying(true);
      if (process.env.NEXT_PUBLIC_FAKE_OTP === "1" && otpCode === "000000") {
        setPhoneVerified(true);
        setSuccess("Mobile verified");
        return;
      }
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        phone: form.phone,
        token: otpCode,
        type: "sms",
      });
      if (vErr) throw vErr;
      // A session may be created here; we don't need it for email signup. Sign out to avoid conflict.
      try {
        if (data?.session) await supabase.auth.signOut();
      } catch {}
      setPhoneVerified(true);
      setSuccess("Mobile verified");
    } catch (e: any) {
      setError(e?.message || "Invalid OTP. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }, [form.phone, otpCode, supabase.auth]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setError(null);
      setSuccess(null);
      if (!canSubmit) return;
      setLoading(true);
      try {
        const password = generateSecurePassword();
        const { data, error: sErr } = await supabase.auth.signUp({
          email: form.email,
          password,
          options: {
            data: {
              name: form.name,
              company_name: form.companyName,
              phone: form.phone,
              location: form.location,
              properties_band: form.properties,
              phone_verified: phoneVerified,
              source: "trial-signup",
            },
          },
        });
        if (sErr) {
          const msg = String(sErr.message || '').toLowerCase();
          if (msg.includes('registered') || msg.includes('already') || msg.includes('exists')) {
            setError(
              'An account with this email already exists. You can sign in or reset your password.'
            );
            return;
          }
          throw sErr;
        }
        const userId = data.user?.id;
        if (userId) {
          // Create trial subscription row
          const r = await fetch("/api/trial/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ builderId: userId }),
          }).catch(() => undefined);
          if (r && !r.ok) {
            // Non-blocking error; surface info but continue
            console.warn('Trial subscription creation failed');
          }
        }
        setSuccess("Account created. Check your email to verify.");
        // Redirect to builder trial page
        router.push("/builder/trial");
      } catch (e: any) {
        setError(e?.message || "Could not start trial. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [canSubmit, form, phoneVerified, router, supabase.auth]
  );

  // Testimonials carousel (simple auto-advance)
  const testimonials = useMemo(
    () => [
      {
        quote:
          "We closed 7 bookings in the first two weeks. The lead quality is far superior.",
        name: "Anand, VP Sales",
        company: "Skyline Builders",
      },
      {
        quote:
          "Their buyer verification saved us hours. Our team only talks to serious customers.",
        name: "Priya, Sales Head",
        company: "GreenLeaf Estates",
      },
      {
        quote:
          "The dashboard is simple, the results are powerful. Amazing ROI.",
        name: "Rahul, Director",
        company: "UrbanNest Developers",
      },
    ],
    []
  );

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(id);
  }, [testimonials.length]);

  return (
    <main className="min-h-screen bg-hero text-white">
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 -right-24 h-[420px] w-[420px] rounded-full bg-gold-500/30 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-24 -left-24 h-[480px] w-[480px] rounded-full bg-primary-600/25 blur-3xl animate-pulse-slow-delay" />
      </div>

      <section className="relative z-10">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12"
          >
            {/* LEFT */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">India&rsquo;s Most Intelligent Real Estate Sales Platform</span>
              </motion.div>

              <motion.h1 variants={fadeIn} className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                Get Your First <span className="text-gradient-gold">10 Qualified Leads</span> FREE
              </motion.h1>

              <motion.p variants={fadeIn} className="text-lg text-gray-200 max-w-2xl">
                Trusted by growth-focused builders. Verified buyers. Zero junk.
              </motion.p>

              {/* Trust badges */}
              <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-400" /> RERA-aligned</div>
                <div className="flex items-center gap-2"><Users className="h-5 w-5 text-emerald-400" /> 10K+ Buyers</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Data-verified</div>
              </motion.div>

              {/* Value props */}
              <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xl font-bold text-white"><span>₹0</span></div>
                  <p className="text-gray-200 text-sm">Zero Cost Trial</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xl font-bold text-white"><ShieldCheck className="h-5 w-5 text-emerald-400" /> Verified</div>
                  <p className="text-gray-200 text-sm">Buyer verification</p>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 text-xl font-bold text-white"><Home className="h-5 w-5 text-emerald-400" /> Full Access</div>
                  <p className="text-gray-200 text-sm">Dashboard + Reports</p>
                </div>
              </motion.div>

              {/* Testimonials carousel */}
              <motion.div variants={fadeIn} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="p-5 sm:p-6">
                  <AnimatePresence initial={false} mode="wait">
                    <motion.div
                      key={activeIndex}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.35 }}
                    >
                      <p className="text-white/90 text-xl">“{testimonials[activeIndex].quote}”</p>
                      <p className="mt-3 text-sm text-gray-300">— {testimonials[activeIndex].name}, {testimonials[activeIndex].company}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* What happens next */}
              <motion.div variants={fadeIn} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {["Create account", "Get verified leads", "Track results"].map((step, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-gray-300">Step {i + 1}</div>
                    <div className="text-white font-semibold">{step}</div>
                  </div>
                ))}
              </motion.div>

              {/* Mobile CTA to scroll to form */}
              <motion.div variants={fadeIn} className="lg:hidden">
                <button onClick={scrollToForm} className="btn-gold inline-flex items-center gap-2">
                  Start My Free Trial <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>

              {/* Trust footer */}
              <motion.div variants={fadeIn} className="text-xs text-gray-300">
                By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
              </motion.div>
            </div>

            {/* RIGHT - FORM */}
            <div className="lg:col-span-5">
              <motion.div id="trial-form" variants={fadeIn} className="glass-card rounded-2xl p-6 sm:p-8 text-gray-900">
                <h2 className="text-2xl font-bold text-primary-900 mb-1">Start Your Free Trial</h2>
                <p className="text-sm text-gray-600 mb-5">No credit card. 14 days. All features.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <label className="block text-sm">
                      <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Building2 className="h-4 w-4" /> Builder/Company Name*</span>
                      <input
                        required
                        name="companyName"
                        value={form.companyName}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="e.g., Skyline Builders"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Users className="h-4 w-4" /> Your Name*</span>
                      <input
                        required
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="Your full name"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Phone className="h-4 w-4" /> Mobile*</span>
                        <input
                          required
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                          placeholder="+91XXXXXXXXXX"
                          inputMode="tel"
                        />
                      </label>
                      <div className="flex gap-2">
                        <button type="button" onClick={sendOtp} disabled={otpVerifying || !form.phone || resendIn > 0} className="btn-primary w-full">
                          {otpSent ? (resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP") : "Send OTP"}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <label className="block text-sm sm:col-span-2">
                          <span className="mb-1 inline-flex items-center gap-2 text-gray-700">Enter OTP</span>
                          <input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                            placeholder="6-digit code"
                            inputMode="numeric"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={verifyOtp} disabled={otpVerifying || phoneVerified} className="btn-primary w-full">
                            {phoneVerified ? "Verified" : "Verify"}
                          </button>
                        </div>
                      </div>
                    )}

                    <label className="block text-sm">
                      <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Mail className="h-4 w-4" /> Email*</span>
                      <input
                        required
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                        placeholder="you@company.com"
                      />
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block text-sm">
                        <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><MapPin className="h-4 w-4" /> Primary Location*</span>
                        <select
                          required
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="" disabled>
                            Select a city
                          </option>
                          {locations.map((loc) => (
                            <option key={loc} value={loc}>
                              {loc}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block text-sm">
                        <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Home className="h-4 w-4" /> Number of Properties*</span>
                        <select
                          required
                          name="properties"
                          value={form.properties}
                          onChange={handleChange}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {propertyBands.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label className="flex items-start gap-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="accepted"
                        checked={form.accepted}
                        onChange={handleChange}
                        className="mt-1"
                      />
                      <span>
                        I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
                      </span>
                    </label>
                  </div>

                  {error && <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
                  {success && <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</div>}

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`btn-gold inline-flex w-full items-center justify-center gap-2 text-base py-3 ${!canSubmit ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    {loading ? "Starting..." : "Start My Free Trial"} <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exit Intent Modal */}
      <AnimatePresence>
        {showExitIntent && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-card w-full max-w-lg rounded-2xl bg-white p-6 text-gray-900"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary-900">Wait! Get 10 free leads</h3>
                  <p className="text-sm text-gray-600">Start your trial in under a minute.</p>
                </div>
                <button onClick={() => setShowExitIntent(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>

              <form
                className="mt-4 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setForm((f) => ({
                    ...f,
                    email: exitPrefill.email || f.email,
                    phone: exitPrefill.phone || f.phone,
                  }));
                  setShowExitIntent(false);
                  setTimeout(() => scrollToForm(), 50);
                }}
              >
                <label className="block text-sm">
                  <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Mail className="h-4 w-4" /> Work Email</span>
                  <input
                    value={exitPrefill.email || ""}
                    onChange={(e) => setExitPrefill((p) => ({ ...p, email: e.target.value }))}
                    type="email"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="you@company.com"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 inline-flex items-center gap-2 text-gray-700"><Phone className="h-4 w-4" /> Mobile</span>
                  <input
                    value={exitPrefill.phone || ""}
                    onChange={(e) => setExitPrefill((p) => ({ ...p, phone: e.target.value }))}
                    inputMode="tel"
                    className="mt-1 w-full rounded-lg border border-gray-300 bg-white/90 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-600"
                    placeholder="+91XXXXXXXXXX"
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" className="btn-gold flex-1">Continue</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowExitIntent(false);
                    }}
                    className="btn-primary flex-1"
                  >
                    No thanks
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

