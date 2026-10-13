import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Plus,
  ArrowRight,
  UserCheck,
  Printer,
  ChevronRight,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/Spinner';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import { DashboardSummary, Appointment } from '../types';
import { formatTime, formatDate, getStatusBadgeClass } from '../lib/utils';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/summary');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, []);

  if (isLoading || !data) {
    return <LoadingState message="Loading today's hospital reception data..." />;
  }

  const { metrics, todayAppointments, waitingQueue, doctorStats, departmentStats } = data;

  const quickActions = [
    { label: 'Register Patient', desc: 'New walk-in patient ID', icon: Users, path: '/patients/register', color: 'bg-blue-500' },
    { label: 'Book Appointment', desc: 'Real-time slot engine', icon: Plus, path: '/appointments/book', color: 'bg-sky-600' },
    { label: 'Check In Patient', desc: 'Issue queue token', icon: UserCheck, path: '/check-in', color: 'bg-amber-500' },
    { label: 'Manage Doctors', desc: 'Specialties & fees', icon: Stethoscope, path: '/doctors', color: 'bg-emerald-600' },
    { label: 'Doctor Schedule', desc: 'Weekly hours & leave', icon: Clock, path: '/calendar', color: 'bg-purple-600' },
    { label: 'All Appointments', desc: 'Search & status filters', icon: CalendarCheck, path: '/appointments', color: 'bg-slate-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reception Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time walk-in desk metrics for{' '}
            <strong className="text-slate-700">{formatDate(data.date)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<UserCheck className="h-4 w-4" />}
            onClick={() => navigate('/check-in')}
          >
            Arriving Check-In
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/appointments/book')}
          >
            New Booking
          </Button>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 border-l-4 border-l-sky-500">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Total Today
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {metrics.totalAppointmentsToday}
          </div>
          <span className="text-[10px] text-slate-400">Scheduled Visits</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Waiting Queue
          </span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">
            {metrics.patientsWaiting + metrics.patientsCheckedIn}
          </div>
          <span className="text-[10px] text-amber-600">In Waiting Area</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">
            In Consultation
          </span>
          <div className="text-2xl font-extrabold text-purple-700 mt-1">
            {metrics.patientsInConsultation}
          </div>
          <span className="text-[10px] text-purple-600">With Doctor Now</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Completed
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {metrics.completedAppointments}
          </div>
          <span className="text-[10px] text-emerald-600">Finished Today</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-teal-500">
          <span className="text-[11px] font-medium text-teal-700 uppercase tracking-wider">
            Doctors on Duty
          </span>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">
            {metrics.doctorsAvailableToday}
          </div>
          <span className="text-[10px] text-teal-600">Active Schedules</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">
            Cancelled
          </span>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">
            {metrics.cancelledAppointments}
          </div>
          <span className="text-[10px] text-rose-600">Released Slots</span>
        </Card>
      </div>

      {/* 6 Quick Action Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-start p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition-all text-left group"
            >
              <div
                className={`p-2 rounded-lg text-white mb-2 shadow-sm ${action.color} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-sky-600 transition-colors">
                {action.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                {action.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split Layout: Today's Appointments & Waiting Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments Table (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Today's Appointments</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Walk-ins & pre-booked consultations
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/appointments')}
                icon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                View All
              </Button>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Slot Time</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-4 py-3">Doctor & Dept</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No appointments booked for today yet.
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.slice(0, 8).map((apt) => (
                      <tr key={apt._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {formatTime(apt.startTime)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {apt.patientId?.fullName || 'Walk-in Patient'}
                          </p>
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
                          <button
                            onClick={() => setSelectedReceiptApt(apt)}
                            className="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
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

          {/* Department Breakdown Bar */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Department Workload Distribution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {departmentStats.map((dept) => (
                <div
                  key={dept.departmentId}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70"
                >
                  <p className="text-xs font-semibold text-slate-800 truncate">{dept.name}</p>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-slate-500">Today:</span>
                    <strong className="text-sky-600 font-bold">{dept.count}</strong>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Live Waiting Queue & Doctor Status (1 Column) */}
        <div className="space-y-6">
          {/* Waiting Queue Overview */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Live Waiting Queue</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Active patients in waiting room</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/queue')}
                icon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Queue Desk
              </Button>
            </CardHeader>
            <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
              {waitingQueue.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Waiting queue is empty.
                </div>
              ) : (
                waitingQueue.map((entry) => (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 hover:bg-white transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-extrabold text-xs">
                        {entry.tokenNumber}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{entry.patientId?.fullName}</p>
                        <p className="text-[11px] text-slate-500">
                          Dr. {entry.doctorId?.fullName} • {entry.doctorId?.roomNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          entry.queueStatus === 'In Consultation'
                            ? 'purple'
                            : entry.queueStatus === 'Waiting'
                            ? 'amber'
                            : 'green'
                        }
                      >
                        {entry.queueStatus}
                      </Badge>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Wait: ~{entry.estimatedWaitMinutes || 15}m
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Doctor Availability Summary */}
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Doctor Consultations Summary
            </h4>
            <div className="space-y-2.5">
              {doctorStats.slice(0, 5).map((doc) => (
                <div
                  key={doc.doctorId}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-800">{doc.fullName}</p>
                    <span className="text-[10px] text-slate-400">
                      {doc.specialization} • {doc.roomNumber}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-700">{doc.totalAppointments} visits</span>
                    <span className="block text-[10px] text-emerald-600 font-medium">
                      {doc.completed} completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptApt}
        onClose={() => setSelectedReceiptApt(null)}
        appointment={selectedReceiptApt}
      />
    </div>
  );
};
