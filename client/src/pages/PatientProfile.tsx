import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  CalendarPlus,
  ArrowLeft,
  Printer,
  HeartPulse,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/Spinner';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import { Patient, Appointment } from '../types';
import { formatDate, formatTime, getStatusBadgeClass } from '../lib/utils';

export const PatientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [receiptApt, setReceiptApt] = useState<Appointment | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/patients/${id}`);
        if (res.success && res.data) {
          setPatient(res.data.patient);
          setAppointments(res.data.appointments || []);
        }
      } catch (err) {
        console.error('Failed to load patient profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (isLoading || !patient) {
    return <LoadingState message="Loading patient clinical record..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/patients')}
        >
          Back to Directory
        </Button>
        <Button
          variant="primary"
          icon={<CalendarPlus className="h-4 w-4" />}
          onClick={() => navigate('/appointments/book')}
        >
          Book Consultation
        </Button>
      </div>

      {/* Patient Bio & Details Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 font-extrabold text-xl">
              {patient.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{patient.fullName}</h2>
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {patient.patientId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registered on {formatDate(patient.registrationDate || patient.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
              {patient.gender}
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-medium">
              DOB: {formatDate(patient.dateOfBirth)}
            </span>
          </div>
        </div>

        {/* Contact and Emergency details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Contact Details
            </h4>
            <p className="flex items-center gap-2 text-slate-700">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {patient.phone}
            </p>
            {patient.email && (
              <p className="flex items-center gap-2 text-slate-700">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {patient.email}
              </p>
            )}
            {patient.address && (
              <p className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-3.5 w-3.5 text-slate-400" /> {patient.address}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Emergency Contact
            </h4>
            {patient.emergencyContact?.name ? (
              <>
                <p className="font-semibold text-slate-900">{patient.emergencyContact.name}</p>
                <p className="text-slate-600">
                  Relation: {patient.emergencyContact.relation || 'Not specified'}
                </p>
                <p className="text-slate-600">Phone: {patient.emergencyContact.phone}</p>
              </>
            ) : (
              <p className="text-slate-400 italic">No emergency contact on file</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Clinical Intake Notes
            </h4>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {patient.notes || 'No allergies or special intake notes recorded.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Appointment History */}
      <Card>
        <CardHeader>
          <CardTitle>Consultation & Appointment History</CardTitle>
          <span className="text-xs text-slate-500">{appointments.length} total visits</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Appointment ID</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Token</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No past or scheduled appointments recorded for this patient.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {apt.appointmentId}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-slate-900 block">
                        {formatDate(apt.appointmentDate)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {apt.doctorId?.fullName}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {typeof apt.departmentId === 'object' ? apt.departmentId.name : 'Clinical'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-sky-700">
                      {apt.tokenNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() =>
                          setReceiptApt({
                            ...apt,
                            patientId: patient,
                          })
                        }
                        className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                        title="Print Token Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptApt}
        onClose={() => setReceiptApt(null)}
        appointment={receiptApt}
      />
    </div>
  );
};
