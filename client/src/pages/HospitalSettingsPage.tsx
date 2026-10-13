import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { HospitalSettings } from '../types';

export const HospitalSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<HospitalSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    setSavedMessage(null);

    try {
      const res = await api.put('/settings', settings);
      if (res.success) {
        setSavedMessage('Hospital settings and receipt templates updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <LoadingState message="Loading hospital configuration..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hospital Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Hospital profile, contact directories, working hours, and receipt printing defaults
        </p>
      </div>

      {savedMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Hospital Identification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Hospital Name"
              required
              value={settings.hospitalName}
              onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
            />
            <Input
              label="Tagline / Motto"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
            <Input
              label="Reception Phone"
              required
              value={settings.contactNumber}
              onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })}
            />
            <Input
              label="Emergency Helpline"
              required
              value={settings.emergencyContact}
              onChange={(e) => setSettings({ ...settings, emergencyContact: e.target.value })}
            />
            <Input
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
            <Input
              label="Website"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Address & Location
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                value={settings.address.street}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    address: { ...settings.address, street: e.target.value },
                  })
                }
              />
            </div>
            <Input
              label="City"
              value={settings.address.city}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, city: e.target.value },
                })
              }
            />
            <Input
              label="State / Province"
              value={settings.address.state}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, state: e.target.value },
                })
              }
            />
            <Input
              label="Postal / ZIP Code"
              value={settings.address.postalCode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, postalCode: e.target.value },
                })
              }
            />
            <Input
              label="Country"
              value={settings.address.country}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, country: e.target.value },
                })
              }
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
            Appointment Receipt Print Settings
          </h3>
          <div className="space-y-4">
            <Input
              label="Receipt Header Title"
              value={settings.receiptSettings?.headerTitle || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  receiptSettings: {
                    ...settings.receiptSettings,
                    headerTitle: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Receipt Footer Patient Instructions"
              value={settings.receiptSettings?.footerNote || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  receiptSettings: {
                    ...settings.receiptSettings,
                    footerNote: e.target.value,
                  },
                })
              }
            />
            <Input
              label="Hospital Tax / Registration ID"
              value={settings.receiptSettings?.taxId || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  receiptSettings: {
                    ...settings.receiptSettings,
                    taxId: e.target.value,
                  },
                })
              }
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            icon={<Save className="h-4 w-4" />}
          >
            Save Hospital Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
