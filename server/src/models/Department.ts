import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  code: string;
  description: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Stethoscope' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
