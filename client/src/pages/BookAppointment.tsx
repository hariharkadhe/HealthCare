import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  Search,
  User,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { SlotSelector } from '../components/appointments/SlotSelector';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import {
  Patient,
  Doctor,
  Department,
  DayAvailability,
  Slot,
  Appointment,
} from '../types';
import { formatCurrency, formatDate, formatTime } from '../lib/utils';

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state (Steps 1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data collections
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);

  // Selections
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  });
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [appointmentType, setAppointmentType] = useState<'New Consultation' | 'Follow-up' | 'Emergency' | 'Routine Checkup'>('New Consultation');
  const [notes, setNotes] = useState<string>('');

  // UI state
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);

  // Load initial departments & patients
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [deptRes, patRes, docRes] = await Promise.all([
          api.get('/departments'),
          api.get('/patients', { limit: 10 }),
          api.get('/doctors', { isActive: 'true' }),
        ]);
        if (deptRes.success) setDepartments(deptRes.data || []);
        if (patRes.success) setPatients(patRes.data?.patients || []);
        if (docRes.success) setDoctors(docRes.data || []);
      } catch (err) {
        console.error('Failed to load initial booking data:', err);
      }
    };
    loadInitialData();
  }, []);

  // Filter doctors when department changes
  const filteredDoctors = selectedDeptId
    ? doctors.filter((doc) => {
        const dId = typeof doc.departmentId === 'object' ? doc.departmentId._id : doc.departmentId;
        return dId === selectedDeptId;
      })
    : doctors;

  // Search patients
  const handleSearchPatient = async (val: string) => {
    setPatientSearch(val);
    if (!val.trim()) return;
    try {
      const res = await api.get('/patients', { search: val });
      if (res.success && res.data?.patients) {
        setPatients(res.data.patients);
      }
    } catch (err) {
      // non-fatal
    }
  };

  // Fetch slot availability from engine when doctor or date changes
  const fetchAvailability = async (docId: string, dateStr: string) => {
    if (!docId || !dateStr) return;
    setIsLoadingSlots(true);
    setBookingError(null);
    try {
      const res = await api.get(`/doctors/${docId}/availability`, { date: dateStr });
      if (res.success && res.data) {
        setAvailability(res.data);
        setSelectedSlot(null);
      }
    } catch (err: any) {
      setBookingError(err.message || 'Failed to load availability slots');
      setAvailability(null);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailability(selectedDoctorId, selectedDate);
    }
  }, [selectedDoctorId, selectedDate]);

  const selectedDoctorObj = doctors.find((d) => d._id === selectedDoctorId);

  // Step validation
  const canProceedStep1 = !!selectedPatient;
  const canProceedStep2 = !!selectedDoctorId && !!selectedDeptId;
  const canProceedStep3 = !!selectedSlot;

  // Final Submit
  const handleConfirmBooking = async () => {
    if (!selectedPatient || !selectedDoctorId || !selectedDeptId || !selectedSlot) {
      setBookingError('Please complete all required steps before booking.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const res = await api.post('/appointments', {
        patientId: selectedPatient._id,
        doctorId: selectedDoctorId,
        departmentId: selectedDeptId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        appointmentType,
        consultationFee: selectedDoctorObj?.consultationFee || 500,
        bookingSource: 'Walk-in',
        notes,
      });

      if (res.success && res.data) {
        setBookedAppointment(res.data);
      }
    } catch (err: any) {
      setBookingError(
        err.message ||
          'Failed to reserve slot. It may have been just booked by another receptionist. Please pick another slot.'
      );
      // Reload slots to reflect latest state
      if (selectedDoctorId && selectedDate) {
        fetchAvailability(selectedDoctorId, selectedDate);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Select Patient' },
    { num: 2, title: 'Doctor & Dept' },
    { num: 3, title: 'Slot & Timing' },
    { num: 4, title: 'Review & Book' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Book Walk-in Appointment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time availability validation & queue token generation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => navigate('/patients/register')}
        >
          Register New Patient First
        </Button>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`p-3 rounded-xl border text-center transition-all ${
              currentStep === s.num
                ? 'bg-sky-50 border-sky-300 text-sky-800 font-bold shadow-sm'
                : currentStep > s.num
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-400'
            }`}
          >
            <span className="text-[10px] block uppercase tracking-wider text-slate-400">
              Step 0{s.num}
            </span>
            <span className="text-xs sm:text-sm font-semibold">{s.title}</span>
          </div>
        ))}
      </div>

      {bookingError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong>Booking Notice:</strong> {bookingError}
          </div>
        </div>
      )}

      {/* STEP 1: Patient Selection */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Step 1: Select Walk-in Patient</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Search by patient ID, name, or phone number, or register a new walk-in record.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID (e.g. PAT-1001), phone, or patient name..."
              value={patientSearch}
              onChange={(e) => handleSearchPatient(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
            {patients.map((pat) => {
              const isSelected = selectedPatient?._id === pat._id;
              return (
                <div
                  key={pat._id}
                  onClick={() => setSelectedPatient(pat)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/70 shadow-sm ring-2 ring-sky-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-slate-900">{pat.fullName}</strong>
                    <span className="font-mono text-xs font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                      {pat.patientId}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>Phone: {pat.phone}</span>
                    <span>•</span>
                    <span>Gender: {pat.gender}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              variant="primary"
              disabled={!canProceedStep1}
              onClick={() => setCurrentStep(2)}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Doctor Selection
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Department & Doctor Selection */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Step 2: Choose Department & Doctor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select medical department and specialist for patient {selectedPatient?.fullName}.
            </p>
          </div>

          {/* Department Selection Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Medical Department:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {departments.map((dept) => {
                const isSelected = selectedDeptId === dept._id;
                return (
                  <button
                    key={dept._id}
                    type="button"
                    onClick={() => {
                      setSelectedDeptId(dept._id);
                      setSelectedDoctorId(''); // reset doctor
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 font-bold text-sky-900 ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold block">{dept.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{dept.code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Doctor Selection Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Specialist Doctor:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredDoctors.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-400">
                  No active doctors in this department. Please choose another department.
                </div>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = selectedDoctorId === doc._id;
                  return (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDoctorId(doc._id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 shadow-sm ring-2 ring-sky-500/30'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-sm font-bold text-slate-900 block">
                            {doc.fullName}
                          </strong>
                          <span className="text-xs text-sky-700 font-medium">
                            {doc.specialization}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {formatCurrency(doc.consultationFee)}
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{doc.qualification}</span>
                        <span>{doc.roomNumber}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!canProceedStep2}
              onClick={() => setCurrentStep(3)}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Continue to Slot Selection
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Slot & Timing Selection via Dynamic Engine */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Step 3: Select Date & Available Consultation Slot
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Slots for Dr. {selectedDoctorObj?.fullName} ({selectedDoctorObj?.specialization})
              </p>
            </div>
            {/* Date Input */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Slot Selector */}
          <SlotSelector
            availability={availability}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
            isLoading={isLoadingSlots}
          />

          {/* Consultation Type & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <Select
              label="Consultation Type"
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value as any)}
              options={[
                { label: 'New Consultation', value: 'New Consultation' },
                { label: 'Follow-up Consultation', value: 'Follow-up' },
                { label: 'Emergency Walk-in', value: 'Emergency' },
                { label: 'Routine Checkup', value: 'Routine Checkup' },
              ]}
            />
            <Input
              label="Clinical / Reception Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Mild headache, fever for 2 days"
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(2)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!canProceedStep3}
              onClick={() => setCurrentStep(4)}
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Review & Finalize Booking
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Review & Finalize Booking */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Step 4: Review & Confirm Appointment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify booking parameters before atomic slot reservation and queue token generation.
            </p>
          </div>

          {/* Summary Details Grid */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                Patient Information
              </h4>
              <p>
                <span className="text-slate-500">Patient Name:</span>{' '}
                <strong className="text-slate-900 font-bold">{selectedPatient?.fullName}</strong>
              </p>
              <p>
                <span className="text-slate-500">Patient ID:</span>{' '}
                <span className="font-mono font-medium text-sky-700">
                  {selectedPatient?.patientId}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Mobile Number:</span>{' '}
                <span className="text-slate-800">{selectedPatient?.phone}</span>
              </p>
              <p>
                <span className="text-slate-500">Gender / DOB:</span>{' '}
                <span className="text-slate-800">
                  {selectedPatient?.gender} ({selectedPatient?.dateOfBirth})
                </span>
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
                Clinical Details
              </h4>
              <p>
                <span className="text-slate-500">Consulting Doctor:</span>{' '}
                <strong className="text-slate-900 font-bold">
                  {selectedDoctorObj?.fullName}
                </strong>
              </p>
              <p>
                <span className="text-slate-500">Specialization:</span>{' '}
                <span className="text-slate-800">{selectedDoctorObj?.specialization}</span>
              </p>
              <p>
                <span className="text-slate-500">Room / Suite:</span>{' '}
                <span className="text-slate-800">
                  {selectedDoctorObj?.roomNumber || 'Room 101'}
                </span>
              </p>
              <p>
                <span className="text-slate-500">Appointment Date:</span>{' '}
                <strong className="text-slate-900">{formatDate(selectedDate)}</strong>
              </p>
              <p>
                <span className="text-slate-500">Reserved Slot:</span>{' '}
                <strong className="text-sky-700 font-bold">
                  {formatTime(selectedSlot?.startTime || '')} -{' '}
                  {formatTime(selectedSlot?.endTime || '')}
                </strong>
              </p>
              <p className="pt-2 border-t border-slate-200 text-sm">
                <span className="text-slate-600 font-medium">Consultation Fee:</span>{' '}
                <strong className="text-base font-extrabold text-sky-700">
                  {formatCurrency(selectedDoctorObj?.consultationFee || 500)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(3)}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Change Slot
            </Button>
            <Button
              variant="teal"
              size="lg"
              isLoading={isSubmitting}
              onClick={handleConfirmBooking}
              icon={<CheckCircle2 className="h-5 w-5" />}
            >
              Confirm Booking & Generate Receipt
            </Button>
          </div>
        </Card>
      )}

      {/* Official Receipt Modal (Popped upon successful booking) */}
      <ReceiptModal
        isOpen={!!bookedAppointment}
        onClose={() => {
          setBookedAppointment(null);
          navigate('/dashboard');
        }}
        appointment={bookedAppointment}
      />
    </div>
  );
};
