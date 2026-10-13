import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, CheckCircle2, User, Key } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'receptionist' | 'doctor'>('receptionist');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success) setUsers(res.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/users', { name, email, password, role });
      if (res.success) {
        setShowModal(false);
        setName('');
        setEmail('');
        setPassword('');
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await api.patch(`/users/${userId}`, { isActive: !currentStatus });
      if (res.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Accounts & Roles
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage hospital staff credentials and role-based permissions
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowModal(true)}
        >
          Add Staff Account
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <LoadingState message="Loading hospital staff accounts..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Staff Name</th>
                  <th className="px-5 py-3">Email Address</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Created Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'doctor'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          u.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant={u.isActive ? 'outline' : 'teal'}
                        onClick={() => handleToggleActive(u._id, u.isActive)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Staff User Account"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {error && <p className="text-xs text-rose-600">{error}</p>}

          <Input
            label="Staff Full Name"
            required
            placeholder="e.g. David Miller"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="staff@medicarepro.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Initial Password"
            type="password"
            required
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Select
            label="Role Assignment"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            options={[
              { label: 'Receptionist (Bookings, Check-in, Queue)', value: 'receptionist' },
              { label: 'Doctor (Consultations, Assigned visits)', value: 'doctor' },
              { label: 'Administrator (Full System Control)', value: 'admin' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
