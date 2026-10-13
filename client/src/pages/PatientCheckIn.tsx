import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  AlertCircle,
  Calendar,
  Stethoscope,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import { Appointment, QueueEntry } from '../types';
import { formatDate, formatTime } from '../lib/utils';

export const PatientCheckIn: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedAppointments, setMatchedAppointments] = useState<Appointment[]>([]);
  const [checkedInResult, setCheckedInResult] = useState<{
    appointment: Appointment;
    queueEntry: QueueEntry;
  } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    setMatchedAppointments([]);

    try {
      // Find today's appointments matching query
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/appointments', {
        date: today,
        search: searchQuery.trim(),
      });

      if (res.success && res.data?.appointments) {
        if (res.data.appointments.length === 0) {
          setError(`No scheduled appointments found today for "${searchQuery}".`);
        } else {
          setMatchedAppointments(res.data.appointments);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckInSubmit = async (aptId: string, priority: 'Normal' | 'Urgent' = 'Normal') => {
    setIsCheckingIn(true);
    setError(null);

    try {
      const res = await api.post(`/appointments/${aptId}/check-in`, { priority });
      if (res.success && res.data) {
        setCheckedInResult(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Check-in failed');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Walk-in Patient Arrival Check-In Desk
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Scan or enter patient appointment details to confirm arrival, issue token, and queue for
          doctor
        </p>
      </div>

      {/* Arrival Search Card */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Search Arriving Appointment:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Scan or enter Appointment ID (e.g. APT-20261013-1001), phone, or patient ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSearching}
              icon={<Search className="h-4 w-4" />}
            >
              Verify Appointment
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </Card>

      {/* Matched Appointments List */}
      {matchedAppointments.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Verified Appointments Found Today ({matchedAppointments.length})
          </h3>

          <div className="space-y-3">
            {matchedAppointments.map((apt) => (
              <div
                key={apt._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-bold text-slate-900">
                      {apt.patientId?.fullName}
                    </strong>
                    <span className="font-mono text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {apt.appointmentId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Dr. {apt.doctorId?.fullName} • Slot: {formatTime(apt.startTime)} -{' '}
                    {formatTime(apt.endTime)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Phone: {apt.patientId?.phone} • Current Status:{' '}
                    <span className="font-medium text-slate-700">{apt.status}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {apt.status === 'Scheduled' ? (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        isLoading={isCheckingIn}
                        onClick={() => handleCheckInSubmit(apt.appointmentId, 'Normal')}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                      >
                        Confirm Arrival & Issue Token
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCheckInSubmit(apt.appointmentId, 'Urgent')}
                      >
                        Urgent Priority
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                        Checked In (Token: {apt.tokenNumber})
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Printer className="h-4 w-4" />}
                        onClick={() => setSelectedReceiptApt(apt)}
                      >
                        Print Token Slip
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Arrival Token Card Modal */}
      <Modal
        isOpen={!!checkedInResult}
        onClose={() => setCheckedInResult(null)}
        title="Check-In Complete — Queue Token Issued"
      >
        <div className="space-y-5 text-center py-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {checkedInResult?.appointment.patientId?.fullName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Scheduled with Dr. {checkedInResult?.appointment.doctorId?.fullName} (
              {checkedInResult?.appointment.doctorId?.roomNumber})
            </p>
          </div>

          {/* Large Token Box */}
          <div className="rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 p-6 text-white shadow-lg shadow-sky-500/20">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-100 block">
              Waiting Queue Token
            </span>
            <div className="text-5xl font-black mt-1 tracking-tight">
              {checkedInResult?.queueEntry.tokenNumber}
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-sky-100">
              <Clock className="h-4 w-4" />
              <span>
                Estimated Wait Time: ~
                {checkedInResult?.queueEntry.estimatedWaitMinutes || 10} minutes
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 text-left">
            <p className="font-semibold text-slate-800 mb-0.5">Waiting Room Display Notice:</p>
            Please watch the public monitors in Waiting Area Wing A. Your token number will be
            announced when the doctor is ready.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCheckedInResult(null)}>
              Done
            </Button>
            <Button
              variant="primary"
              icon={<Printer className="h-4 w-4" />}
              onClick={() => {
                const apt = checkedInResult?.appointment;
                setCheckedInResult(null);
                if (apt) setSelectedReceiptApt(apt);
              }}
            >
              Print Token Slip
            </Button>
          </div>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptApt}
        onClose={() => setSelectedReceiptApt(null)}
        appointment={selectedReceiptApt}
      />
    </div>
  );
};
