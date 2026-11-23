"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  User,
  Mail,
  Globe,
  Languages,
  Shield,
  AlertTriangle,
  Save,
  Crown,
  KeyRound,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth-guard";
import { StudioShell } from "@/components/studio/studio-shell";

const REGIONS = [
  "Global", "North America", "Europe", "Asia Pacific", "Latin America",
  "Middle East", "Africa",
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese", "Japanese",
  "Korean", "Chinese", "Hindi", "Arabic",
];

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // AuthGuard only renders when user is present — initialize once from that user.
  const [profile, setProfile] = useState({
    username: user?.name || "",
    email: user?.email || "",
    region: user?.region || "Global",
    language: user?.language || "English",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updated = await api.updateMe({
        name: profile.username,
        email: profile.email,
        region: profile.region,
        language: profile.language,
      });
      useAuthStore.getState().setUser(updated);
      return updated;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      setPasswordErr("");
      setPasswordMsg("");
      if (!user?.email) {
        throw new Error("Add an email on your profile before setting a password.");
      }
      if (passwordForm.new_password.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        throw new Error("Passwords do not match.");
      }
      await api.setPassword({
        new_password: passwordForm.new_password,
        current_password: user.has_password
          ? passwordForm.current_password || undefined
          : undefined,
      });
      const refreshed = await api.getMe();
      useAuthStore.getState().setUser(refreshed);
    },
    onSuccess: () => {
      setPasswordMsg(
        user?.has_password
          ? "Password updated."
          : "Password set — you can now also sign in with email.",
      );
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    },
    onError: (err) => {
      setPasswordErr(err instanceof Error ? err.message : "Failed to set password");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      api.setToken(null);
      logout();
    },
    onSuccess: () => {
      router.replace("/");
    },
  });

  const tier: string = user?.tier || "Free";
  const tierVariant: "default" | "success" | "info" =
    tier === "Enterprise" ? "info" : tier === "Pro" ? "success" : "default";

  return (
    <StudioShell
      title="Atelier"
      subtitle="Account, preferences, and the fine details of your studio."
    >
        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-champagne" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Display Name"
              value={profile.username}
              onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-pearl">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              {user?.email ? (
                <div className="flex items-center rounded-lg border border-atelier bg-surface-raised/50 px-3 py-2 text-sm text-muted-atelier">
                  {user.email}
                  <Badge variant="default" className="ml-auto">Read-only</Badge>
                </div>
              ) : (
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-pearl">
                <Globe className="h-3.5 w-3.5" />
                Region
              </label>
              <select
                value={profile.region}
                onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                className="w-full rounded-lg border border-atelier bg-surface-raised px-3 py-2 text-sm text-pearl focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-pearl">
                <Languages className="h-3.5 w-3.5" />
                Language
              </label>
              <select
                value={profile.language}
                onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                className="w-full rounded-lg border border-atelier bg-surface-raised px-3 py-2 text-sm text-pearl focus:border-champagne focus:outline-none focus:ring-2 focus:ring-champagne/20"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => saveMutation.mutate()}
                loading={saveMutation.isPending}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              {saved && (
                <span className="text-sm text-emerald-400">Settings saved!</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Password / email login */}
        <Card className="mb-6 border-atelier bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-champagne" />
              Email password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-atelier">
              {user?.has_password
                ? "Change the password used for email sign-in."
                : "Set a password so you can also sign in with email (useful if you joined via Google, Instagram, X, or phone)."}
            </p>
            {!user?.email && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                This account has no email yet. Save an email on your profile first.
              </div>
            )}
            {passwordErr && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {passwordErr}
              </div>
            )}
            {passwordMsg && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {passwordMsg}
              </div>
            )}
            {user?.has_password && (
              <Input
                label="Current password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
              />
            )}
            <Input
              label="New password"
              type="password"
              value={passwordForm.new_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, new_password: e.target.value })
              }
              minLength={8}
            />
            <Input
              label="Confirm new password"
              type="password"
              value={passwordForm.confirm_password}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
              }
              minLength={8}
            />
            <Button
              onClick={() => passwordMutation.mutate()}
              loading={passwordMutation.isPending}
              disabled={!user?.email}
            >
              {user?.has_password ? "Update Password" : "Set Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Account Tier */}
        <Card className="mb-6 border-atelier bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-400" />
              Account Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-pearl">{tier}</span>
                  <Badge variant={tierVariant}>{tier}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-atelier">
                  {tier === "Free"
                    ? "Upgrade to Pro for unlimited analyses and advanced trend insights."
                    : tier === "Pro"
                      ? "You have access to all Pro features."
                      : "Full access to all Enterprise features and priority support."}
                </p>
              </div>
              {tier === "Free" && (
                <Button variant="outline" size="sm">
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-900/50 bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Shield className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDeleteConfirm ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-pearl">Delete Account</p>
                  <p className="text-sm text-muted-atelier">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">This action is irreversible</span>
                </div>
                <p className="mb-4 text-sm text-muted-atelier">
                  Type <span className="font-mono font-medium text-red-400">delete my account</span> to confirm.
                </p>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="delete my account"
                />
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={deleteInput !== "delete my account"}
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    Permanently Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteInput("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </StudioShell>
  );
}
