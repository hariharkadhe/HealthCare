import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Calendar,
  Coffee,
  Ban,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { Doctor, WeeklyScheduleItem } from '../types';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DoctorScheduleManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Exception Modal
  const [showExceptionModal, setShowExceptionModal] = useState<boolean>(false);
  const [excDate, setExcDate] = useState<string>('');
  const [excType, setExcType] = useState<'leave' | 'holiday' | 'blocked' | 'break'>('leave');
  const [excReason, setExcReason] = useState<string>('');
  const [excIsAllDay, setExcIsAllDay] = useState<boolean>(true);
  const [excStartTime, setExcStartTime] = useState<string>('');
  const [excEndTime, setExcEndTime] = useState<string>('');
  const [isAddingExc, setIsAddingExc] = useState<boolean>(false);

  const fetchDoctorAndSchedule = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [docRes, excRes] = await Promise.all([
        api.get(`/doctors/${id}`),
        api.get(`/doctors/${id}/schedule-exceptions`),
      ]);

      if (docRes.success && docRes.data) {
        setDoctor(docRes.data);
        setWeeklySchedule(docRes.data.weeklySchedule || []);
      }
      if (excRes.success && excRes.data) {
        setExceptions(excRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctor schedule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAndSchedule();
  }, [id]);

  const handleToggleDay = (dayIndex: number) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIndex ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: 'startTime' | 'endTime',
    val: string
  ) => {
    setWeeklySchedule((prev) =>
      prev.map((item) =>
        item.dayOfWeek === dayIndex ? { ...item, [field]: val } : item
      )
    );
  };

  const handleSaveSchedule = async () => {
    if (!doctor) return;
    setIsSaving(true);
    setSuccessMessage(null);
    try {
      const res = await api.put(`/doctors/${doctor.doctorId}/schedule`, {
        weeklySchedule,
      });
      if (res.success) {
        setSuccessMessage('Weekly schedule and consultation timings saved successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddException = async () => {
    if (!doctor || !excDate || !excReason.trim()) return;
    setIsAddingExc(true);
    try {
      const res = await api.post(`/doctors/${doctor.doctorId}/schedule-exceptions`, {
        date: excDate,
        exceptionType: excType,
        isAllDay: excIsAllDay,
        startTime: excIsAllDay ? null : excStartTime,
        endTime: excIsAllDay ? null : excEndTime,
        reason: excReason,
      });

      if (res.success) {
        setShowExceptionModal(false);
        setExcDate('');
        setExcReason('');
        fetchDoctorAndSchedule();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add exception');
    } finally {
      setIsAddingExc(false);
    }
  };

  if (isLoading || !doctor) {
    return <LoadingState message="Loading doctor schedule parameters..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Doctor Schedule & Shift Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Managing hours for <strong className="text-slate-800">{doctor.fullName}</strong> (
            {doctor.specialization})
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/doctors')}
        >
          Doctor Directory
        </Button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Weekly Hours Configuration */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Weekly Shift Schedule</h3>
            <p className="text-xs text-slate-500">
              Configure daily duty hours and automatic break deductions
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Slot Step: <strong>{doctor.consultationDuration} Minutes</strong>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map((dayName, dayIndex) => {
            const scheduleItem = weeklySchedule.find((s) => s.dayOfWeek === dayIndex);
            const isAvailable = scheduleItem?.isAvailable ?? false;
            const startTime = scheduleItem?.startTime ?? '09:00';
            const endTime = scheduleItem?.endTime ?? '17:00';

            return (
              <div
                key={dayIndex}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors ${
                  isAvailable
                    ? 'border-slate-200 bg-white'
                    : 'border-slate-100 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-36">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={() => handleToggleDay(dayIndex)}
                    className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <strong className="text-slate-900 font-semibold">{dayName}</strong>
                </div>

                {isAvailable ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Hours:</span>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => handleTimeChange(dayIndex, 'startTime', e.target.value)}
                        className="rounded border border-slate-300 py-1 px-2 text-xs font-medium"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => handleTimeChange(dayIndex, 'endTime', e.target.value)}
                        className="rounded border border-slate-300 py-1 px-2 text-xs font-medium"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Coffee className="h-3 w-3" />
                      <span>Breaks: 11:00-11:30 & 13:00-14:00</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Off Duty / Not Scheduled</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button
            variant="primary"
            isLoading={isSaving}
            onClick={handleSaveSchedule}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Save Weekly Schedule
          </Button>
        </div>
      </Card>

      {/* Schedule Exceptions: Leave, Holidays, Emergency Blocks */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Doctor Schedule Exceptions & Leave
            </h3>
            <p className="text-xs text-slate-500">
              Add blocked dates, conferences, personal leaves, or emergency surgery periods
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowExceptionModal(true)}
          >
            Add Exception
          </Button>
        </div>

        <div className="space-y-2.5">
          {exceptions.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No schedule exceptions or leave recorded for this doctor.
            </p>
          ) : (
            exceptions.map((exc) => (
              <div
                key={exc._id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{exc.date}</strong>
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                      {exc.exceptionType}
                    </span>
                    {!exc.isAllDay && exc.startTime && (
                      <span className="text-slate-500 text-[11px]">
                        ({exc.startTime} - {exc.endTime})
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs mt-0.5">{exc.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Exception Creation Modal */}
      <Modal
        isOpen={showExceptionModal}
        onClose={() => setShowExceptionModal(false)}
        title="Add Doctor Schedule Exception"
      >
        <div className="space-y-4">
          <Input
            label="Date of Exception"
            type="date"
            required
            value={excDate}
            onChange={(e) => setExcDate(e.target.value)}
          />

          <Select
            label="Exception Classification"
            value={excType}
            onChange={(e) => setExcType(e.target.value as any)}
            options={[
              { label: 'Doctor Personal Leave', value: 'leave' },
              { label: 'Official Hospital Holiday', value: 'holiday' },
              { label: 'Emergency Surgery / Blocked Hours', value: 'blocked' },
              { label: 'Custom Break Period', value: 'break' },
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAllDay"
              checked={excIsAllDay}
              onChange={(e) => setExcIsAllDay(e.target.checked)}
              className="rounded text-sky-600"
            />
            <label htmlFor="isAllDay" className="text-xs font-semibold text-slate-700">
              All Day Exception (Block entire schedule)
            </label>
          </div>

          {!excIsAllDay && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={excStartTime}
                onChange={(e) => setExcStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={excEndTime}
                onChange={(e) => setExcEndTime(e.target.value)}
              />
            </div>
          )}

          <Input
            label="Reason / Clinical Note"
            required
            placeholder="e.g. Attending Cardiology Symposium / Emergency Operation"
            value={excReason}
            onChange={(e) => setExcReason(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExceptionModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isAddingExc}
              onClick={handleAddException}
            >
              Save Exception
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
