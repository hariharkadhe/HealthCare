import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Search,
  CalendarPlus,
  Clock,
  Edit,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Doctor, Department } from '../types';
import { formatCurrency } from '../lib/utils';

export const DoctorDirectory: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([
          api.get('/doctors'),
          api.get('/departments'),
        ]);
        if (docRes.success) setDoctors(docRes.data || []);
        if (deptRes.success) setDepartments(deptRes.data || []);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchDept = selectedDeptId
      ? (typeof doc.departmentId === 'object' ? doc.departmentId._id : doc.departmentId) ===
        selectedDeptId
      : true;
    const matchSearch = search.trim()
      ? doc.fullName.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(search.toLowerCase()) ||
        doc.doctorId.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Hospital Doctor Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Specialist clinicians, consultation fees, and schedule profiles
          </p>
        </div>
        {hasRole('admin') && (
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/doctors/new')}
          >
            Add New Doctor
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search doctor by name, qualification, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedDeptId}
          onChange={(e) => setSelectedDeptId(e.target.value)}
          className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs focus:ring-2 focus:ring-sky-500"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept._id} value={dept._id}>
              {dept.name}
            </option>
          ))}
        </select>
      </Card>

      {/* Doctors Grid */}
      {isLoading ? (
        <LoadingState message="Loading hospital medical staff..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400">
              No doctors found matching your filters.
            </div>
          ) : (
            filteredDoctors.map((doc) => (
              <Card key={doc._id} hover className="flex flex-col justify-between">
                <div className="p-5 space-y-4">
                  {/* Doctor Info Header */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={
                        doc.avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          doc.fullName
                        )}&background=0284c7&color=fff`
                      }
                      alt={doc.fullName}
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          {doc.doctorId}
                        </span>
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            doc.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={doc.isActive ? 'Active' : 'Inactive'}
                        />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {doc.fullName}
                      </h3>
                      <p className="text-xs text-sky-600 font-medium truncate">
                        {doc.specialization}
                      </p>
                      <span className="text-[11px] text-slate-400 block truncate">
                        {typeof doc.departmentId === 'object' ? doc.departmentId.name : 'Clinic'}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Specs Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-100 pt-3 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Experience
                      </span>
                      <strong>{doc.experience} Years</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Slot Duration
                      </span>
                      <strong>{doc.consultationDuration} mins</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">
                        Consultation Fee
                      </span>
                      <strong className="text-sky-700">{formatCurrency(doc.consultationFee)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Room / Suite</span>
                      <strong>{doc.roomNumber || 'Room 101'}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Clock className="h-3.5 w-3.5" />}
                    onClick={() => navigate(`/doctors/${doc.doctorId}/schedule`)}
                  >
                    Schedule
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {hasRole('admin') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Edit className="h-3.5 w-3.5" />}
                        onClick={() => navigate(`/doctors/${doc._id}/edit`)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<CalendarPlus className="h-3.5 w-3.5" />}
                      onClick={() => navigate('/appointments/book')}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
