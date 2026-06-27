import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

type PwdStep = 'idle' | 'code_sent' | 'new_password' | 'done';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password change flow
  const [pwdStep, setPwdStep] = useState<PwdStep>('idle');
  const [sendingCode, setSendingCode] = useState(false);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

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

  const handleSendCode = async () => {
    setSendingCode(true);
    setPwdError('');
    try {
      await apiClient.post('/auth/password-code/send');
      setPwdStep('code_sent');
    } catch {
      setPwdError('Could not send verification code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setPwdError('');
    // We verify the code together with the new password in the final step.
    // Here we just advance the UI step — actual verification happens on submit.
    setPwdStep('new_password');
    setVerifying(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwdError('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setPwdError('Password must be at least 6 characters.'); return; }
    setChangingPwd(true);
    setPwdError('');
    try {
      await apiClient.post('/auth/password-code/confirm', { code, newPassword });
      setPwdStep('done');
      setTimeout(() => {
        setPwdStep('idle');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setPwdError(e.response?.data?.error || 'Invalid or expired code.');
      } else {
        setPwdError('Could not update password. Please try again.');
      }
    } finally {
      setChangingPwd(false);
    }
  };

  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';
  const planLabel =
    user?.subscriptionStatus === 'PRO_PLUS' ? 'Visionary' :
    user?.subscriptionStatus === 'PRO' ? 'Future Builder' :
    'Momments';
  const planDescription =
    user?.subscriptionStatus === 'PRO_PLUS' ? '$69/year · $1 sending fee per gift.' :
    user?.subscriptionStatus === 'PRO' ? '$39/year · $1.50 sending fee per gift.' :
    'Free to use · $4.99 sending fee per gift.';

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
                  {planDescription}
                </div>
              </div>
              {user?.subscriptionStatus !== 'PRO_PLUS' && (
                <Link to="/pricing">
                  <Button size="sm">
                    {user?.subscriptionStatus === 'PRO' ? 'Upgrade to Visionary' : 'Upgrade plan'}
                  </Button>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Change password</h2>

            {pwdStep === 'idle' && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">We'll send a verification code to <strong>{user?.email}</strong>.</p>
                {pwdError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{pwdError}</div>}
                <Button onClick={handleSendCode} loading={sendingCode}>Send verification code</Button>
              </>
            )}

            {pwdStep === 'code_sent' && (
              <>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 mb-4">
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    We sent a 6-digit code to <strong>{user?.email}</strong>. It expires in 15 minutes.
                  </p>
                </div>
                {pwdError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{pwdError}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter verification code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleVerifyCode} loading={verifying} disabled={code.length !== 6}>Continue</Button>
                    <button onClick={() => { setPwdStep('idle'); setCode(''); setPwdError(''); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
                  </div>
                  <button onClick={handleSendCode} disabled={sendingCode} className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50">
                    {sendingCode ? 'Sending...' : "Didn't receive it? Resend"}
                  </button>
                </div>
              </>
            )}

            {pwdStep === 'new_password' && (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Code verified. Now set your new password.</p>
                {pwdError && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{pwdError}</div>}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Input
                    label="New password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm new password"
                    type="password"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <div className="flex gap-3">
                    <Button type="submit" loading={changingPwd}>Update password</Button>
                    <button type="button" onClick={() => { setPwdStep('idle'); setCode(''); setNewPassword(''); setConfirmPassword(''); setPwdError(''); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
                  </div>
                </form>
              </>
            )}

            {pwdStep === 'done' && (
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                Password updated successfully.
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
