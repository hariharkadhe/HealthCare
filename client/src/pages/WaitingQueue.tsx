import React, { useState, useEffect } from 'react';
import {
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Tv,
  ArrowRight,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { QueueEntry, Doctor } from '../types';
import { formatTime } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const WaitingQueue: React.FC = () => {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        if (res.success) setDoctors(res.data || []);
      } catch (e) {
        // non-fatal
      }
    };
    loadDoctors();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/queue', {
        doctorId: selectedDoctorId || undefined,
      });
      if (res.success) {
        setQueue(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000); // 10s live sync
    return () => clearInterval(interval);
  }, [selectedDoctorId]);

  const handleUpdateStatus = async (queueId: string, status: string) => {
    try {
      const res = await api.patch(`/queue/${queueId}/status`, { status });
      if (res.success) {
        fetchQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const waitingCount = queue.filter((q) => q.queueStatus === 'Waiting').length;
  const inConsultCount = queue.filter((q) => q.queueStatus === 'In Consultation').length;
  const completedCount = queue.filter((q) => q.queueStatus === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clinical Waiting Queue Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage live patient queues for doctor consulting rooms
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<Tv className="h-4 w-4" />}
            onClick={() => window.open('/queue/display', '_blank')}
          >
            Launch Public TV Monitor
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<UserCheck className="h-4 w-4" />}
            onClick={() => navigate('/check-in')}
          >
            Arrival Check-In Desk
          </Button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-700 uppercase">Waiting Patients</span>
            <div className="text-3xl font-extrabold text-amber-700 mt-1">{waitingCount}</div>
          </div>
          <Clock className="h-8 w-8 text-amber-400" />
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-purple-700 uppercase">
              In Consultation
            </span>
            <div className="text-3xl font-extrabold text-purple-700 mt-1">{inConsultCount}</div>
          </div>
          <Play className="h-8 w-8 text-purple-400" />
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 uppercase">
              Completed Consultations
            </span>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{completedCount}</div>
          </div>
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </Card>
      </div>

      {/* Doctor Filter Bar */}
      <Card className="p-4 flex items-center gap-3">
        <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
          Filter by Doctor:
        </label>
        <select
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:ring-2 focus:ring-sky-500 max-w-xs"
        >
          <option value="">All Hospital Doctors</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.fullName} ({d.specialization})
            </option>
          ))}
        </select>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Live Queue List</CardTitle>
          <span className="text-xs text-slate-500">{queue.length} total entries</span>
        </CardHeader>

        {isLoading ? (
          <LoadingState message="Connecting to queue monitor..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Token #</th>
                  <th className="px-5 py-3">Patient Name</th>
                  <th className="px-5 py-3">Doctor & Room</th>
                  <th className="px-5 py-3">Check-In Time</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Queue Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No patients currently in the waiting queue.
                    </td>
                  </tr>
                ) : (
                  queue.map((entry) => (
                    <tr
                      key={entry._id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        entry.queueStatus === 'In Consultation' ? 'bg-purple-50/30 font-medium' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="flex h-8 w-11 items-center justify-center rounded-lg bg-sky-700 text-white font-extrabold text-xs shadow-sm">
                          {entry.tokenNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <strong className="text-slate-900 block">{entry.patientId?.fullName}</strong>
                        <span className="text-[10px] text-slate-400">
                          {entry.patientId?.phone || entry.patientId?.patientId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">{entry.doctorId?.fullName}</p>
                        <span className="text-[10px] text-slate-500">
                          {entry.doctorId?.roomNumber || 'Room 101'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {entry.checkInTime ? formatTime(entry.checkInTime.split('T')[1]?.slice(0, 5) || '') : '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {entry.priority === 'Urgent' ? (
                          <span className="inline-block rounded bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                            URGENT
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Normal</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={
                            entry.queueStatus === 'In Consultation'
                              ? 'purple'
                              : entry.queueStatus === 'Waiting'
                              ? 'amber'
                              : entry.queueStatus === 'Completed'
                              ? 'green'
                              : 'gray'
                          }
                        >
                          {entry.queueStatus}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {entry.queueStatus === 'Waiting' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleUpdateStatus(entry._id, 'In Consultation')}
                            >
                              Call to Room
                            </Button>
                          )}

                          {entry.queueStatus === 'In Consultation' && (
                            <Button
                              size="sm"
                              variant="teal"
                              onClick={() => handleUpdateStatus(entry._id, 'Completed')}
                            >
                              Complete Visit
                            </Button>
                          )}

                          {entry.queueStatus !== 'Completed' && entry.queueStatus !== 'No-show' && (
                            <button
                              onClick={() => handleUpdateStatus(entry._id, 'No-show')}
                              className="text-xs text-slate-400 hover:text-rose-600 p-1"
                              title="Mark No-Show"
                            >
                              No-Show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
