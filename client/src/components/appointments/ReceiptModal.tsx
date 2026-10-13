import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, CalendarPlus, LayoutDashboard, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Appointment } from '../../types';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';

export interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  appointment,
}) => {
  const navigate = useNavigate();

  if (!appointment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="2xl">
      <div className="space-y-6">
        {/* Printable Receipt Container */}
        <div
          id="printable-receipt"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm font-sans"
        >
          {/* Hospital Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-base">
                  +
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  MEDICARE PRO CENTRAL HOSPITAL
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                450 Healthcare Way, Suite 100 • Metro City, KA 560001
              </p>
              <p className="text-xs text-slate-500">
                Phone: +91 (80) 2345-6789 • Emergency: 108 • reception@medicarepro.com
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-sky-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-700 border border-sky-200">
                Official Token Receipt
              </span>
              <p className="mt-1 text-[11px] text-slate-400">
                Issue Date: {formatDate(appointment.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>

          {/* Token Highlight Box */}
          <div className="my-5 flex items-center justify-between rounded-xl bg-gradient-to-r from-sky-50 to-teal-50 border border-sky-100 p-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
                Waiting Queue Token
              </span>
              <div className="text-3xl font-extrabold text-sky-900">
                {appointment.tokenNumber || 'A-01'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium text-slate-500">Appointment ID</span>
              <div className="font-mono text-base font-bold text-slate-800">
                {appointment.appointmentId}
              </div>
              <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                Status: {appointment.status}
              </span>
            </div>
          </div>

          {/* Patient & Doctor Detail Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 py-4">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Patient Details
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {appointment.patientId?.fullName}
              </p>
              <p className="text-slate-600 mt-0.5">
                ID: <span className="font-mono font-medium">{appointment.patientId?.patientId}</span>
              </p>
              <p className="text-slate-600">
                Contact: {appointment.patientId?.phone} • Gender: {appointment.patientId?.gender}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Doctor & Department
              </p>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {appointment.doctorId?.fullName}
              </p>
              <p className="text-slate-600 mt-0.5">
                Dept:{' '}
                <span className="font-medium text-slate-800">
                  {typeof appointment.departmentId === 'object'
                    ? appointment.departmentId.name
                    : 'Specialist Clinic'}
                </span>
              </p>
              <p className="text-slate-600">
                Room: {appointment.doctorId?.roomNumber || 'Room 101'}
              </p>
            </div>
          </div>

          {/* Schedule & Fee Table */}
          <div className="mt-4 pt-2">
            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-slate-600">Consultation Date & Slot:</span>
              <span className="font-semibold text-slate-900">
                {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)} -{' '}
                {formatTime(appointment.endTime)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-1">
              <span className="text-slate-600">Consultation Type:</span>
              <span className="font-medium text-slate-900">{appointment.appointmentType}</span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-t border-slate-100 mt-2 pt-2">
              <span className="font-semibold text-slate-800">Consultation Fee Payable:</span>
              <span className="text-base font-bold text-slate-900 text-sky-700">
                {formatCurrency(appointment.consultationFee)}
              </span>
            </div>
          </div>

          {/* Footer Guidelines */}
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed border border-slate-100">
            <div className="flex items-center gap-1.5 font-semibold text-slate-700 mb-0.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
              Reception Instructions:
            </div>
            Please report to Nursing Desk 15 minutes before your time slot. Bring this token slip.
            Consultation fee is payable at the billing counter.
          </div>
        </div>

        {/* Action Buttons (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 no-print">
          <Button
            variant="outline"
            icon={<LayoutDashboard className="h-4 w-4" />}
            onClick={() => {
              onClose();
              navigate('/dashboard');
            }}
          >
            Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<CalendarPlus className="h-4 w-4" />}
              onClick={() => {
                onClose();
                navigate('/appointments/book');
              }}
            >
              Book Another
            </Button>
            <Button
              variant="primary"
              icon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
