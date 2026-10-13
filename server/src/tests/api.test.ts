import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { connectDB, disconnectDB } from '../config/database';
import { seedDatabase } from '../seeds/seed';

describe('Medicare Pro API Integration Tests', () => {
  let receptionToken: string;
  let adminToken: string;
  let doctorToken: string;
  let testPatientId: string;
  let testDoctorId: string;
  let testDeptId: string;

  beforeAll(async () => {
    process.env.USE_MEMORY_DB = 'true';
    await connectDB();
    await seedDatabase(true);
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/login should authenticate receptionist', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'receptionist@medicarepro.com',
      password: 'Reception@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('receptionist');
    receptionToken = res.body.data.token;
  });

  it('POST /api/auth/login should authenticate admin', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@medicarepro.com',
      password: 'Admin@123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
    adminToken = res.body.data.token;
  });

  it('POST /api/auth/login should fail on bad password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@medicarepro.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/departments should return hospital departments', async () => {
    const res = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${receptionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    testDeptId = res.body.data[0]._id;
  });

  it('GET /api/doctors should return doctor directory', async () => {
    const res = await request(app)
      .get('/api/doctors')
      .set('Authorization', `Bearer ${receptionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    testDoctorId = res.body.data[0]._id;
  });

  it('POST /api/patients should register a new patient', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        fullName: 'Test Patient Walkin',
        dateOfBirth: '1990-05-15',
        gender: 'Male',
        phone: '9898989898',
        email: 'testwalkin@example.com',
        address: '123 Test Street',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.patientId).toBeDefined();
    testPatientId = res.body.data._id;
  });

  it('POST /api/patients should warn/block on duplicate phone', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        fullName: 'Another Patient',
        dateOfBirth: '1995-01-01',
        gender: 'Female',
        phone: '9898989898',
      });
    expect(res.status).toBe(409);
    expect(res.body.warning).toBe('POSSIBLE_DUPLICATE');
  });

  it('GET /api/doctors/:id/availability should return calculated slots', async () => {
    // 2026-10-15 (Thursday)
    const res = await request(app)
      .get(`/api/doctors/${testDoctorId}/availability?date=2026-10-15`)
      .set('Authorization', `Bearer ${receptionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.slots).toBeDefined();
    expect(res.body.data.slots.length).toBeGreaterThan(0);
    // Break slots should be marked as break
    const breakSlot = res.body.data.slots.find((s: any) => s.startTime === '11:00');
    if (breakSlot) {
      expect(breakSlot.status).toBe('break');
    }
  });

  it('POST /api/appointments should book an available slot', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        patientId: testPatientId,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        appointmentDate: '2026-10-15',
        startTime: '10:00',
        endTime: '10:20',
        appointmentType: 'New Consultation',
        consultationFee: 500,
        bookingSource: 'Walk-in',
      });
    expect(res.status).toBe(201);
    expect(res.body.data.appointmentId).toBeDefined();
  });

  it('POST /api/appointments should reject double-booking on same slot', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        patientId: testPatientId,
        doctorId: testDoctorId,
        departmentId: testDeptId,
        appointmentDate: '2026-10-15',
        startTime: '10:00',
        endTime: '10:20',
        appointmentType: 'New Consultation',
        consultationFee: 500,
        bookingSource: 'Walk-in',
      });
    expect(res.status).toBe(409);
  });

  it('Security: Receptionist should be blocked from Admin-only users endpoint (403)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${receptionToken}`);
    expect(res.status).toBe(403);
  });

  it('Admin should be permitted on users endpoint (200)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/dashboard/summary should calculate live metrics from MongoDB', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${receptionToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.totalAppointmentsToday).toBeDefined();
  });
});
