import { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Mail, Lock, User, Phone, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { registerVendor } from "@/lib/api";
import { SITE_NAME } from "@/lib/config";

export default function VendorRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registerVendor({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        description: form.description || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-card border border-card-border rounded-2xl shadow-md p-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/10 mb-5">
              <CheckCircle2 className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Application Submitted</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              Thank you for applying to sell on <span className="font-semibold text-foreground">{SITE_NAME}</span>. Your application is currently under review.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Our team will verify your details and approve your account within 1–3 business days. You will be able to log in and manage your storefront once approved.
            </p>
            <div className="bg-muted rounded-xl p-4 text-left space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What happens next</p>
              <ul className="space-y-1.5 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">1</span>
                  Admin reviews your application
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">2</span>
                  Account gets approved
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">3</span>
                  You log in and start selling
                </li>
              </ul>
            </div>
            <a
              href="/vendor/login"
              className="inline-block mt-6 text-sm text-primary font-semibold hover:underline"
            >
              Back to login
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Stethoscope className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Apply to Sell on {SITE_NAME}</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Veterinary clinics, pet stores, and pharmacies welcome
          </p>
        </div>

        <div className="bg-card border border-card-border rounded-2xl shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Business name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="City Animal Clinic"
                  value={form.name}
                  onChange={handleChange}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="clinic@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="pl-9"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Choose a strong password"
                  value={form.password}
                  onChange={handleChange}
                  className="pl-9"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone number <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+964 750 000 0000"
                  value={form.phone}
                  onChange={handleChange}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                About your business <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Tell us about your clinic or store..."
                  value={form.description}
                  onChange={handleChange}
                  className="pl-9 min-h-[90px] resize-none"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting application...
                </>
              ) : (
                "Submit application"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/vendor/login" className="text-primary font-semibold hover:underline">
              Sign in
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
