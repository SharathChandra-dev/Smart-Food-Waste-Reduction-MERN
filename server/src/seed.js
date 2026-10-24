import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { User, Food } from './models/index.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(serverDir, '../..');
dotenv.config({ path: path.join(serverDir, '../.env') });
dotenv.config({ path: path.join(projectDir, '.env'), override: false });
if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in server/.env first.');
await mongoose.connect(process.env.MONGODB_URI);
const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
if (password.length < 12)
  throw new Error(
    'Set ADMIN_PASSWORD to a unique password with at least 12 characters before seeding.',
  );
let admin = await User.findOne({ email_sfwr: email });
if (!admin) {
  admin = await User.create({
    username_sfwr: process.env.ADMIN_NAME || 'SFWR Admin',
    email_sfwr: email,
    password_sfwr: await bcrypt.hash(password, 12),
    role_sfwr: 'Admin',
  });
} else if (admin.role_sfwr !== 'Admin') {
  admin.role_sfwr = 'Admin';
  await admin.save();
}
const catalog = JSON.parse(
  fs.readFileSync(new URL('./food_catalog.json', import.meta.url), 'utf8'),
);
const today = new Date();
today.setHours(0, 0, 0, 0);
const expiryYear =
  new Date().getMonth() >= 10 ? new Date().getFullYear() + 1 : new Date().getFullYear();
const pickupLocations = [
  'Marienplatz, Altstadt-Lehel, Munich',
  'Viktualienmarkt, Altstadt-Lehel, Munich',
  'Sendlinger Tor, Ludwigsvorstadt-Isarvorstadt, Munich',
  'Gärtnerplatz, Ludwigsvorstadt-Isarvorstadt, Munich',
  'Königsplatz, Maxvorstadt, Munich',
  'Universität, Maxvorstadt, Munich',
  'Münchner Freiheit, Schwabing-Freimann, Munich',
  'Hohenzollernplatz, Schwabing-West, Munich',
  'Elisabethmarkt, Schwabing-West, Munich',
  'Max-Weber-Platz, Au-Haidhausen, Munich',
  'Ostbahnhof, Au-Haidhausen, Munich',
  'Rosenheimer Platz, Au-Haidhausen, Munich',
  'Harras, Sendling, Munich',
  'Westpark, Sendling-Westpark, Munich',
  'Rotkreuzplatz, Neuhausen-Nymphenburg, Munich',
  'Romanplatz, Neuhausen-Nymphenburg, Munich',
  'Moosach station, Moosach, Munich',
  'Olympiazentrum, Milbertshofen-Am Hart, Munich',
  'Arabellapark, Bogenhausen, Munich',
  'Berg am Laim station, Berg am Laim, Munich',
  'Riem Arcaden, Trudering-Riem, Munich',
  'Neuperlach Zentrum, Ramersdorf-Perlach, Munich',
  'Giesing station, Obergiesing-Fasangarten, Munich',
  'Candidplatz, Untergiesing-Harlaching, Munich',
  'Klinikum Großhadern, Hadern, Munich',
  'Pasing station, Pasing-Obermenzing, Munich',
  'Westkreuz, Aubing-Lochhausen-Langwied, Munich',
  'Allach station, Allach-Untermenzing, Munich',
  'Feldmoching station, Feldmoching-Hasenbergl, Munich',
  'Laimer Platz, Laim, Munich',
];
for (const [index, entry] of catalog.entries()) {
  const credit = entry.photo_credit;
  const description = entry.fooddescription_sfwr;
  const imagePath = `/${entry.foodimage_sfwr.replace(/^\/+/, '')}`;
  const expiryDate = new Date(expiryYear, 10, index + 1, 12);
  const pickupLocation = pickupLocations[index % pickupLocations.length];
  await Food.updateOne(
    {
      foodname_sfwr: entry.foodname_sfwr,
      id_user_sfwr: admin._id,
      photo_credit_sfwr: { $exists: true },
    },
    {
      $set: {
        fooddescription_sfwr: description,
        foodimage_sfwr: imagePath,
        expiry_date_sfwr: expiryDate,
        pickup_location_sfwr: pickupLocation,
      },
      $setOnInsert: {
        foodname_sfwr: entry.foodname_sfwr,
        foodcategory_sfwr: entry.foodcategory_sfwr,
        manufacturing_date_sfwr: new Date(today.getTime() - 86400000),
        foodquantity_sfwr: entry.foodquantity_sfwr,
        calories_sfwr: entry.calories_sfwr,
        contact_sfwr: '+49 155 10323692',
        available_till_sfwr: new Date(Date.now() + 3 * 86400000),
        photo_credit_sfwr: credit,
        id_user_sfwr: admin._id,
      },
    },
    { upsert: true },
  );
}
console.log(`Seeded admin account ${email} and ${catalog.length} catalog foods.`);
await mongoose.disconnect();
