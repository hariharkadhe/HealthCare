import React from 'react';
import { Clock, Coffee, Ban, CheckCircle, AlertCircle } from 'lucide-react';
import { Slot, DayAvailability } from '../../types';
import { formatTime, cn } from '../../lib/utils';

export interface SlotSelectorProps {
  availability: DayAvailability | null;
  selectedSlot: Slot | null;
  onSelectSlot: (slot: Slot) => void;
  isLoading?: boolean;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({
  availability,
  selectedSlot,
  onSelectSlot,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 py-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-11 rounded-lg bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!availability) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
        <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">Select a doctor and date to view live appointment slots</p>
      </div>
    );
  }

  if (!availability.isWorkingDay || availability.slots.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center text-amber-800">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
        <h4 className="font-semibold text-sm">No Appointment Slots Available</h4>
        <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
          {availability.message ||
            'The selected doctor is not scheduled for consultations on this day. Please choose another date or doctor.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Availability Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-slate-500">
            Total Slots: <strong className="text-slate-800">{availability.totalSlots}</strong>
          </span>
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {availability.availableCount} Available
          </span>
          <span className="text-slate-500 flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {availability.bookedCount} Booked
          </span>
        </div>
        <div className="text-slate-500 text-[11px]">
          Slot Duration: <strong>{availability.consultationDuration} mins</strong>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
        {availability.slots.map((slot) => {
          const isSelected = selectedSlot?.startTime === slot.startTime;
          const isAvailable = slot.status === 'available';

          let buttonClasses = '';
          let badgeIcon = null;

          if (slot.status === 'available') {
            buttonClasses = isSelected
              ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-600 ring-offset-2'
              : 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200 hover:border-sky-300 shadow-sm';
          } else if (slot.status === 'booked') {
            buttonClasses = 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed';
            badgeIcon = <span className="text-[10px] text-slate-400 block font-normal">Booked</span>;
          } else if (slot.status === 'break') {
            buttonClasses = 'bg-amber-50/70 text-amber-600 border-amber-200 cursor-not-allowed';
            badgeIcon = (
              <span className="text-[10px] text-amber-600 flex items-center justify-center gap-0.5">
                <Coffee className="h-2.5 w-2.5" /> Break
              </span>
            );
          } else if (slot.status === 'leave' || slot.status === 'blocked') {
            buttonClasses = 'bg-rose-50 text-rose-500 border-rose-200 cursor-not-allowed';
            badgeIcon = (
              <span className="text-[10px] text-rose-500 flex items-center justify-center gap-0.5">
                <Ban className="h-2.5 w-2.5" /> Blocked
              </span>
            );
          } else if (slot.status === 'past') {
            buttonClasses = 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed';
            badgeIcon = <span className="text-[10px] text-slate-400">Passed</span>;
          }

          return (
            <button
              key={slot.startTime}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectSlot(slot)}
              className={cn(
                'group flex flex-col items-center justify-center rounded-lg border py-2 px-2.5 text-xs font-medium transition-all duration-150',
                buttonClasses
              )}
            >
              <div className="flex items-center gap-1 font-semibold tabular-nums text-xs sm:text-sm">
                {formatTime(slot.startTime)}
              </div>
              {badgeIcon ? (
                badgeIcon
              ) : isSelected ? (
                <span className="text-[10px] text-sky-100 flex items-center gap-0.5 font-normal">
                  <CheckCircle className="h-2.5 w-2.5" /> Selected
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-normal">Available</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
