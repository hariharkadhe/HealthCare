import React, { useState, useEffect } from 'react';
import { Building2, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Department } from '../types';

export const DepartmentManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.success) setDepartments(res.data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/departments', {
        name,
        code: code.toUpperCase(),
        description,
      });

      if (res.success) {
        setShowAddModal(false);
        setName('');
        setCode('');
        setDescription('');
        fetchDepartments();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Medical Departments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Clinical specialties, hospital wings, and departmental services
          </p>
        </div>

        {hasRole('admin') && (
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Department
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState message="Loading hospital departments..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <Card key={dept._id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {dept.code}
                  </span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      dept.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-2">{dept.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {dept.description || 'Clinical specialty department'}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Medical Department"
      >
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          {error && <p className="text-xs text-rose-600">{error}</p>}

          <Input
            label="Department Name"
            required
            placeholder="e.g. Ophthalmology"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Department Code (Short)"
            required
            placeholder="e.g. OPHTH"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <Input
            label="Department Description"
            placeholder="Clinical scope and services..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Create Department
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
