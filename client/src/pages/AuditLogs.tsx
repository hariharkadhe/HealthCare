import React, { useState, useEffect } from 'react';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        action: actionFilter || undefined,
        limit: 50,
      });
      if (res.success) {
        setLogs(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Security & Clinical Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable audit trail of all staff bookings, check-ins, cancellations, and administrative events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Trail</CardTitle>
          <span className="text-xs text-slate-500">{logs.length} logged events</span>
        </CardHeader>

        {isLoading ? (
          <LoadingState message="Retrieving secure audit trails..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Staff Member</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource Type</th>
                  <th className="px-5 py-3">Resource ID</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No audit events found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-sans font-semibold text-slate-900">
                        {log.actorName}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({log.actorRole})
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sky-700 font-bold whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-5 py-3 font-sans text-slate-700">
                        {log.resourceType}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {log.resourceId || '—'}
                      </td>
                      <td className="px-5 py-3 font-sans text-slate-500 max-w-xs truncate">
                        {log.safeMetadata ? JSON.stringify(log.safeMetadata) : '—'}
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
