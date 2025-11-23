'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Save, User, Mail, Lock, LogOut, Upload, History, LayoutDashboard } from 'lucide-react';

export default function SettingsPage() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      await refetch();
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('bearer_token');
      const { error } = await authClient.changePassword({
        newPassword,
        currentPassword,
        revokeOtherSessions: false,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
        throw new Error(error.message || 'Failed to change password');
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const token = localStorage.getItem('bearer_token');
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });
    if (error?.code) {
      toast.error(error.code);
    } else {
      localStorage.removeItem('bearer_token');
      refetch();
      router.push('/');
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-neutral-500">loading...</p>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="text-white font-semibold text-lg tracking-tight hover:opacity-60 transition-opacity">
            averon.ai
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <LayoutDashboard className="w-4 h-4" /> dashboard
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-blue-500 rounded-none px-0 h-auto py-1 gap-2">
                <Upload className="w-4 h-4" /> upload
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="ghost" className="text-white hover:bg-transparent hover:border-b-2 hover:border-yellow-400 rounded-none px-0 h-auto py-1 gap-2">
                <History className="w-4 h-4" /> history
              </Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="text-white hover:opacity-60 transition-opacity flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-light text-white mb-4">settings</h1>
          <p className="text-neutral-400 font-light">manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <div className="border border-neutral-700 mb-12">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">profile information</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  full name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-white px-6 py-3 hover:border-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 text-white" />
                <span className="text-sm font-medium tracking-wide text-white">
                  {loading ? 'saving...' : 'save changes'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Password Settings */}
        <div className="border border-neutral-700 mb-12">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">change password</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  current password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="off"
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 characters)"
                    autoComplete="off"
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-white"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2 block">
                  confirm new password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="off"
                    className="w-full bg-black border border-neutral-700 text-white text-sm pl-10 pr-4 py-3 focus:outline-none focus:border-white"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full border-2 border-white px-6 py-3 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-white" />
                <span className="text-sm font-medium tracking-wide text-white">
                  {loading ? 'updating...' : 'update password'}
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Account Info */}
        <div className="border border-neutral-700">
          <div className="border-b border-neutral-700 px-6 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white">account information</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Account ID</span>
                <span className="text-white font-mono">{session.user.id}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-neutral-800">
                <span className="text-neutral-400">Member Since</span>
                <span className="text-white">
                  {new Date(session.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-neutral-400">Account Status</span>
                <span className="text-white">Active</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
