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
      setSuccessMsg('Nombre actualizado correctamente.');
    } catch {
      setErrorMsg('No se pudo actualizar el nombre.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setErrorMsg('Las contraseñas no coinciden.'); return; }
    if (newPassword.length < 6) { setErrorMsg('La contraseña debe tener al menos 6 caracteres.'); return; }
    setSavingPwd(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await apiClient.patch('/auth/password', { currentPassword, newPassword });
      setSuccessMsg('Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMsg('No se pudo cambiar la contraseña. Verifica la contraseña actual.');
    } finally {
      setSavingPwd(false);
    }
  };

  const isPro = user?.subscriptionStatus === 'PRO';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
          <p className="text-gray-500 mb-8">Administra tu cuenta y preferencias.</p>

          {successMsg && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">{successMsg}</div>}
          {errorMsg && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6">{errorMsg}</div>}

          {/* Plan badge */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">Plan actual</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${isPro ? 'text-green-700' : 'text-gray-700'}`}>
                    {isPro ? 'PRO' : 'Gratuito'}
                  </span>
                  {isPro && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Activo</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {isPro ? 'Regalos ilimitados sin comisión.' : 'Hasta 5 regalos con comisión del 2.5%.'}
                </div>
              </div>
              {!isPro && (
                <Link to="/pricing">
                  <Button size="sm">Upgrade a PRO</Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Info */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información personal</h2>
            <form onSubmit={handleSaveName} className="space-y-4">
              <Input
                label="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                value={user?.email ?? ''}
                disabled
              />
              <Button type="submit" loading={saving}>Guardar cambios</Button>
            </form>
          </Card>

          {/* Password */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar contraseña</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={savingPwd}>Cambiar contraseña</Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
