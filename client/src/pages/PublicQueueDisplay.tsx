import React, { useState, useEffect } from 'react';
import { Hospital, Clock, Volume2, UserCheck } from 'lucide-react';
import { api } from '../lib/api';

export const PublicQueueDisplay: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPublicQueue = async () => {
    try {
      const res = await api.get('/queue/public');
      if (res.success && res.data) {
        setQueue(res.data);
      }
    } catch (err) {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchPublicQueue();
    const interval = setInterval(fetchPublicQueue, 8000); // 8s live refresh
    return () => clearInterval(interval);
  }, []);

  const inConsultationList = queue.filter((q) => q.queueStatus === 'In Consultation');
  const waitingList = queue.filter((q) => q.queueStatus === 'Waiting');

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col p-6 sm:p-10">
      {/* Header Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white shadow-xl shadow-sky-500/20">
            <Hospital className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              MEDICARE PRO CENTRAL HOSPITAL
            </h1>
            <p className="text-xs sm:text-sm text-sky-400 font-medium tracking-wide">
              OUTPATIENT CLINIC QUEUE STATUS MONITOR
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums text-white">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </header>

      {/* Main Display Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
        {/* Left Column: Now Calling / In Consultation */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-sm">
            <Volume2 className="h-5 w-5 animate-pulse" />
            <span>Now In Consultation Room</span>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {inConsultationList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl bg-slate-900/60 border border-slate-800/80 p-8 text-center text-slate-500">
                Doctors preparing for incoming consultations.
              </div>
            ) : (
              inConsultationList.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl bg-gradient-to-r from-sky-950/80 to-slate-900 border-2 border-sky-500/60 p-6 shadow-2xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest block">
                      TOKEN NUMBER
                    </span>
                    <div className="text-6xl font-black text-white tracking-tight mt-1">
                      {item.tokenNumber}
                    </div>
                    <span className="text-sm text-slate-300 mt-2 block font-medium">
                      Patient: <strong className="text-white">{item.maskedPatientName}</strong>
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      Please Enter Room
                    </span>
                    <h3 className="text-xl font-bold text-white mt-2">{item.doctorName}</h3>
                    <p className="text-sky-300 text-sm font-semibold">{item.roomNumber}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Up Next in Queue */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-sm">
            <Clock className="h-5 w-5" />
            <span>Next In Waiting Queue</span>
          </div>

          <div className="flex-1 rounded-2xl bg-slate-900/60 border border-slate-800 p-4 overflow-y-auto max-h-[600px]">
            {waitingList.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No patients currently in the waiting line.
              </div>
            ) : (
              <div className="space-y-3">
                {waitingList.map((item, index) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/70 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-14 items-center justify-center rounded-xl bg-sky-600 text-white font-black text-xl shadow-md">
                        {item.tokenNumber}
                      </div>
                      <div>
                        <strong className="text-base font-bold text-white block">
                          {item.maskedPatientName}
                        </strong>
                        <span className="text-xs text-slate-400">
                          {item.doctorName} • {item.roomNumber}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2.5 py-1 rounded-full block">
                        Position #{index + 1}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        ~{item.estimatedWaitMinutes || 10} mins wait
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <p>
          Please remain in the waiting lounge until your token number is displayed on this monitor.
        </p>
        <p>Reception Assistance: Counter 1 & 2 • Emergency: Dial 108</p>
      </footer>
    </div>
  );
};
