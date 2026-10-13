import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/database';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Doctor } from '../models/Doctor';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { QueueEntry } from '../models/QueueEntry';
import { DoctorScheduleException } from '../models/DoctorScheduleException';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { HospitalSettings } from '../models/HospitalSettings';

export async function seedDatabase(dropExisting = false): Promise<void> {
  console.log('[Seed] Starting database seeding process...');

  if (dropExisting) {
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      QueueEntry.deleteMany({}),
      DoctorScheduleException.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({}),
      HospitalSettings.deleteMany({}),
    ]);
  } else {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('[Seed] Database already contains records. Skipping seed.');
      return;
    }
  }

  // 1. Hospital Settings
  const settings = await HospitalSettings.create({
    hospitalName: 'Medicare Pro Central Hospital',
    tagline: 'Leading the Way in Compassionate Clinical Care',
    address: {
      street: '450 Healthcare Way, Suite 100',
      city: 'Metro City',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    contactNumber: '+91 (80) 2345-6789',
    emergencyContact: '108 / +91 (80) 2345-9999',
    email: 'reception@medicarepro.com',
    website: 'https://medicarepro.hospital',
    logoUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150',
    timezone: 'Asia/Kolkata',
    workingHours: {
      openingTime: '08:00',
      closingTime: '20:00',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    receiptSettings: {
      headerTitle: 'MEDICARE PRO CENTRAL HOSPITAL — OFFICIAL RECEIPT',
      footerNote: 'Kindly report to the Reception / Triage desk 15 minutes before your slot.',
      taxId: 'MED-GST-IN-98129381',
    },
  });

  // 2. Departments
  const departmentsData = [
    { name: 'General Medicine', code: 'GEN', description: 'Primary care, adult wellness, and preventative medicine', icon: 'Stethoscope' },
    { name: 'Cardiology', code: 'CARD', description: 'Comprehensive heart, cardiovascular, and vascular treatments', icon: 'HeartPulse' },
    { name: 'Dermatology', code: 'DERM', description: 'Advanced skin, hair, and cosmetic medical care', icon: 'Sparkles' },
    { name: 'Orthopedics', code: 'ORTHO', description: 'Bone, joint, spine, and musculoskeletal health', icon: 'Bone' },
    { name: 'Pediatrics', code: 'PED', description: 'Infant, child, and adolescent healthcare', icon: 'Baby' },
    { name: 'Gynecology & Obstetrics', code: 'GYN', description: 'Women health, fertility, and prenatal maternity', icon: 'Activity' },
    { name: 'Neurology', code: 'NEURO', description: 'Brain, nervous system, and neurological care', icon: 'Brain' },
    { name: 'ENT (Otolaryngology)', code: 'ENT', description: 'Ear, nose, throat, head and neck surgery', icon: 'Ear' },
    { name: 'Ophthalmology', code: 'OPHTH', description: 'Eye exams, vision care, and surgical solutions', icon: 'Eye' },
    { name: 'Dentistry', code: 'DENT', description: 'Dental surgery, oral hygiene, and orthodontics', icon: 'Smile' },
  ];

  const createdDepartments = await Department.insertMany(departmentsData);
  const deptMap: Record<string, any> = {};
  createdDepartments.forEach((d) => {
    deptMap[d.code] = d;
  });

  // Password hashes
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const receptionPassword = await bcrypt.hash('Reception@123', salt);
  const doctorPassword = await bcrypt.hash('Doctor@123', salt);

  // 3. User Accounts
  const adminUser = await User.create({
    name: 'Sarah Jenkins (Admin)',
    email: 'admin@medicarepro.com',
    passwordHash: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const receptionUser = await User.create({
    name: 'Emily Davis (Chief Receptionist)',
    email: 'receptionist@medicarepro.com',
    passwordHash: receptionPassword,
    role: 'receptionist',
    isActive: true,
  });

  // 4. Doctors
  const standardWeeklySchedule = [1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day,
    isAvailable: true,
    startTime: '09:00',
    endTime: '17:00',
    breaks: [
      { startTime: '11:00', endTime: '11:30', label: 'Morning Tea Break' },
      { startTime: '13:00', endTime: '14:00', label: 'Lunch Break' },
    ],
    maxCapacity: 25,
  }));

  const halfDaySchedule = [1, 2, 3, 4, 5].map((day) => ({
    dayOfWeek: day,
    isAvailable: true,
    startTime: '09:00',
    endTime: '13:00',
    breaks: [{ startTime: '11:00', endTime: '11:20', label: 'Tea Break' }],
    maxCapacity: 15,
  }));

  const doctorsData = [
    {
      doctorId: 'DOC-101',
      fullName: 'Dr. Ananya Sharma',
      avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200',
      qualification: 'MBBS, MD (Cardiology), FACC',
      specialization: 'Interventional Cardiology',
      departmentId: deptMap['CARD']._id,
      experience: 14,
      consultationFee: 800,
      consultationDuration: 20,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 204 (Wing B)',
      phone: '+91 98765 43210',
      email: 'doctor.sharma@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-102',
      fullName: 'Dr. Rajesh Patel',
      avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200',
      qualification: 'MBBS, MD (General Medicine)',
      specialization: 'Internal Medicine & Diabetes Care',
      departmentId: deptMap['GEN']._id,
      experience: 12,
      consultationFee: 500,
      consultationDuration: 15,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 101 (Wing A)',
      phone: '+91 98765 43211',
      email: 'doctor.patel@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-103',
      fullName: 'Dr. Meera Nambiar',
      avatarUrl: 'https://images.unsplash.com/photo-1594824813576-5992a5431631?w=200',
      qualification: 'MBBS, DNB (Dermatology)',
      specialization: 'Clinical & Cosmetic Dermatology',
      departmentId: deptMap['DERM']._id,
      experience: 9,
      consultationFee: 650,
      consultationDuration: 20,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 302 (Wing C)',
      phone: '+91 98765 43212',
      email: 'doctor.meera@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-104',
      fullName: 'Dr. Vikramaditya Rao',
      avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200',
      qualification: 'MBBS, MS (Orthopedics), MCh',
      specialization: 'Joint Replacement & Arthroscopy',
      departmentId: deptMap['ORTHO']._id,
      experience: 18,
      consultationFee: 900,
      consultationDuration: 20,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 110 (Wing A)',
      phone: '+91 98765 43213',
      email: 'doctor.vikram@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-105',
      fullName: 'Dr. Kavita Singhania',
      avatarUrl: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=200',
      qualification: 'MBBS, MD (Pediatrics)',
      specialization: 'Neonatology & Child Health',
      departmentId: deptMap['PED']._id,
      experience: 11,
      consultationFee: 550,
      consultationDuration: 15,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 205 (Wing B)',
      phone: '+91 98765 43214',
      email: 'doctor.kavita@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-106',
      fullName: 'Dr. Priya Desai',
      avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200',
      qualification: 'MBBS, MS (OBG), FICOG',
      specialization: 'High-Risk Pregnancy & Laparoscopy',
      departmentId: deptMap['GYN']._id,
      experience: 15,
      consultationFee: 750,
      consultationDuration: 20,
      weeklySchedule: halfDaySchedule,
      roomNumber: 'Room 208 (Wing B)',
      phone: '+91 98765 43215',
      email: 'doctor.priya@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-107',
      fullName: 'Dr. Arjun Kulkarni',
      avatarUrl: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=200',
      qualification: 'MBBS, DM (Neurology)',
      specialization: 'Stroke, Epilepsy & Neurophysiology',
      departmentId: deptMap['NEURO']._id,
      experience: 13,
      consultationFee: 1000,
      consultationDuration: 30,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Room 401 (Wing D)',
      phone: '+91 98765 43216',
      email: 'doctor.arjun@medicarepro.com',
      isActive: true,
    },
    {
      doctorId: 'DOC-108',
      fullName: 'Dr. Sunita Varma',
      avatarUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=200',
      qualification: 'BDS, MDS (Oral & Maxillofacial)',
      specialization: 'Implantology & Oral Rehabilitation',
      departmentId: deptMap['DENT']._id,
      experience: 8,
      consultationFee: 450,
      consultationDuration: 20,
      weeklySchedule: standardWeeklySchedule,
      roomNumber: 'Dental Suite 1',
      phone: '+91 98765 43217',
      email: 'doctor.sunita@medicarepro.com',
      isActive: true,
    },
  ];

  const createdDoctors = await Doctor.insertMany(doctorsData);

  // Link Doctor Users
  await User.create([
    {
      name: createdDoctors[0].fullName,
      email: 'doctor.sharma@medicarepro.com',
      passwordHash: doctorPassword,
      role: 'doctor',
      doctorId: createdDoctors[0].doctorId,
      isActive: true,
    },
    {
      name: createdDoctors[1].fullName,
      email: 'doctor.patel@medicarepro.com',
      passwordHash: doctorPassword,
      role: 'doctor',
      doctorId: createdDoctors[1].doctorId,
      isActive: true,
    },
  ]);

  // 5. Patients
  const patientsData = [
    {
      patientId: 'PAT-1001',
      fullName: 'Ramesh Sundaram',
      dateOfBirth: '1978-04-12',
      gender: 'Male',
      phone: '9845012345',
      email: 'ramesh.sundaram@example.com',
      address: '24 MG Road, Indiranagar, Bangalore',
      emergencyContact: { name: 'Geetha Sundaram', phone: '9845012346', relation: 'Spouse' },
      notes: 'History of mild hypertension and seasonal allergies.',
    },
    {
      patientId: 'PAT-1002',
      fullName: 'Pooja Hegde',
      dateOfBirth: '1992-09-24',
      gender: 'Female',
      phone: '9845098765',
      email: 'pooja.hegde@example.com',
      address: '77 Residency Road, Bangalore',
      emergencyContact: { name: 'Kiran Hegde', phone: '9845098766', relation: 'Brother' },
      notes: 'Routine cardiac checkup follow-up.',
    },
    {
      patientId: 'PAT-1003',
      fullName: 'Mohammed Farhan',
      dateOfBirth: '1985-11-03',
      gender: 'Male',
      phone: '9845065432',
      email: 'farhan.m@example.com',
      address: '12 Richmond Town, Bangalore',
      emergencyContact: { name: 'Ayesha Farhan', phone: '9845065433', relation: 'Spouse' },
      notes: 'Frequent headaches and cervical stiffness.',
    },
    {
      patientId: 'PAT-1004',
      fullName: 'Ananya Roy',
      dateOfBirth: '2001-07-19',
      gender: 'Female',
      phone: '9845032109',
      email: 'ananya.roy@example.com',
      address: '88 Koramangala 4th Block, Bangalore',
      emergencyContact: { name: 'Siddharth Roy', phone: '9845032110', relation: 'Father' },
      notes: 'Dermatitis consultation on arms.',
    },
    {
      patientId: 'PAT-1005',
      fullName: 'David Fernandez',
      dateOfBirth: '1965-02-14',
      gender: 'Male',
      phone: '9845077889',
      email: 'david.f@example.com',
      address: '5 Whitefield Main Road, Bangalore',
      emergencyContact: { name: 'Maria Fernandez', phone: '9845077890', relation: 'Spouse' },
      notes: 'Post-knee arthroscopy follow-up examination.',
    },
    {
      patientId: 'PAT-1006',
      fullName: 'Aarav Singhania',
      dateOfBirth: '2019-06-30',
      gender: 'Male',
      phone: '9845011223',
      email: 'singhania.parent@example.com',
      address: '10 HSR Layout Sector 2, Bangalore',
      emergencyContact: { name: 'Neha Singhania', phone: '9845011224', relation: 'Mother' },
      notes: 'Immunization booster schedule.',
    },
  ];

  const createdPatients = await Patient.insertMany(patientsData);

  // 6. Schedule Exceptions (Leave/Blocked period demonstration)
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  // Tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(
    tomorrow.getDate()
  ).padStart(2, '0')}`;

  await DoctorScheduleException.create([
    {
      doctorId: createdDoctors[3]._id, // Dr Vikramaditya Orthopedics
      date: tomorrowStr,
      exceptionType: 'leave',
      isAllDay: true,
      reason: 'Attending National Orthopedic Surgeons Annual Conference',
      createdBy: adminUser._id,
    },
    {
      doctorId: createdDoctors[0]._id, // Dr Ananya Sharma
      date: todayStr,
      exceptionType: 'blocked',
      isAllDay: false,
      startTime: '15:00',
      endTime: '16:00',
      reason: 'Scheduled Emergency Angioplasty Committee Review',
      createdBy: adminUser._id,
    },
  ]);

  // 7. Appointments for Today
  const appointmentsData = [
    {
      appointmentId: `APT-${todayStr.replace(/-/g, '')}-1001`,
      patientId: createdPatients[0]._id,
      doctorId: createdDoctors[0]._id, // Dr. Ananya Sharma (Cardiology)
      departmentId: deptMap['CARD']._id,
      appointmentDate: todayStr,
      startTime: '09:00',
      endTime: '09:20',
      appointmentType: 'New Consultation',
      consultationFee: 800,
      status: 'In Consultation',
      bookingSource: 'Walk-in',
      bookedBy: receptionUser._id,
      tokenNumber: 'T-01',
      notes: 'Chest tightness after exertion.',
    },
    {
      appointmentId: `APT-${todayStr.replace(/-/g, '')}-1002`,
      patientId: createdPatients[1]._id,
      doctorId: createdDoctors[0]._id, // Dr. Ananya Sharma
      departmentId: deptMap['CARD']._id,
      appointmentDate: todayStr,
      startTime: '09:20',
      endTime: '09:40',
      appointmentType: 'Follow-up',
      consultationFee: 800,
      status: 'Waiting',
      bookingSource: 'Reception',
      bookedBy: receptionUser._id,
      tokenNumber: 'T-02',
      notes: 'ECG report review.',
    },
    {
      appointmentId: `APT-${todayStr.replace(/-/g, '')}-1003`,
      patientId: createdPatients[2]._id,
      doctorId: createdDoctors[1]._id, // Dr. Rajesh Patel (General Medicine)
      departmentId: deptMap['GEN']._id,
      appointmentDate: todayStr,
      startTime: '09:00',
      endTime: '09:15',
      appointmentType: 'New Consultation',
      consultationFee: 500,
      status: 'Completed',
      bookingSource: 'Walk-in',
      bookedBy: receptionUser._id,
      tokenNumber: 'T-01',
      notes: 'Seasonal viral flu and mild dehydration.',
    },
    {
      appointmentId: `APT-${todayStr.replace(/-/g, '')}-1004`,
      patientId: createdPatients[3]._id,
      doctorId: createdDoctors[2]._id, // Dr. Meera Nambiar (Dermatology)
      departmentId: deptMap['DERM']._id,
      appointmentDate: todayStr,
      startTime: '10:00',
      endTime: '10:20',
      appointmentType: 'New Consultation',
      consultationFee: 650,
      status: 'Checked In',
      bookingSource: 'Walk-in',
      bookedBy: receptionUser._id,
      tokenNumber: 'T-01',
      notes: 'Allergic rash evaluation.',
    },
    {
      appointmentId: `APT-${todayStr.replace(/-/g, '')}-1005`,
      patientId: createdPatients[4]._id,
      doctorId: createdDoctors[3]._id, // Dr. Vikramaditya Rao (Orthopedics)
      departmentId: deptMap['ORTHO']._id,
      appointmentDate: todayStr,
      startTime: '11:40',
      endTime: '12:00',
      appointmentType: 'Follow-up',
      consultationFee: 900,
      status: 'Scheduled',
      bookingSource: 'Reception',
      bookedBy: receptionUser._id,
      notes: 'Post-surgery mobility check.',
    },
  ];

  const createdAppointments = await Appointment.insertMany(appointmentsData);

  // 8. Queue Entries for Today
  await QueueEntry.create([
    {
      appointmentId: createdAppointments[0]._id,
      doctorId: createdDoctors[0]._id,
      patientId: createdPatients[0]._id,
      tokenNumber: 'T-01',
      queueDate: todayStr,
      checkInTime: new Date(Date.now() - 45 * 60 * 1000),
      queueStatus: 'In Consultation',
      priority: 'Normal',
      calledAt: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      appointmentId: createdAppointments[1]._id,
      doctorId: createdDoctors[0]._id,
      patientId: createdPatients[1]._id,
      tokenNumber: 'T-02',
      queueDate: todayStr,
      checkInTime: new Date(Date.now() - 30 * 60 * 1000),
      queueStatus: 'Waiting',
      priority: 'Normal',
      estimatedWaitMinutes: 20,
    },
    {
      appointmentId: createdAppointments[2]._id,
      doctorId: createdDoctors[1]._id,
      patientId: createdPatients[2]._id,
      tokenNumber: 'T-01',
      queueDate: todayStr,
      checkInTime: new Date(Date.now() - 75 * 60 * 1000),
      queueStatus: 'Completed',
      priority: 'Normal',
      calledAt: new Date(Date.now() - 40 * 60 * 1000),
      completedAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      appointmentId: createdAppointments[3]._id,
      doctorId: createdDoctors[2]._id,
      patientId: createdPatients[3]._id,
      tokenNumber: 'T-01',
      queueDate: todayStr,
      checkInTime: new Date(Date.now() - 15 * 60 * 1000),
      queueStatus: 'Waiting',
      priority: 'Normal',
      estimatedWaitMinutes: 15,
    },
  ]);

  // 9. Initial Notifications
  await Notification.create([
    {
      roleTarget: 'all',
      type: 'system',
      title: 'Medicare Pro System Initialized',
      message: 'Welcome to Medicare Pro Central Reception & Queue Management System.',
      createdAt: new Date(),
    },
    {
      roleTarget: 'receptionist',
      type: 'checkin',
      title: 'Patient Checked In',
      message: `Token T-01 issued to ${createdPatients[0].fullName} for Dr. Ananya Sharma.`,
      createdAt: new Date(Date.now() - 40 * 60 * 1000),
    },
    {
      roleTarget: 'doctor',
      type: 'booking',
      title: 'New Patient Booked',
      message: `New consultation booked for ${createdPatients[1].fullName} at 09:20.`,
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  ]);

  // 10. Initial Audit Logs
  await AuditLog.create([
    {
      actorName: 'System Administrator',
      actorRole: 'admin',
      action: 'INITIALIZE_HOSPITAL_DATABASE',
      resourceType: 'Settings',
      timestamp: new Date(Date.now() - 120 * 60 * 1000),
    },
    {
      actorName: 'Emily Davis',
      actorRole: 'receptionist',
      action: 'PATIENT_CHECK_IN',
      resourceType: 'Queue',
      resourceId: 'T-01',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
    },
  ]);

  console.log('[Seed] Database successfully populated with realistic demo hospital data!');
  console.log('--------------------------------------------------');
  console.log('DEMO ACCOUNTS FOR LOGIN:');
  console.log('1. Admin:        admin@medicarepro.com        / Admin@123');
  console.log('2. Receptionist: receptionist@medicarepro.com / Reception@123');
  console.log('3. Doctor:       doctor.sharma@medicarepro.com / Doctor@123');
  console.log('4. Doctor:       doctor.patel@medicarepro.com  / Doctor@123');
  console.log('--------------------------------------------------');
}

// Standalone seed execution runner
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedDatabase(true); // force reset
      await disconnectDB();
      process.exit(0);
    } catch (err: any) {
      console.error('[Seed] Error during seeding:', err);
      process.exit(1);
    }
  })();
}
