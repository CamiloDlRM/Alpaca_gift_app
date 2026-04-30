import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiClient.patch('/auth/profile', { name });
      updateUser({ name });
      setSuccessMsg('Name updated successfully.');
    } catch {
      setErrorMsg('Could not update name.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    setSavingPwd(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiClient.patch('/auth/password', { currentPassword, newPassword });
      setSuccessMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMsg('Could not change password. Please verify your current password.');
    } finally {
      setSavingPwd(false);
    }
  };

  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';
  const planLabel = user?.subscriptionStatus === 'PRO_PLUS' ? 'PRO+' : user?.subscriptionStatus === 'PRO' ? 'PRO' : 'Basic';

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your account and preferences.</p>

          {successMsg && <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-6">{successMsg}</div>}
          {errorMsg && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6">{errorMsg}</div>}

          {/* Plan badge */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current plan</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isPro ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {planLabel}
                  </span>
                  {isPro && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">Active</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {isPro ? 'Unlimited gifts with no sending fee.' : 'Up to 5 gifts with a $0.99 sending fee.'}
                </div>
              </div>
              {!isPro && (
                <Link to="/pricing">
                  <Button size="sm">Upgrade to PRO</Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Personal info */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal information</h2>
            <form onSubmit={handleSaveName} className="space-y-4">
              <Input
                label="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                value={user?.email ?? ''}
                disabled
              />
              <Button type="submit" loading={saving}>Save changes</Button>
            </form>
          </Card>

          {/* Password */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Change password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={savingPwd}>Change password</Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
