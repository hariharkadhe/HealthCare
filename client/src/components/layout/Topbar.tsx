import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  Plus,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { formatDate } from '../../lib/utils';

export const Topbar: React.FC<{ onToggleSidebar: () => void }> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchNotifications();
    const pollInterval = setInterval(fetchNotifications, 20000); // 20s live sync
    return () => clearInterval(pollInterval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch (err) {
      // non-fatal
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/patients?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient ID, name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
          />
        </form>
      </div>

      {/* Right: Clock, Notifications & Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Hospital Clock & Date */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-sky-600" />
          <span className="font-medium text-slate-700">
            {formatDate(currentTime.toISOString())}
          </span>
          <span className="text-slate-300">|</span>
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span className="font-semibold text-slate-800 tabular-nums">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>

        {/* Quick Book Appointment Action */}
        <Button
          size="sm"
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/appointments/book')}
          className="hidden sm:inline-flex"
        >
          Book Appointment
        </Button>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Hospital Alerts</h4>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No hospital notifications yet
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 text-xs transition-colors hover:bg-slate-50 ${
                        !notif.readAt ? 'bg-sky-50/40 font-medium' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-sky-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800">{notif.title}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
