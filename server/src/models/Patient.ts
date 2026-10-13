import mongoose, { Document, Schema } from 'mongoose';

export interface IPatient extends Document {
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  phone: string;
  email?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  registrationDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    dateOfBirth: { type: String, required: true },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      required: true,
    },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relation: { type: String, default: '' },
    },
    registrationDate: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

patientSchema.index({ phone: 1, fullName: 1 });

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
