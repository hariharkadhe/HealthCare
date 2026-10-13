import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Stethoscope, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { api } from '../lib/api';
import { Department } from '../types';

export const DoctorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      avatarUrl: '',
      qualification: '',
      specialization: '',
      departmentId: '',
      experience: 5,
      consultationFee: 500,
      consultationDuration: 20,
      roomNumber: 'Room 101',
      phone: '',
      email: '',
      isActive: true,
    },
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (res.success) {
          setDepartments(res.data || []);
          if (!isEdit && res.data?.length > 0) {
            setValue('departmentId', res.data[0]._id);
          }
        }
      } catch (e) {
        // non-fatal
      }
    };
    loadDepartments();

    if (isEdit) {
      const loadDoctor = async () => {
        try {
          const res = await api.get(`/doctors/${id}`);
          if (res.success && res.data) {
            const doc = res.data;
            setValue('fullName', doc.fullName);
            setValue('avatarUrl', doc.avatarUrl || '');
            setValue('qualification', doc.qualification);
            setValue('specialization', doc.specialization);
            setValue(
              'departmentId',
              typeof doc.departmentId === 'object' ? doc.departmentId._id : doc.departmentId
            );
            setValue('experience', doc.experience);
            setValue('consultationFee', doc.consultationFee);
            setValue('consultationDuration', doc.consultationDuration);
            setValue('roomNumber', doc.roomNumber || 'Room 101');
            setValue('phone', doc.phone || '');
            setValue('email', doc.email || '');
            setValue('isActive', doc.isActive);
          }
        } catch (e) {
          // non-fatal
        }
      };
      loadDoctor();
    }
  }, [id, isEdit]);

  const onSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setError(null);

    // Build standard default weekly schedule if new doctor
    const standardWeeklySchedule = [1, 2, 3, 4, 5, 6].map((day) => ({
      dayOfWeek: day,
      isAvailable: true,
      startTime: '09:00',
      endTime: '17:00',
      breaks: [
        { startTime: '11:00', endTime: '11:30', label: 'Morning Tea Break' },
        { startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
      ],
      maxCapacity: 30,
    }));

    const payload = {
      ...formData,
      experience: Number(formData.experience),
      consultationFee: Number(formData.consultationFee),
      consultationDuration: Number(formData.consultationDuration),
      ...(isEdit ? {} : { weeklySchedule: standardWeeklySchedule }),
    };

    try {
      if (isEdit) {
        await api.patch(`/doctors/${id}`, payload);
      } else {
        await api.post('/doctors', payload);
      }
      navigate('/doctors');
    } catch (err: any) {
      setError(err.message || 'Failed to save doctor details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isEdit ? 'Edit Doctor Profile' : 'Add New Hospital Doctor'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinical qualifications, department, fee, and consultation timing
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/doctors')}
        >
          Cancel
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doctor Full Name"
              required
              placeholder="e.g. Dr. Rajesh Patel"
              {...register('fullName', { required: true })}
            />

            <Select label="Medical Department" required {...register('departmentId')}>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </Select>

            <Input
              label="Medical Qualification"
              required
              placeholder="e.g. MBBS, MD (General Medicine)"
              {...register('qualification', { required: true })}
            />

            <Input
              label="Clinical Specialization"
              required
              placeholder="e.g. Interventional Cardiology"
              {...register('specialization', { required: true })}
            />

            <Input
              label="Years of Experience"
              type="number"
              required
              {...register('experience', { required: true })}
            />

            <Input
              label="Consultation Fee (INR)"
              type="number"
              required
              {...register('consultationFee', { required: true })}
            />

            <Select
              label="Consultation Slot Duration"
              required
              {...register('consultationDuration')}
              options={[
                { label: '15 Minutes', value: '15' },
                { label: '20 Minutes', value: '20' },
                { label: '30 Minutes', value: '30' },
                { label: '45 Minutes', value: '45' },
              ]}
            />

            <Input
              label="Consulting Room / Suite"
              placeholder="e.g. Room 204 (Wing B)"
              {...register('roomNumber')}
            />

            <Input label="Contact Phone" placeholder="+91 98765 43210" {...register('phone')} />

            <Input
              label="Doctor Email"
              type="email"
              placeholder="doctor@medicarepro.com"
              {...register('email')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Avatar / Profile Photograph URL"
                placeholder="https://..."
                {...register('avatarUrl')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => navigate('/doctors')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              {isEdit ? 'Update Doctor Profile' : 'Save & Configure Schedule'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
