const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Patient = require('../models/Patient');
const Service = require('../models/Service');
const Treatment = require('../models/Treatment');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Installment = require('../models/Installment');
const Appointment = require('../models/Appointment');
const Setting = require('../models/Setting');
const AuditLog = require('../models/AuditLog');

async function seedData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_clinic';
    await mongoose.connect(mongoUri);
    console.log('[Seeder] Connected to MongoDB');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Patient.deleteMany({}),
      Service.deleteMany({}),
      Treatment.deleteMany({}),
      Payment.deleteMany({}),
      Transaction.deleteMany({}),
      Installment.deleteMany({}),
      Appointment.deleteMany({}),
      Setting.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seeder] Cleared old data.');

    // 1. Settings
    const setting = await Setting.create({
      clinicName: 'Dental Clinic',
      clinicAddress: 'Dental Care Center, Main Boulevard, Lahore',
      phone: '+92 300 1234567',
      email: 'info@dentalclinic.pk',
      currency: 'PKR',
      currencySymbol: 'Rs.',
      receiptFooter: 'Thank you for visiting Dental Clinic. Please keep this receipt for future reference.',
      doctors: ['Dr. Ahmed', 'Dr. Bilal', 'Dr. Sara']
    });

    // 2. Users
    const adminPassword = await User.hashPassword('admin123');
    const recepPassword = await User.hashPassword('recep123');
    const doctorPassword = await User.hashPassword('doc123');

    const admin = await User.create({
      name: 'Dr. Ahmed Khan',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'Admin'
    });

    const receptionist = await User.create({
      name: 'Amina Tariq',
      username: 'receptionist',
      passwordHash: recepPassword,
      role: 'Receptionist'
    });

    const doctor = await User.create({
      name: 'Dr. Bilal Siddiqui',
      username: 'doctor',
      passwordHash: doctorPassword,
      role: 'Doctor'
    });

    console.log('[Seeder] Seeded users (admin / admin123, receptionist / recep123)');

    // 3. Services (Matching screenshot 2)
    const servicesData = [
      {
        serviceId: 'SRV-001',
        name: 'Scaling',
        description: 'Deep teeth cleaning and tartar removal',
        minPrice: 3000,
        maxPrice: 10000,
        defaultPrice: 5000,
        type: 'One-time',
        status: 'Active'
      },
      {
        serviceId: 'SRV-002',
        name: 'Braces',
        description: 'Comprehensive orthodontic alignment treatment',
        minPrice: 80000,
        maxPrice: 100000,
        defaultPrice: 90000,
        type: 'Contract',
        status: 'Active'
      },
      {
        serviceId: 'SRV-003',
        name: 'Root Canal',
        description: 'Endodontic tooth canal treatment and restoration',
        minPrice: 15000,
        maxPrice: 30000,
        defaultPrice: 20000,
        type: 'One-time',
        status: 'Active'
      },
      {
        serviceId: 'SRV-004',
        name: 'Filling',
        description: 'Composite tooth-colored restoration',
        minPrice: 2000,
        maxPrice: 8000,
        defaultPrice: 4000,
        type: 'One-time',
        status: 'Active'
      },
      {
        serviceId: 'SRV-005',
        name: 'Dental Implant',
        description: 'Titanium root replacement and crown',
        minPrice: 50000,
        maxPrice: 100000,
        defaultPrice: 75000,
        type: 'Contract',
        status: 'Active'
      },
      {
        serviceId: 'SRV-006',
        name: 'Extraction',
        description: 'Tooth removal and wisdom tooth surgical extraction',
        minPrice: 2500,
        maxPrice: 8000,
        defaultPrice: 3500,
        type: 'One-time',
        status: 'Active'
      },
      {
        serviceId: 'SRV-007',
        name: 'Crown',
        description: 'Zirconia or porcelain tooth cap',
        minPrice: 12000,
        maxPrice: 25000,
        defaultPrice: 18000,
        type: 'One-time',
        status: 'Active'
      }
    ];

    const services = await Service.insertMany(servicesData);
    const serviceMap = {};
    services.forEach(s => { serviceMap[s.name] = s; });

    console.log('[Seeder] Seeded services.');

    // 4. Patients (Matching screenshots)
    const p1 = await Patient.create({
      patientId: 'P-001',
      name: 'Ali Khan',
      fatherName: 'Tariq Khan',
      gender: 'Male',
      age: 24,
      phone: '0300-1234567',
      email: 'clin@gmail.com',
      address: 'House 45, Street 12, Gulberg, Lahore',
      medicalNotes: 'No significant medical history',
      allergies: 'None',
      status: 'Active',
      registrationDate: new Date('2026-09-01')
    });

    const p2 = await Patient.create({
      patientId: 'P-002',
      name: 'Ahmad Khan',
      fatherName: 'Farooq Khan',
      gender: 'Male',
      age: 32,
      phone: '0321-9876543',
      email: 'ahmad@example.com',
      address: 'DHA Phase 5, Lahore',
      allergies: 'Penicillin',
      status: 'Active',
      registrationDate: new Date('2026-09-05')
    });

    const p3 = await Patient.create({
      patientId: 'P-003',
      name: 'Sara Khan',
      fatherName: 'Rashid Khan',
      gender: 'Female',
      age: 28,
      phone: '0333-5554321',
      email: 'sara.khan@example.com',
      address: 'Model Town, Lahore',
      allergies: 'None',
      status: 'Active',
      registrationDate: new Date('2026-09-08')
    });

    const p4 = await Patient.create({
      patientId: 'P-004',
      name: 'Hamza',
      fatherName: 'Naveed',
      gender: 'Male',
      age: 19,
      phone: '0345-1122334',
      email: 'hamza@example.com',
      address: 'Johar Town, Lahore',
      allergies: 'None',
      status: 'Active',
      registrationDate: new Date('2026-09-10')
    });

    console.log('[Seeder] Seeded patients.');

    // 5. Treatments for Ali Khan (Matching screenshot 3 & 5)
    // Ali Khan -> Braces (Agreed contract: Rs. 90,000, Initial: 15,000, Monthly: 5,000)
    const bracesTreatment = await Treatment.create({
      treatmentId: 'TRT-001',
      patientId: p1._id,
      serviceId: serviceMap['Braces']._id,
      contractAmount: 90000,
      initialPaymentAmount: 15000,
      monthlyInstallment: 5000,
      startDate: new Date('2026-09-01'),
      durationMonths: 15,
      status: 'Active',
      notes: [
        {
          note: 'Braces adjustment completed',
          date: new Date('2026-09-01'),
          createdBy: 'Dr. Ahmed'
        },
        {
          note: 'Next appointment scheduled',
          date: new Date('2026-09-05'),
          createdBy: 'Receptionist'
        },
        {
          note: 'Patient requested follow-up',
          date: new Date('2026-09-10'),
          createdBy: 'Dr. Ahmed'
        }
      ]
    });

    // Scaling treatment for Ali Khan
    const scalingTreatment = await Treatment.create({
      treatmentId: 'TRT-002',
      patientId: p1._id,
      serviceId: serviceMap['Scaling']._id,
      contractAmount: 10000,
      initialPaymentAmount: 0,
      monthlyInstallment: 0,
      startDate: new Date('2026-09-11'),
      status: 'Completed'
    });

    // Scaling treatment for Ahmad Khan
    const ahmadScaling = await Treatment.create({
      treatmentId: 'TRT-003',
      patientId: p2._id,
      serviceId: serviceMap['Scaling']._id,
      contractAmount: 5000,
      startDate: new Date('2026-09-11'),
      status: 'Completed'
    });

    // 6. Payments for Ali Khan (Matching screenshot 5: 1 Sep Rs. 15,000, 10 Sep Rs. 5,000, 11 Sep Rs. 5,000 for scaling -> Total Paid 25,000, Remaining 65,000)
    const pay1 = await Payment.create({
      paymentId: 'PAY-001',
      patientId: p1._id,
      treatmentId: bracesTreatment._id,
      amount: 15000,
      paymentType: 'Initial / Advance',
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-09-01'),
      reference: 'ADV-001',
      notes: 'Initial contract advance for Braces',
      createdBy: 'Receptionist'
    });

    const pay2 = await Payment.create({
      paymentId: 'PAY-002',
      patientId: p1._id,
      treatmentId: bracesTreatment._id,
      amount: 5000,
      paymentType: 'Monthly Installment',
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-09-10'),
      reference: 'INST-001',
      notes: 'September installment',
      createdBy: 'Receptionist'
    });

    const pay3 = await Payment.create({
      paymentId: 'PAY-003',
      patientId: p1._id,
      treatmentId: bracesTreatment._id,
      amount: 5000,
      paymentType: 'Monthly Installment',
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-09-11'),
      reference: 'INST-002',
      notes: 'Monthly Installment',
      createdBy: 'Receptionist'
    });

    // Payment from Ahmad Khan
    const pay4 = await Payment.create({
      paymentId: 'PAY-004',
      patientId: p2._id,
      treatmentId: ahmadScaling._id,
      amount: 5000,
      paymentType: 'Full Payment',
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-09-11'),
      reference: 'REC-004',
      notes: 'Scaling completed and paid',
      createdBy: 'Receptionist'
    });

    // Payment from Ali Khan for Scaling (Rs. 10,000 on 11 Sep)
    const pay5 = await Payment.create({
      paymentId: 'PAY-005',
      patientId: p1._id,
      treatmentId: scalingTreatment._id,
      amount: 10000,
      paymentType: 'Full Payment',
      paymentMethod: 'Cash',
      paymentDate: new Date('2026-09-11'),
      reference: 'REC-005',
      notes: 'Scaling payment',
      createdBy: 'Receptionist'
    });

    // 7. Installments Schedule for Ali Khan Braces
    for (let i = 1; i <= 15; i++) {
      const d = new Date('2026-09-01');
      d.setMonth(d.getMonth() + i);

      let status = 'Due';
      let paidAmount = 0;
      const pIds = [];

      if (i === 1) {
        status = 'Paid';
        paidAmount = 5000;
        pIds.push(pay2._id);
      } else if (i === 2) {
        status = 'Paid';
        paidAmount = 5000;
        pIds.push(pay3._id);
      }

      await Installment.create({
        treatmentId: bracesTreatment._id,
        patientId: p1._id,
        installmentNumber: i,
        dueDate: d,
        expectedAmount: 5000,
        paidAmount,
        status,
        paymentIds: pIds
      });
    }

    // 8. Transactions (Matching screenshot 4 Accounting table)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Seed for Today (and 2026-09-11 if different)
    const seedDates = [todayStr];
    if (todayStr !== '2026-09-11') {
      seedDates.push('2026-09-11');
    }

    let txnCounter = 1;
    for (const dStr of seedDates) {
      await Transaction.create({
        transactionId: `TXN-${String(txnCounter++).padStart(3, '0')}`,
        type: 'Income',
        category: 'Treatment Payment',
        amount: 10000,
        patientId: p1._id,
        patientName: 'Ali Khan',
        treatmentId: scalingTreatment._id,
        paymentId: pay5._id,
        paymentMethod: 'Cash',
        transactionDate: new Date(`${dStr}T10:00:00`),
        description: 'Scaling payment',
        reference: 'PAY-005',
        createdBy: 'Receptionist'
      });

      await Transaction.create({
        transactionId: `TXN-${String(txnCounter++).padStart(3, '0')}`,
        type: 'Income',
        category: 'Treatment Payment',
        amount: 10000,
        patientId: p1._id,
        patientName: 'Ali Khan',
        treatmentId: bracesTreatment._id,
        paymentId: pay1._id,
        paymentMethod: 'Cash',
        transactionDate: new Date(`${dStr}T11:00:00`),
        description: 'Braces advance payment',
        reference: 'PAY-001',
        createdBy: 'Receptionist'
      });

      await Transaction.create({
        transactionId: `TXN-${String(txnCounter++).padStart(3, '0')}`,
        type: 'Income',
        category: 'Treatment Payment',
        amount: 5000,
        patientId: p2._id,
        patientName: 'Ahmad Khan',
        treatmentId: ahmadScaling._id,
        paymentId: pay4._id,
        paymentMethod: 'Cash',
        transactionDate: new Date(`${dStr}T12:00:00`),
        description: 'Braces installment',
        reference: 'PAY-004',
        createdBy: 'Receptionist'
      });

      await Transaction.create({
        transactionId: `TXN-${String(txnCounter++).padStart(3, '0')}`,
        type: 'Expense',
        category: 'Dental Materials',
        amount: 3000,
        paymentMethod: 'Cash',
        transactionDate: new Date(`${dStr}T14:00:00`),
        description: 'Dental materials',
        reference: 'INV-1092',
        createdBy: 'Dr. Ahmed'
      });

      await Transaction.create({
        transactionId: `TXN-${String(txnCounter++).padStart(3, '0')}`,
        type: 'Expense',
        category: 'Dental Materials',
        amount: 5000,
        paymentMethod: 'Cash',
        transactionDate: new Date(`${dStr}T16:00:00`),
        description: 'Sterilization & disposable kits',
        reference: 'INV-1095',
        createdBy: 'Receptionist'
      });
    }

    console.log(`[Seeder] Seeded accounting transactions for ${seedDates.join(' & ')} matching screenshot 4 (Income 25,000, Expense 8,000, Net 17,000).`);

    // 9. Appointments (Matching screenshot 1)
    const baseAppointments = [
      {
        patientId: p1._id,
        patientName: 'Ali Khan',
        phone: '0300-1234567',
        serviceId: serviceMap['Braces']._id,
        serviceName: 'Braces',
        treatmentId: bracesTreatment._id,
        time: '09:00',
        doctor: 'Dr. Ahmed',
        notes: 'Monthly wire adjustment and tension check',
        status: 'Scheduled',
        createdBy: 'Receptionist'
      },
      {
        patientId: p2._id,
        patientName: 'Ahmad Khan',
        phone: '0301-2345678',
        serviceId: serviceMap['Scaling']._id,
        serviceName: 'Scaling',
        treatmentId: ahmadScaling._id,
        time: '10:30',
        doctor: 'Dr. Ahmed',
        notes: 'Full mouth scaling and polishing completed',
        status: 'Completed',
        createdBy: 'Receptionist'
      },
      {
        patientId: p3._id,
        patientName: 'Sara Khan',
        phone: '0302-3456789',
        serviceId: serviceMap['Root Canal']._id,
        serviceName: 'Root Canal',
        time: '12:00',
        doctor: 'Dr. Bilal',
        notes: 'First canal obturation session',
        status: 'Scheduled',
        createdBy: 'Receptionist'
      },
      {
        patientId: p4._id,
        patientName: 'Hamza',
        phone: '0303-4567890',
        serviceId: serviceMap['Filling']._id,
        serviceName: 'Filling',
        time: '14:30',
        doctor: 'Dr. Ahmed',
        notes: 'Patient requested reschedule due to fever',
        status: 'Cancelled',
        createdBy: 'Receptionist'
      }
    ];

    let aptCounter = 1;
    const allAppointments = [];
    for (const dStr of seedDates) {
      for (const base of baseAppointments) {
        allAppointments.push({
          appointmentId: `APT-${String(aptCounter++).padStart(3, '0')}`,
          ...base,
          date: dStr
        });
      }
    }

    await Appointment.insertMany(allAppointments);
    console.log(`[Seeder] Seeded appointments for ${seedDates.join(' & ')} matching screenshot 1.`);

    // 10. Audit logs
    await AuditLog.create({
      user: 'admin',
      action: 'SYSTEM_INITIALIZATION',
      entity: 'System',
      details: { message: 'Clinic database initialized with baseline setup' }
    });

    console.log('[Seeder] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seeder Error]:', error);
    process.exit(1);
  }
}

seedData();
