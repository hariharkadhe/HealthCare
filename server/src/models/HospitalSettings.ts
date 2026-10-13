import mongoose, { Document, Schema } from 'mongoose';

export interface IHospitalSettings extends Document {
  hospitalName: string;
  tagline: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactNumber: string;
  emergencyContact: string;
  email: string;
  website: string;
  logoUrl?: string;
  timezone: string;
  workingHours: {
    openingTime: string; // "08:00"
    closingTime: string; // "20:00"
    workingDays: string[];
  };
  receiptSettings: {
    headerTitle: string;
    footerNote: string;
    taxId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const hospitalSettingsSchema = new Schema<IHospitalSettings>(
  {
    hospitalName: { type: String, required: true, default: 'Medicare Pro Central Hospital' },
    tagline: { type: String, default: 'Excellence in Compassionate Healthcare' },
    address: {
      street: { type: String, default: '100 Medical Boulevard, Healthcare City' },
      city: { type: String, default: 'Metropolis' },
      state: { type: String, default: 'State' },
      postalCode: { type: String, default: '560001' },
      country: { type: String, default: 'India' },
    },
    contactNumber: { type: String, default: '+91 80 2345 6789' },
    emergencyContact: { type: String, default: '108 / +91 80 2345 9999' },
    email: { type: String, default: 'reception@medicarepro.com' },
    website: { type: String, default: 'www.medicarepro.hospital' },
    logoUrl: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    workingHours: {
      openingTime: { type: String, default: '08:00' },
      closingTime: { type: String, default: '20:00' },
      workingDays: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      },
    },
    receiptSettings: {
      headerTitle: { type: String, default: 'MEDICARE PRO HOSPITAL — APPOINTMENT RECEIPT' },
      footerNote: {
        type: String,
        default: 'Please report to the nursing station 15 minutes prior to your consultation time. Bring this token slip.',
      },
      taxId: { type: String, default: 'HOSP-GST-892301A' },
    },
  },
  {
    timestamps: true,
  }
);

export const HospitalSettings = mongoose.model<IHospitalSettings>(
  'HospitalSettings',
  hospitalSettingsSchema
);
