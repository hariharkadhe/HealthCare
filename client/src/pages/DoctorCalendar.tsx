import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarDays, Filter, Stethoscope } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/Spinner';
import { ReceiptModal } from '../components/appointments/ReceiptModal';
import { api } from '../lib/api';
import { Doctor, Appointment } from '../types';

export const DoctorCalendar: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReceiptApt, setSelectedReceiptApt] = useState<Appointment | null>(null);

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

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/appointments', {
          doctorId: selectedDoctorId || undefined,
          limit: 100,
        });
        if (res.success && res.data) {
          setAppointments(res.data.appointments || []);
        }
      } catch (err) {
        console.error('Failed to load appointments for calendar:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAppointments();
  }, [selectedDoctorId]);

  // Convert appointments into FullCalendar events
  const events = appointments.map((apt) => {
    let backgroundColor = '#0284c7'; // default sky
    if (apt.status === 'Completed') backgroundColor = '#10b981';
    else if (apt.status === 'In Consultation') backgroundColor = '#8b5cf6';
    else if (apt.status === 'Checked In' || apt.status === 'Waiting') backgroundColor = '#f59e0b';
    else if (apt.status === 'Cancelled') backgroundColor = '#ef4444';

    return {
      id: apt._id,
      title: `${apt.patientId?.fullName || 'Patient'} (Dr. ${apt.doctorId?.fullName})`,
      start: `${apt.appointmentDate}T${apt.startTime}:00`,
      end: `${apt.appointmentDate}T${apt.endTime}:00`,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: {
        appointment: apt,
      },
    };
  });

  const handleEventClick = (info: any) => {
    const apt = info.event.extendedProps.appointment;
    if (apt) {
      setSelectedReceiptApt(apt);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Doctor Consultation Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily, weekly, and monthly schedule view powered by FullCalendar
          </p>
        </div>

        {/* Doctor Filter */}
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-slate-400" />
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Hospital Clinicians</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.fullName} ({d.specialization})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Container */}
      <Card className="p-4 sm:p-6 bg-white">
        {isLoading ? (
          <LoadingState message="Rendering clinical schedule calendar..." />
        ) : (
          <div className="text-xs calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              slotMinTime="08:00:00"
              slotMaxTime="20:00:00"
              allDaySlot={false}
              events={events}
              eventClick={handleEventClick}
              height="auto"
              nowIndicator={true}
              expandRows={true}
            />
          </div>
        )}
      </Card>

      {/* Appointment Detail / Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptApt}
        onClose={() => setSelectedReceiptApt(null)}
        appointment={selectedReceiptApt}
      />
    </div>
  );
};
