import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  UserCheck,
  CalendarX,
  CalendarClock,
  Printer,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { LoadingState } from '../components/ui/Spinner';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import {
  Appointment,
  AppointmentStatus,
  Doctor,
  Department,
} from '../types';
import { formatDate, formatTime, getStatusBadgeClass } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const AppointmentManagement: React.FC = () => {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<string>('');
  const [doctorFilter, setDoctorFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('Patient requested reschedule');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/departments'),
        ]);
        if (docRes.success) setDoctors(docRes.data || []);
        if (deptRes.success) setDepartments(deptRes.data || []);
      } catch (e) {
        // non-fatal
      }
    };
    loadMetadata();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await api.get('/appointments', {
        date: dateFilter || undefined,
        doctorId: doctorFilter || undefined,
        departmentId: deptFilter || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit: 15,
      });

      if (res.success && res.data) {
        setAppointments(res.data.appointments || []);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dateFilter, doctorFilter, deptFilter, statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAppointments();
  };

  // Check In patient
  const handleCheckIn = async (aptId: string) => {
    try {
      const res = await api.post(`/appointments/${aptId}/check-in`, { priority: 'Normal' });
      if (res.success) {
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to check in patient');
    }
  };

  // Status Change
  const handleStatusChange = async (aptId: string, status: AppointmentStatus) => {
    try {
      const res = await api.patch(`/appointments/${aptId}/status`, { status });
      if (res.success) {
        fetchAppointments();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Cancel Submit
  const handleCancelSubmit = async () => {
    if (!cancelModalApt) return;
    setIsCancelling(true);
    setActionError(null);
    try {
      const res = await api.post(`/appointments/${cancelModalApt.appointmentId}/cancel`, {
        reason: cancelReason,
      });
      if (res.success) {
        setCancelModalApt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  // Reschedule Submit
  const handleRescheduleSubmit = async () => {
    if (!rescheduleApt) return;
    setIsRescheduling(true);
    setActionError(null);
    try {
      const res = await api.post(`/appointments/${rescheduleApt.appointmentId}/reschedule`, {
        newDate: rescheduleDate,
        newStartTime: rescheduleStartTime,
        newEndTime: rescheduleEndTime,
        reason: rescheduleReason,
      });
      if (res.success) {
        setRescheduleApt(null);
        fetchAppointments();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule appointment');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Appointment Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {totalCount} hospital appointment records
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/appointments/book')}
        >
          Book Appointment
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Appointment ID (e.g. APT-20261013-1001)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <Button variant="secondary" type="submit">
            Search
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Doctor</label>
            <select
              value={doctorFilter}
              onChange={(e) => {
                setDoctorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Doctors</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Department
            </label>
            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 py-1.5 px-2.5 text-xs focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Checked In">Checked In</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No-show">No-show</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Appointments Table */}
      <Card>
        {isLoading ? (
          <LoadingState message="Fetching appointment records..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">ID & Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Doctor</th>
                  <th className="px-4 py-3">Slot Time</th>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No appointments matching these filters.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 block">
                          {apt.appointmentId}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {formatDate(apt.appointmentDate)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="text-slate-900 block">
                          {apt.patientId?.fullName || 'Walk-in'}
                        </strong>
                        <span className="text-[10px] text-slate-400">
                          {apt.patientId?.phone || apt.patientId?.patientId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{apt.doctorId?.fullName}</p>
                        <span className="text-[10px] text-slate-500">
                          {typeof apt.departmentId === 'object'
                            ? apt.departmentId.name
                            : 'Clinic'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                        {formatTime(apt.startTime)}
                      </td>
                      <td className="px-4 py-3 font-bold text-sky-700 whitespace-nowrap">
                        {apt.tokenNumber || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadgeClass(
                            apt.status
                          )}`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status === 'Scheduled' && (
                            <Button
                              size="sm"
                              variant="teal"
                              onClick={() => handleCheckIn(apt.appointmentId)}
                              title="Check In Arrived Patient"
                            >
                              Check In
                            </Button>
                          )}

                          {apt.status === 'Checked In' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(apt.appointmentId, 'In Consultation')}
                            >
                              Call In
                            </Button>
                          )}

                          {apt.status === 'In Consultation' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleStatusChange(apt.appointmentId, 'Completed')}
                            >
                              Complete
                            </Button>
                          )}

                          {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                            <>
                              <button
                                onClick={() => {
                                  setRescheduleApt(apt);
                                  setRescheduleDate(apt.appointmentDate);
                                  setRescheduleStartTime(apt.startTime);
                                  setRescheduleEndTime(apt.endTime);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                                title="Reschedule Slot"
                              >
                                <CalendarClock className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => setCancelModalApt(apt)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Cancel Appointment"
                              >
                                <CalendarX className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedReceiptApt(apt)}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Receipt"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Cancellation Modal */}
      <Modal
        isOpen={!!cancelModalApt}
        onClose={() => setCancelModalApt(null)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to cancel appointment{' '}
            <strong className="text-slate-800">{cancelModalApt?.appointmentId}</strong> for{' '}
            <strong>{cancelModalApt?.patientId?.fullName}</strong>? This will release the doctor's
            reservation.
          </p>

          <Input
            label="Cancellation Reason"
            required
            placeholder="e.g. Patient emergency, rescheduled by doctor"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />

          {actionError && <p className="text-xs text-rose-600">{actionError}</p>}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setCancelModalApt(null)}>
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isCancelling}
              disabled={!cancelReason.trim()}
              onClick={handleCancelSubmit}
            >
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Rescheduling appointment{' '}
            <strong className="text-slate-900">{rescheduleApt?.appointmentId}</strong> with Dr.{' '}
            {rescheduleApt?.doctorId?.fullName}.
          </p>

          <Input
            label="New Appointment Date"
            type="date"
            required
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="New Start Time"
              placeholder="HH:MM (e.g. 10:20)"
              required
              value={rescheduleStartTime}
              onChange={(e) => setRescheduleStartTime(e.target.value)}
            />
            <Input
              label="New End Time"
              placeholder="HH:MM (e.g. 10:40)"
              required
              value={rescheduleEndTime}
              onChange={(e) => setRescheduleEndTime(e.target.value)}
            />
          </div>

          <Input
            label="Reason for Reschedule"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />

          {actionError && <p className="text-xs text-rose-600">{actionError}</p>}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setRescheduleApt(null)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isRescheduling}
              onClick={handleRescheduleSubmit}
            >
              Confirm Reschedule
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
