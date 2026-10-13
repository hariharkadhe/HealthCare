import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  CalendarPlus,
  Users,
  CalendarDays,
  Clock,
  Stethoscope,
  Building2,
  ShieldCheck,
  FileText,
  Settings,
  Tv,
  LogOut,
  Hospital,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    {
      label: 'Main Operations',
      items: [
        { to: '/dashboard', label: 'Reception Dashboard', icon: LayoutDashboard },
        { to: '/check-in', label: 'Walk-in Check-In', icon: UserCheck },
        { to: '/appointments/book', label: 'Book Appointment', icon: CalendarPlus },
        { to: '/queue', label: 'Waiting Queue', icon: Clock },
        { to: '/queue/display', label: 'Public Queue Display', icon: Tv, external: true },
      ],
    },
    {
      label: 'Clinical & Directory',
      items: [
        { to: '/patients', label: 'Patient Directory', icon: Users },
        { to: '/appointments', label: 'All Appointments', icon: CalendarDays },
        { to: '/doctors', label: 'Doctor Directory', icon: Stethoscope },
        { to: '/calendar', label: 'Schedule Calendar', icon: CalendarDays },
        { to: '/departments', label: 'Departments', icon: Building2 },
      ],
    },
    ...(hasRole('admin')
      ? [
          {
            label: 'Hospital Administration',
            items: [
              { to: '/users', label: 'User & Roles', icon: ShieldCheck },
              { to: '/audit-logs', label: 'Audit Logs', icon: FileText },
              { to: '/settings', label: 'Hospital Settings', icon: Settings },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white shadow-lg shadow-sky-500/20">
            <Hospital className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">
              Medicare Pro
            </h1>
            <span className="text-[11px] text-sky-400 font-medium tracking-wide">
              RECEPTION DESK SUITE
            </span>
          </div>
        </div>

        {/* Navigation Link Groups */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400/80">
                {group.label}
              </p>
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => onClose()}
                      target={item.external ? '_blank' : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          isActive && !item.external
                            ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-white" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="border-t border-slate-800 p-4 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white font-semibold border border-slate-700 text-xs">
                {user?.name?.slice(0, 2).toUpperCase() || 'MP'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-sky-950 text-sky-300 border border-sky-800/60">
                  {user?.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
