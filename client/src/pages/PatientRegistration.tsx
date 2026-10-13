import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { api } from '../lib/api';
import { z } from 'zod';
import { Patient } from '../types';

const patientCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required (min 2 characters)'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB must be in YYYY-MM-DD format'),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']),
  phone: z.string().min(7, 'Valid contact number is required').max(15),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContact: z
    .object({
      name: z.string().default(''),
      phone: z.string().default(''),
      relation: z.string().default(''),
    })
    .optional(),
  notes: z.string().optional().or(z.literal('')),
});

export const PatientRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      gender: 'Male' as const,
      phone: '',
      email: '',
      address: '',
      emergencyContact: { name: '', phone: '', relation: '' },
      notes: '',
    },
  });

  const onSubmit = async (formData: any, forceDuplicate = false) => {
    setIsSubmitting(true);
    setServerError(null);
    setDuplicateWarning(null);

    try {
      const url = forceDuplicate ? '/patients?forceDuplicate=true' : '/patients';
      const res = await api.post(url, formData);

      if (res.success && res.data) {
        setRegisteredPatient(res.data);
      }
    } catch (err: any) {
      if (err.statusCode === 409 && err.warning === 'POSSIBLE_DUPLICATE') {
        setDuplicateWarning(err);
      } else {
        setServerError(err.message || 'Failed to register patient');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Walk-In Patient Registration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Create verified hospital registration record with automatic duplicate validation
        </p>
      </div>

      {serverError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {serverError}
        </div>
      )}

      {/* Registration Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
          {/* Section: Demographics */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
              Patient Demographics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                required
                placeholder="e.g. Rahul Sharma"
                {...register('fullName')}
                error={errors.fullName?.message as string}
              />

              <Input
                label="Date of Birth"
                type="date"
                required
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message as string}
              />

              <Select
                label="Gender"
                required
                {...register('gender')}
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' },
                  { label: 'Prefer not to say', value: 'Prefer not to say' },
                ]}
              />

              <Input
                label="Primary Mobile Number"
                required
                placeholder="10-digit mobile number"
                {...register('phone')}
                error={errors.phone?.message as string}
              />

              <Input
                label="Email Address (Optional)"
                type="email"
                placeholder="patient@example.com"
                {...register('email')}
                error={errors.email?.message as string}
              />

              <Input
                label="Residential Address"
                placeholder="Street, City, Postal Code"
                {...register('address')}
              />
            </div>
          </div>

          {/* Section: Emergency Contact */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
              Emergency Contact (Optional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Contact Name"
                placeholder="Family member name"
                {...register('emergencyContact.name')}
              />
              <Input
                label="Emergency Phone"
                placeholder="Contact number"
                {...register('emergencyContact.phone')}
              />
              <Input
                label="Relationship"
                placeholder="Spouse / Parent / Sibling"
                {...register('emergencyContact.relation')}
              />
            </div>
          </div>

          {/* Section: Clinical notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 pb-1 border-b border-slate-100">
              Clinical / Reception Intake Notes
            </h4>
            <textarea
              className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              rows={3}
              placeholder="Known drug allergies, past medical conditions, or visit rationale..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => navigate('/patients')}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Register & Generate Patient ID
            </Button>
          </div>
        </form>
      </Card>

      {/* Duplicate Phone Warning Modal */}
      <Modal
        isOpen={!!duplicateWarning}
        onClose={() => setDuplicateWarning(null)}
        title="Possible Duplicate Patient Detected"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm mb-1">Matching Phone Number Record Found</p>
              <p>{duplicateWarning?.message}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Hospital policy requires staff verification before creating duplicate accounts with the
            same phone number to prevent record fragmentation.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDuplicateWarning(null);
                if (duplicateWarning?.existingPatient?.patientId) {
                  navigate(`/patients/${duplicateWarning.existingPatient.patientId}`);
                }
              }}
            >
              Open Existing Patient Profile
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => onSubmit(getValues(), true)}
            >
              Verified: Register as Separate Person
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Confirmation Modal */}
      <Modal
        isOpen={!!registeredPatient}
        onClose={() => setRegisteredPatient(null)}
        title="Patient Registration Successful"
      >
        <div className="space-y-5 text-center py-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {registeredPatient?.fullName}
            </h3>
            <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1 font-mono text-sm font-bold text-sky-800 border border-sky-200">
              Patient ID: {registeredPatient?.patientId}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Registration record created. You can now immediately book an appointment or return to
              the directory.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${registeredPatient?.patientId}`)}
            >
              View Patient Profile
            </Button>
            <Button
              variant="primary"
              icon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => navigate('/appointments/book')}
            >
              Book Appointment Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
