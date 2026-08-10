'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { UserPlus, Trash2, Shield, User, Calendar, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface IUserRecord {
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<IUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Connection failed. Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccessMsg(`User ${newEmail} created successfully.`);
      setNewEmail('');
      setNewPassword('');
      setNewRole('user');
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm(`Are you sure you want to delete user ${email}?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccessMsg(`User ${email} deleted successfully.`);
      fetchUsers(); // Refresh list
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Administration</h1>
          <p className="text-slate-500 mt-1 text-sm">Create and manage accounts for surveying teams and administrators.</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create User Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 h-fit shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#112E81]/10 rounded-xl border border-[#112E81]/20 text-[#112E81]">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Add New User</h2>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="surveyor@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition text-slate-800 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Access Level / Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#112E81] focus:ring-1 focus:ring-[#112E81] transition text-slate-800"
                >
                  <option value="user" className="bg-white text-slate-800">Surveyor / User</option>
                  <option value="admin" className="bg-white text-slate-800">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#112E81] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#2563eb] border-none font-bold rounded-xl text-white shadow-md active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2 mt-4"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  'Create User Account'
                )}
              </button>
            </form>
          </div>

          {/* User List Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#112E81]" />
              Registered Accounts
            </h2>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-[#112E81]" />
                <span>Loading system accounts...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
                <User className="w-12 h-12 text-slate-200 mb-3" />
                <span>No registered user accounts found.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-medium">
                      <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Email / User</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Role</th>
                      <th className="pb-3 font-semibold uppercase tracking-wider text-xs">Date Added</th>
                      <th className="pb-3 text-right font-semibold uppercase tracking-wider text-xs">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((usr) => (
                      <tr key={usr.email} className="hover:bg-slate-50 transition">
                        <td className="py-4 font-medium text-slate-950 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#112E81]/10 border border-[#112E81]/20 flex items-center justify-center text-[#112E81] text-xs font-semibold">
                            {usr.email.charAt(0).toUpperCase()}
                          </div>
                          {usr.email}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded border uppercase ${
                              usr.role === 'admin'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-[#112E81]/10 text-[#112E81] border-[#112E81]/20'
                            }`}
                          >
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600 flex items-center gap-1.5 mt-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {new Date(usr.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(usr.email)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
