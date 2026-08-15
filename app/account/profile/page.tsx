"use client";

import { useState, useEffect } from "react";
import CustomerGuard from "../../components/CustomerGuard";
import { useAuth } from "../../hooks/useAuth";
import { updateCustomerProfile } from "../../lib/auth";
import Link from "next/link";

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      await updateCustomerProfile(user.uid, {
        displayName: formData.displayName,
        phone: formData.phone,
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
      // The useAuth hook should automatically pick up changes if it's listening to Firestore
      // but we might need a page reload or state sync if it's not.
      // In this project, useAuth seems to listen on load, so a reload might be needed if not real-time.
      window.location.reload();
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerGuard>
      <main className="brand-page min-h-screen px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <Link href="/account" className="text-sm text-emerald-700 hover:underline">
            ← Back to Dashboard
          </Link>

          <h1 className="mt-6 text-3xl font-semibold text-emerald-900">My Profile</h1>
          <p className="text-emerald-900/60">Manage your personal information.</p>

          <div className="mt-10 rounded-[32px] border border-emerald-100 bg-white p-8 shadow-sm">
            {message && (
              <div
                className={`mb-6 rounded-xl p-4 text-sm ${
                  message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-emerald-100 px-4 py-2 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. +91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Email Address
                  </label>
                  <p className="mt-1 text-lg font-medium text-emerald-900/40">{profile?.email} (Cannot be changed)</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 rounded-full border border-emerald-100 px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Full Name
                  </label>
                  <p className="mt-1 text-lg font-medium text-emerald-900">{profile?.displayName || "Not set"}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Phone Number
                  </label>
                  <p className="mt-1 text-lg font-medium text-emerald-900">{profile?.phone || "Not set"}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Email Address
                  </label>
                  <p className="mt-1 text-lg font-medium text-emerald-900">{profile?.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-emerald-900/40">
                    Account Created
                  </label>
                  <p className="mt-1 text-lg font-medium text-emerald-900">
                    {profile?.createdAt
                      ? new Date(
                          profile.createdAt.seconds ? profile.createdAt.seconds * 1000 : profile.createdAt
                        ).toLocaleDateString()
                      : "Just now"}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-10 w-full rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-600 hover:text-white"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </CustomerGuard>
  );
}
