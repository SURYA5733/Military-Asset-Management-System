import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { Base } from './models/Base.js';
import { User } from './models/User.js';
import { EquipmentType } from './models/EquipmentType.js';
import { Transaction } from './models/Transaction.js';

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Base.deleteMany({}),
    User.deleteMany({}),
    EquipmentType.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const alpha = await Base.create({ name: 'Fort Alpha', location: 'Northern Sector' });
  const bravo = await Base.create({ name: 'Fort Bravo', location: 'Southern Sector' });
  await Base.create({ name: 'Fort Charlie', location: 'Eastern Sector' });

  const pw = await bcrypt.hash('Password123!', 10);

  const admin = await User.create({ username: 'admin', passwordHash: pw, role: 'ADMIN' });
  const cmdAlpha = await User.create({
    username: 'cmd.alpha', passwordHash: pw, role: 'BASE_COMMANDER', baseId: alpha._id,
  });
  const logAlpha = await User.create({
    username: 'log.alpha', passwordHash: pw, role: 'LOGISTICS_OFFICER', baseId: alpha._id,
  });
  await User.create({
    username: 'cmd.bravo', passwordHash: pw, role: 'BASE_COMMANDER', baseId: bravo._id,
  });

  const weapon = await EquipmentType.create({ name: 'Weapon', unit: 'units' });
  const vehicle = await EquipmentType.create({ name: 'Vehicle', unit: 'units' });
  const ammo = await EquipmentType.create({ name: 'Ammunition', unit: 'rounds' });

  const daysAgo = (d) => new Date(Date.now() - d * 86400 * 1000);

  await Transaction.insertMany([
    { type: 'PURCHASE', quantity: 500, baseId: alpha._id, equipmentTypeId: weapon._id, createdById: cmdAlpha._id, createdAt: daysAgo(30) },
    { type: 'PURCHASE', quantity: 20,  baseId: alpha._id, equipmentTypeId: vehicle._id, createdById: logAlpha._id, createdAt: daysAgo(25) },
    { type: 'PURCHASE', quantity: 5000, baseId: alpha._id, equipmentTypeId: ammo._id, createdById: logAlpha._id, createdAt: daysAgo(20) },
    { type: 'PURCHASE', quantity: 300, baseId: bravo._id, equipmentTypeId: weapon._id, createdById: admin._id, createdAt: daysAgo(28) },
    { type: 'PURCHASE', quantity: 3000, baseId: bravo._id, equipmentTypeId: ammo._id, createdById: admin._id, createdAt: daysAgo(15) },
    { type: 'TRANSFER_OUT', quantity: 50, baseId: alpha._id, counterpartyBaseId: bravo._id, equipmentTypeId: weapon._id, createdById: cmdAlpha._id, createdAt: daysAgo(10) },
    { type: 'TRANSFER_IN',  quantity: 50, baseId: bravo._id, counterpartyBaseId: alpha._id, equipmentTypeId: weapon._id, createdById: cmdAlpha._id, createdAt: daysAgo(10) },
    { type: 'ASSIGNMENT', quantity: 30, baseId: alpha._id, equipmentTypeId: weapon._id, personnelName: 'Sgt. Ramirez', createdById: cmdAlpha._id, createdAt: daysAgo(5) },
    { type: 'EXPENDITURE', quantity: 800, baseId: alpha._id, equipmentTypeId: ammo._id, reason: 'Live-fire training', createdById: cmdAlpha._id, createdAt: daysAgo(3) },
  ]);

  console.log('✅ Seed complete');
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});