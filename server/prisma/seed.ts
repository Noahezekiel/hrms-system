import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default company
  const company = await prisma.company.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      name: 'Default Company',
      code: 'DEFAULT',
      description: 'Default company for the system',
      isActive: true,
    },
  });

  // Create default branch
  const branch = await prisma.branch.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'Headquarters',
      code: 'HQ',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      isActive: true,
      companyId: company.id,
    },
  });

  // Create default department
  const department = await prisma.department.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: {
      name: 'Administration',
      code: 'ADMIN',
      description: 'Administration Department',
      isActive: true,
      companyId: company.id,
      branchId: branch.id,
    },
  });

  // Create default position
  const position = await prisma.position.upsert({
    where: { code: 'CEO' },
    update: {},
    create: {
      name: 'Chief Executive Officer',
      code: 'CEO',
      description: 'CEO Position',
      isActive: true,
      departmentId: department.id,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hrms.com' },
    update: {},
    create: {
      email: 'admin@hrms.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
      companyId: company.id,
      branchId: branch.id,
      departmentId: department.id,
    },
  });

  console.log('Admin user created:', adminUser.email);

  // Create an employee record for the admin (optional)
  const employee = await prisma.employee.upsert({
    where: { employeeId: 'EMP-001' },
    update: {},
    create: {
      employeeId: 'EMP-001',
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@hrms.com',
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2024-01-01'),
      isActive: true,
      companyId: company.id,
      branchId: branch.id,
      departmentId: department.id,
      positionId: position.id,
    },
  });

  // Link the user to the employee
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { employeeId: employee.id },
  });

  // Create default shifts
  const morningShift = await prisma.shift.upsert({
    where: { code: 'MORNING' },
    update: {},
    create: {
      name: 'Morning Shift',
      code: 'MORNING',
      description: '9:00 AM - 6:00 PM',
      shiftType: 'MORNING',
      startTime: '09:00',
      endTime: '18:00',
      breakStart: '13:00',
      breakEnd: '14:00',
      isActive: true,
      companyId: company.id,
      branchId: branch.id,
    },
  });

  const eveningShift = await prisma.shift.upsert({
    where: { code: 'EVENING' },
    update: {},
    create: {
      name: 'Evening Shift',
      code: 'EVENING',
      description: '2:00 PM - 11:00 PM',
      shiftType: 'EVENING',
      startTime: '14:00',
      endTime: '23:00',
      breakStart: '18:00',
      breakEnd: '19:00',
      isActive: true,
      companyId: company.id,
      branchId: branch.id,
    },
  });

  console.log('Default shifts created');

  // Create some default holidays
  const holidays = [
    { name: 'New Year\'s Day', date: new Date('2026-01-01') },
    { name: 'Independence Day', date: new Date('2026-07-04') },
    { name: 'Christmas Day', date: new Date('2026-12-25') },
  ];

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: {
        date_companyId_branchId: {
          date: h.date,
          companyId: company.id,
          branchId: branch.id,
        },
      },
      update: {},
      create: {
        name: h.name,
        date: h.date,
        description: `Default holiday: ${h.name}`,
        isRecurring: true,
        companyId: company.id,
        branchId: branch.id,
      },
    });
  }

  console.log('Default holidays created');

  // Create default settings
  const settings = [
    {
      key: 'general.companyName',
      value: { value: 'Default Company' },
      category: 'general',
      description: 'Company name displayed across the system',
      isPublic: true,
    },
    {
      key: 'attendance.checkInGracePeriod',
      value: { minutes: 15 },
      category: 'attendance',
      description: 'Grace period for check-in in minutes',
      isPublic: false,
    },
    {
      key: 'attendance.checkOutGracePeriod',
      value: { minutes: 15 },
      category: 'attendance',
      description: 'Grace period for check-out in minutes',
      isPublic: false,
    },
    {
      key: 'attendance.overtimeThreshold',
      value: { hours: 8 },
      category: 'attendance',
      description: 'Minimum hours per day to be considered overtime',
      isPublic: false,
    },
    {
      key: 'leave.maxAnnualLeave',
      value: { days: 20 },
      category: 'leave',
      description: 'Maximum annual leave days per employee',
      isPublic: false,
    },
    {
      key: 'leave.maxSickLeave',
      value: { days: 10 },
      category: 'leave',
      description: 'Maximum sick leave days per employee',
      isPublic: false,
    },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
        companyId: company.id,
      },
    });
  }

  console.log('Default settings created');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });