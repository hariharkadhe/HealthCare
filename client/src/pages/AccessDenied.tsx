import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AccessDenied: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <div className="rounded-full bg-rose-100 p-4 text-rose-600 mb-4">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Access Denied (403)</h2>
      <p className="mt-2 text-xs text-slate-500 max-w-md">
        Your current account role lacks permissions to access this administrative hospital resource.
        All access attempts are recorded in the security audit logs.
      </p>
      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<LayoutDashboard className="h-4 w-4" />}
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-black text-slate-300">404</h1>
      <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900">Page Not Found</h2>
      <p className="mt-1 text-xs text-slate-500 max-w-sm">
        The requested clinical or reception page does not exist or has been relocated.
      </p>
      <div className="mt-6">
        <Button
          variant="primary"
          size="sm"
          icon={<LayoutDashboard className="h-4 w-4" />}
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
