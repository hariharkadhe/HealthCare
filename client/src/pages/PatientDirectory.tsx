import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, UserPlus, CalendarPlus, Eye, Users, Phone, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { Patient } from '../types';
import { formatDate } from '../lib/utils';

export const PatientDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');

  const fetchPatients = async (searchTerm = search, pageNum = page) => {
    setIsLoading(true);
    try {
      const res = await api.get('/patients', {
        search: searchTerm,
        page: pageNum,
        limit: 15,
      });
      if (res.success && res.data) {
        setPatients(res.data.patients || []);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients(search, 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {totalCount} registered hospital patients
          </p>
        </div>
        <Button
          variant="primary"
          icon={<UserPlus className="h-4 w-4" />}
          onClick={() => navigate('/patients/register')}
        >
          Register Walk-In Patient
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID (e.g. PAT-1001), mobile phone, or full name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <Button variant="secondary" type="submit">
            Search
          </Button>
        </form>
      </Card>

      {/* Patients Table */}
      <Card>
        {isLoading ? (
          <LoadingState message="Searching patient records..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Patient ID</th>
                  <th className="px-5 py-3">Full Legal Name</th>
                  <th className="px-5 py-3">Mobile Contact</th>
                  <th className="px-5 py-3">Gender / DOB</th>
                  <th className="px-5 py-3">Registered On</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No patients matching your search criteria.
                    </td>
                  </tr>
                ) : (
                  patients.map((pat) => (
                    <tr key={pat._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-sky-700 whitespace-nowrap">
                        {pat.patientId}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{pat.fullName}</span>
                        {pat.email && (
                          <span className="text-[11px] text-slate-400">{pat.email}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {pat.phone}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {pat.gender} • {formatDate(pat.dateOfBirth)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(pat.registrationDate || pat.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/patients/${pat.patientId}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="View Patient Record"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<CalendarPlus className="h-3.5 w-3.5" />}
                            onClick={() => navigate('/appointments/book')}
                          >
                            Book Slot
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
