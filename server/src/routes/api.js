import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import Busboy from 'busboy';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { User, Food, Claim, Intake, Contact, Header, Tracker } from '../models/index.js';
import { auth, admin } from '../middleware/auth.js';
import { sendMail } from '../utils/mail.js';

const router = Router();
function parseUpload(req, _res, next) {
  if (!req.is('multipart/form-data')) return next();
  let parser;
  try {
    parser = Busboy({
      headers: req.headers,
      limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 40 },
    });
  } catch {
    return next(Object.assign(new Error('Invalid form upload.'), { status: 400 }));
  }
  const fields = {};
  let filePayload = null;
  let uploadError = null;
  parser.on('field', (name, value) => {
    fields[name] = value;
  });
  parser.on('file', (name, stream, info) => {
    if (name !== 'image') {
      stream.resume();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(info.mimeType)) {
      uploadError = Object.assign(new Error('Upload a JPG, PNG, WEBP, or AVIF image.'), {
        status: 400,
      });
      stream.resume();
      return;
    }
    const chunks = [];
    let bytes = 0;
    stream.on('limit', () => {
      uploadError = Object.assign(new Error('Image must be 2 MB or smaller.'), { status: 413 });
    });
    stream.on('data', (chunk) => {
      bytes += chunk.length;
      chunks.push(chunk);
    });
    stream.on('end', () => {
      if (!stream.truncated && !uploadError)
        filePayload = {
          original: info.filename,
          mimeType: info.mimeType,
          buffer: Buffer.concat(chunks, bytes),
        };
    });
  });
  parser.on('filesLimit', () => {
    uploadError = Object.assign(new Error('Only one image can be uploaded.'), { status: 400 });
  });
  parser.on('fieldsLimit', () => {
    uploadError = Object.assign(new Error('Too many form fields.'), { status: 400 });
  });
  parser.on('error', (error) => next(error));
  parser.on('close', async () => {
    if (uploadError) return next(uploadError);
    req.body = fields;
    try {
      if (filePayload) {
        const extension = {
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/webp': '.webp',
          'image/avif': '.avif',
        }[filePayload.mimeType];
        const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
        await fs.mkdir(path.resolve('uploads'), { recursive: true });
        await fs.writeFile(path.resolve('uploads', filename), filePayload.buffer, { flag: 'wx' });
        req.file = { filename, mimetype: filePayload.mimeType, size: filePayload.buffer.length };
      }
      next();
    } catch (error) {
      next(error);
    }
  });
  req.pipe(parser);
}
const tokenFor = (user, extra = {}) =>
  jwt.sign({ sub: user._id.toString(), ...extra }, process.env.JWT_SECRET, {
    expiresIn: extra.challenge ? '5m' : '7d',
  });
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
});
const publicUser = (user) => ({
  id: user._id,
  username_sfwr: user.username_sfwr,
  email_sfwr: user.email_sfwr,
  role_sfwr: user.role_sfwr,
  profile_image_sfwr: user.profile_image_sfwr,
  two_factor_enabled_sfwr: user.two_factor_enabled_sfwr,
});
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const validDateOrder = (body) =>
  new Date(body.expiry_date_sfwr) >= new Date(body.manufacturing_date_sfwr);

router.get('/health', (_req, res) => res.json({ ok: true, service: 'sfwr-api' }));
router.get(
  '/settings',
  asyncRoute(async (_req, res) => {
    const headers = await Header.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json({
      userHeading:
        headers.find((header) => header.page_type_sfwr === 'user')?.heading_sfwr || 'FoodShare',
      adminHeading:
        headers.find((header) => header.page_type_sfwr === 'admin')?.heading_sfwr || 'SFWR Admin',
    });
  }),
);

// Authentication and authenticator-app two-factor setup/verification.
router.post(
  '/auth/register',
  asyncRoute(async (req, res) => {
    const { name, email, password, passwordConfirmation } = req.body;
    if (!name?.trim() || !email?.trim() || !password)
      return res.status(422).json({ message: 'Name, email, and password are required.' });
    if (password.length < 8)
      return res.status(422).json({ message: 'Password must be at least 8 characters.' });
    if (passwordConfirmation !== undefined && password !== passwordConfirmation)
      return res.status(422).json({ message: 'Passwords do not match.' });
    if (await User.exists({ email_sfwr: email.toLowerCase() }))
      return res.status(409).json({ message: 'An account already uses this email.' });
    const user = await User.create({
      username_sfwr: name.trim(),
      email_sfwr: email.trim().toLowerCase(),
      password_sfwr: await bcrypt.hash(password, 12),
    });
    res
      .cookie('sfwr_token', tokenFor(user), cookieOptions())
      .status(201)
      .json({ user: publicUser(user) });
  }),
);

router.post(
  '/auth/login',
  asyncRoute(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email_sfwr: String(email || '').toLowerCase() }).select(
      '+password_sfwr +two_factor_secret_sfwr',
    );
    if (!user || !(await bcrypt.compare(password || '', user.password_sfwr)))
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    if (user.two_factor_enabled_sfwr)
      return res.json({
        requiresTwoFactor: true,
        challengeToken: tokenFor(user, { challenge: true }),
        message: 'Enter the current code from your authenticator app.',
      });
    res.cookie('sfwr_token', tokenFor(user), cookieOptions()).json({ user: publicUser(user) });
  }),
);

router.post(
  '/auth/2fa/verify',
  asyncRoute(async (req, res) => {
    const payload = jwt.verify(req.body.challengeToken || '', process.env.JWT_SECRET);
    if (!payload.challenge)
      return res.status(400).json({ message: 'Invalid verification session.' });
    const user = await User.findById(payload.sub).select('+two_factor_secret_sfwr');
    if (
      !user?.two_factor_enabled_sfwr ||
      !authenticator.check(String(req.body.code || ''), user.two_factor_secret_sfwr)
    )
      return res.status(401).json({ message: 'That authentication code is incorrect.' });
    res.cookie('sfwr_token', tokenFor(user), cookieOptions()).json({ user: publicUser(user) });
  }),
);

router.post('/auth/logout', auth, (_req, res) =>
  res
    .clearCookie('sfwr_token', { ...cookieOptions(), maxAge: undefined })
    .json({ message: 'Signed out.' }),
);
router.get('/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.post(
  '/auth/2fa/setup',
  auth,
  asyncRoute(async (req, res) => {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(req.user.email_sfwr, 'SFWR', secret);
    req.user.two_factor_secret_sfwr = secret;
    req.user.two_factor_enabled_sfwr = false;
    await req.user.save();
    res.json({ secret, qrDataUrl: await QRCode.toDataURL(otpauth), otpauth });
  }),
);
router.post(
  '/auth/2fa/enable',
  auth,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.user._id).select('+two_factor_secret_sfwr');
    if (
      !user?.two_factor_secret_sfwr ||
      !authenticator.check(String(req.body.code || ''), user.two_factor_secret_sfwr)
    )
      return res.status(422).json({ message: 'Enter a valid code from your authenticator app.' });
    user.two_factor_enabled_sfwr = true;
    await user.save();
    res.json({ user: publicUser(user), message: 'Two-factor authentication enabled.' });
  }),
);
router.delete(
  '/auth/2fa',
  auth,
  asyncRoute(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password_sfwr +two_factor_secret_sfwr');
    if (!(await bcrypt.compare(req.body.password || '', user.password_sfwr)))
      return res.status(401).json({ message: 'Password is incorrect.' });
    user.two_factor_secret_sfwr = undefined;
    user.two_factor_enabled_sfwr = false;
    await user.save();
    res.json({ user: publicUser(user), message: 'Two-factor authentication disabled.' });
  }),
);

router.get(
  '/foods',
  asyncRoute(async (req, res) => {
    const query = { expiry_date_sfwr: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } };
    if (req.query.search)
      query.foodname_sfwr = {
        $regex: String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    if (req.query.category && req.query.category !== 'all')
      query.foodcategory_sfwr = req.query.category;
    const foods = await Food.find(query)
      .populate('id_user_sfwr', 'username_sfwr')
      .sort({ expiry_date_sfwr: 1 });
    const categories = await Food.distinct('foodcategory_sfwr');
    res.json({ foods, categories });
  }),
);
router.get(
  '/admin/foods',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const query =
      req.query.status === 'expired'
        ? { expiry_date_sfwr: { $lt: today } }
        : { expiry_date_sfwr: { $gte: today } };
    const foods = await Food.find(query)
      .populate('id_user_sfwr', 'username_sfwr')
      .sort({ createdAt: -1 });
    res.json({ foods });
  }),
);
router.get(
  '/foods/:id',
  asyncRoute(async (req, res) => {
    const food = await Food.findById(req.params.id).populate('id_user_sfwr', 'username_sfwr');
    if (!food) return res.status(404).json({ message: 'Food listing not found.' });
    res.json({ food });
  }),
);
router.post(
  '/foods',
  auth,
  parseUpload,
  asyncRoute(async (req, res) => {
    const b = req.body;
    if (
      !b.foodname_sfwr ||
      !b.foodcategory_sfwr ||
      !b.manufacturing_date_sfwr ||
      !b.expiry_date_sfwr ||
      !b.foodquantity_sfwr ||
      b.calories_sfwr === undefined ||
      !b.contact_sfwr ||
      !b.pickup_location_sfwr ||
      !b.available_till_sfwr
    )
      return res.status(422).json({ message: 'Complete all required food fields.' });
    if (!validDateOrder(b) || new Date(b.available_till_sfwr) <= new Date())
      return res
        .status(422)
        .json({ message: 'Check the manufacturing, expiry, and availability dates.' });
    const food = await Food.create({
      ...b,
      foodquantity_sfwr: Number(b.foodquantity_sfwr),
      calories_sfwr: Number(b.calories_sfwr),
      foodimage_sfwr: req.file ? `/uploads/${req.file.filename}` : '',
      id_user_sfwr: req.user._id,
    });
    const intake = await Intake.create({
      foodintake_sfwr: food.foodname_sfwr,
      id_user_sfwr: req.user._id,
      id_food_sfwr: food._id,
      intake_date_sfwr: new Date(),
      notes_sfwr: `Food listing created. Expires on ${food.expiry_date_sfwr.toISOString().slice(0, 10)}.`,
    });
    food.id_intake_sfwr = intake._id;
    await food.save();
    res.status(201).json({ food });
  }),
);
router.put(
  '/foods/:id',
  auth,
  parseUpload,
  asyncRoute(async (req, res) => {
    const b = req.body;
    if (b.expiry_date_sfwr && b.manufacturing_date_sfwr && !validDateOrder(b))
      return res
        .status(422)
        .json({ message: 'Expiry date must be on or after manufacturing date.' });
    const existing = await Food.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Food listing not found.' });
    if (req.user.role_sfwr !== 'Admin' && existing.id_user_sfwr?.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only edit your own food listings.' });
    const editable = [
      'foodname_sfwr',
      'foodcategory_sfwr',
      'manufacturing_date_sfwr',
      'expiry_date_sfwr',
      'foodquantity_sfwr',
      'calories_sfwr',
      'fooddescription_sfwr',
      'contact_sfwr',
      'pickup_location_sfwr',
      'available_till_sfwr',
    ];
    const patch = Object.fromEntries(
      editable.filter((key) => Object.hasOwn(b, key)).map((key) => [key, b[key]]),
    );
    if (patch.foodquantity_sfwr !== undefined)
      patch.foodquantity_sfwr = Number(patch.foodquantity_sfwr);
    if (patch.calories_sfwr !== undefined) patch.calories_sfwr = Number(patch.calories_sfwr);
    if (req.file) patch.foodimage_sfwr = `/uploads/${req.file.filename}`;
    const food = await Food.findByIdAndUpdate(req.params.id, patch, {
      new: true,
      runValidators: true,
    });
    if (!food) return res.status(404).json({ message: 'Food listing not found.' });
    if (food.id_intake_sfwr)
      await Intake.findByIdAndUpdate(food.id_intake_sfwr, {
        foodintake_sfwr: food.foodname_sfwr,
        notes_sfwr: `Updated listing. Expires on ${food.expiry_date_sfwr.toISOString().slice(0, 10)}.`,
      });
    res.json({ food });
  }),
);
router.delete(
  '/foods/:id',
  auth,
  asyncRoute(async (req, res) => {
    const existing = await Food.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Food listing not found.' });
    if (req.user.role_sfwr !== 'Admin' && existing.id_user_sfwr?.toString() !== req.user.id)
      return res.status(403).json({ message: 'You can only delete your own food listings.' });
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food listing not found.' });
    if (food.id_intake_sfwr) await Intake.findByIdAndDelete(food.id_intake_sfwr);
    await Claim.deleteMany({ id_food_sfwr: food._id });
    res.json({ message: 'Food listing deleted.' });
  }),
);
router.get(
  '/my/foods',
  auth,
  asyncRoute(async (req, res) =>
    res.json({ foods: await Food.find({ id_user_sfwr: req.user._id }).sort({ createdAt: -1 }) }),
  ),
);

router.post(
  '/foods/:id/claim',
  auth,
  asyncRoute(async (req, res) => {
    const food = await Food.findById(req.params.id);
    if (!food || food.expiry_date_sfwr < new Date())
      return res.status(404).json({ message: 'This food is no longer available.' });
    if (food.id_user_sfwr?.toString() === req.user.id)
      return res.status(400).json({ message: 'You cannot request your own listing.' });
    const existing = await Claim.findOne({
      id_food_sfwr: food._id,
      id_user_sfwr: req.user._id,
      status_sfwr: 'pending',
    });
    if (existing)
      return res.status(409).json({ message: 'You already have a pending request for this food.' });
    const claim = await Claim.create({
      id_food_sfwr: food._id,
      id_user_sfwr: req.user._id,
      status_sfwr: 'pending',
    });
    res.status(201).json({ claim, message: 'Request sent. Waiting for admin approval.' });
  }),
);
router.get(
  '/my/claims',
  auth,
  asyncRoute(async (req, res) =>
    res.json({
      claims: await Claim.find({ id_user_sfwr: req.user._id })
        .populate('id_food_sfwr')
        .sort({ claimed_at: -1 }),
    }),
  ),
);
router.get(
  '/admin/claims',
  auth,
  admin,
  asyncRoute(async (_req, res) =>
    res.json({
      claims: await Claim.find()
        .populate('id_food_sfwr')
        .populate('id_user_sfwr', 'username_sfwr email_sfwr')
        .sort({ claimed_at: -1 }),
    }),
  ),
);
router.patch(
  '/admin/claims/:id',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    if (!['approved', 'rejected'].includes(req.body.status_sfwr))
      return res.status(422).json({ message: 'Choose approved or rejected.' });
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status_sfwr: req.body.status_sfwr },
      { new: true },
    );
    if (!claim) return res.status(404).json({ message: 'Claim not found.' });
    if (claim.status_sfwr === 'approved')
      await Claim.updateMany(
        { id_food_sfwr: claim.id_food_sfwr, _id: { $ne: claim._id }, status_sfwr: 'pending' },
        { status_sfwr: 'rejected' },
      );
    res.json({ claim, message: `Claim ${claim.status_sfwr}.` });
  }),
);

router.get(
  '/intakes',
  auth,
  asyncRoute(async (req, res) => {
    const query =
      req.user.role_sfwr === 'Admin' && req.query.all === 'true'
        ? {}
        : { id_user_sfwr: req.user._id };
    res.json({
      intakes: await Intake.find(query)
        .populate('id_user_sfwr', 'username_sfwr')
        .populate('id_food_sfwr', 'foodname_sfwr calories_sfwr')
        .sort({ intake_date_sfwr: -1 }),
    });
  }),
);
router.post(
  '/intakes',
  auth,
  asyncRoute(async (req, res) => {
    const { foodintake_sfwr, id_food_sfwr, notes_sfwr, intake_date_sfwr } = req.body;
    if (!foodintake_sfwr?.trim())
      return res.status(422).json({ message: 'Food name is required.' });
    let food = null;
    if (id_food_sfwr) food = await Food.findOne({ _id: id_food_sfwr, id_user_sfwr: req.user._id });
    const intake = await Intake.create({
      foodintake_sfwr: food?.foodname_sfwr || foodintake_sfwr,
      id_food_sfwr: food?._id,
      id_user_sfwr: req.user._id,
      notes_sfwr,
      intake_date_sfwr: intake_date_sfwr || new Date(),
    });
    if (food) {
      food.id_intake_sfwr = intake._id;
      await food.save();
    }
    res.status(201).json({ intake });
  }),
);
router.put(
  '/intakes/:id',
  auth,
  asyncRoute(async (req, res) => {
    const intake = await Intake.findById(req.params.id);
    if (
      !intake ||
      (req.user.role_sfwr !== 'Admin' && intake.id_user_sfwr.toString() !== req.user.id)
    )
      return res.status(404).json({ message: 'Intake not found.' });
    for (const key of ['foodintake_sfwr', 'notes_sfwr', 'intake_date_sfwr'])
      if (req.body[key] !== undefined) intake[key] = req.body[key];
    await intake.save();
    res.json({ intake });
  }),
);
router.delete(
  '/intakes/:id',
  auth,
  asyncRoute(async (req, res) => {
    const intake = await Intake.findById(req.params.id);
    if (
      !intake ||
      (req.user.role_sfwr !== 'Admin' && intake.id_user_sfwr.toString() !== req.user.id)
    )
      return res.status(404).json({ message: 'Intake not found.' });
    await Food.updateMany({ id_intake_sfwr: intake._id }, { id_intake_sfwr: null });
    await intake.deleteOne();
    res.json({ message: 'Intake deleted.' });
  }),
);

router.post(
  '/contacts',
  asyncRoute(async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim())
      return res.status(422).json({ message: 'Name, email, and message are required.' });
    const contact = await Contact.create({
      name_sfwr: name.trim(),
      email_sfwr: email.trim(),
      subject_sfwr: subject?.trim() || 'Contact Form Submission',
      message_sfwr: message.trim(),
    });
    if (process.env.CONTACT_TO && process.env.SMTP_HOST) {
      sendMail({
        to: process.env.CONTACT_TO,
        subject: `SFWR message: ${contact.subject_sfwr}`,
        text: `${contact.name_sfwr} <${contact.email_sfwr}> wrote:\n\n${contact.message_sfwr}`,
      }).catch((error) => console.error('Contact notification email failed:', error.message));
    }
    res.status(201).json({ contact, message: 'Message sent successfully.' });
  }),
);
router.get(
  '/admin/contacts',
  auth,
  admin,
  asyncRoute(async (_req, res) =>
    res.json({ contacts: await Contact.find().sort({ createdAt: -1 }) }),
  ),
);
router.post(
  '/admin/contacts/:id/reply',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Message not found.' });
    const response = String(req.body.admin_response_sfwr || '').trim();
    if (!response) return res.status(422).json({ message: 'Write a reply first.' });
    await sendMail({
      to: contact.email_sfwr,
      subject: `Re: ${contact.subject_sfwr || 'Your message to SFWR'}`,
      text: `Hello ${contact.name_sfwr},\n\n${response}\n\n— Smart Food Waste Reducer`,
      html: `<p>Hello ${escapeHtml(contact.name_sfwr)},</p><p>${escapeHtml(response).replaceAll('\n', '<br>')}</p><p>— Smart Food Waste Reducer</p>`,
    });
    contact.admin_response_sfwr = response;
    contact.replied_at_sfwr = new Date();
    await contact.save();
    res.json({ contact, message: `Reply sent to ${contact.email_sfwr}.` });
  }),
);

router.get(
  '/admin/headers',
  auth,
  admin,
  asyncRoute(async (_req, res) =>
    res.json({ headers: await Header.find().sort({ createdAt: -1 }) }),
  ),
);
router.post(
  '/admin/headers',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const { page_type_sfwr, heading_sfwr } = req.body;
    if (!['admin', 'user'].includes(page_type_sfwr) || !heading_sfwr?.trim())
      return res.status(422).json({ message: 'Choose a page type and enter a heading.' });
    res
      .status(201)
      .json({ header: await Header.create({ page_type_sfwr, heading_sfwr: heading_sfwr.trim() }) });
  }),
);
router.put(
  '/admin/headers/:id',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const header = await Header.findByIdAndUpdate(
      req.params.id,
      { heading_sfwr: req.body.heading_sfwr?.trim() },
      { new: true, runValidators: true },
    );
    if (!header) return res.status(404).json({ message: 'Header not found.' });
    res.json({ header });
  }),
);
router.delete(
  '/admin/headers/:id',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const header = await Header.findByIdAndDelete(req.params.id);
    if (!header) return res.status(404).json({ message: 'Header not found.' });
    res.json({ message: 'Header deleted.' });
  }),
);

router.get(
  '/admin/users',
  auth,
  admin,
  asyncRoute(async (_req, res) =>
    res.json({ users: (await User.find().sort({ createdAt: -1 })).map(publicUser) }),
  ),
);
router.post(
  '/admin/users',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name?.trim() || !email?.trim() || !password || !['User', 'Admin'].includes(role))
      return res.status(422).json({ message: 'Complete all user fields.' });
    if (password.length < 8)
      return res.status(422).json({ message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email_sfwr: email.toLowerCase() }))
      return res.status(409).json({ message: 'Email is already in use.' });
    const user = await User.create({
      username_sfwr: name.trim(),
      email_sfwr: email.toLowerCase(),
      password_sfwr: await bcrypt.hash(password, 12),
      role_sfwr: role,
    });
    res.status(201).json({ user: publicUser(user) });
  }),
);
router.put(
  '/admin/users/:id',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    if (req.user.id === req.params.id && req.body.role !== 'Admin')
      return res.status(400).json({ message: 'You cannot remove your own administrator role.' });
    const user = await User.findById(req.params.id).select('+password_sfwr');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const { name, email, password, role } = req.body;
    if (name) user.username_sfwr = name.trim();
    if (email) user.email_sfwr = email.trim().toLowerCase();
    if (role && ['User', 'Admin'].includes(role)) user.role_sfwr = role;
    if (password) {
      if (password.length < 8)
        return res.status(422).json({ message: 'Password must be at least 8 characters.' });
      user.password_sfwr = await bcrypt.hash(password, 12);
    }
    await user.save();
    res.json({ user: publicUser(user) });
  }),
);
router.delete(
  '/admin/users/:id',
  auth,
  admin,
  asyncRoute(async (req, res) => {
    if (req.user.id === req.params.id)
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Food.updateMany({ id_user_sfwr: user._id }, { id_user_sfwr: null });
    await Claim.deleteMany({ id_user_sfwr: user._id });
    await Intake.deleteMany({ id_user_sfwr: user._id });
    await Tracker.deleteMany({ id_user_sfwr: user._id });
    res.json({ message: 'User deleted.' });
  }),
);

router.get(
  '/admin/dashboard',
  auth,
  admin,
  asyncRoute(async (_req, res) => {
    const [
      totalUsers,
      totalAdmins,
      totalFoods,
      totalHeaders,
      pendingClaims,
      approvedClaims,
      rejectedClaims,
      totalExpiringSoon,
      categoryRows,
    ] = await Promise.all([
      User.countDocuments({ role_sfwr: 'User' }),
      User.countDocuments({ role_sfwr: 'Admin' }),
      Food.countDocuments(),
      Header.countDocuments(),
      Claim.countDocuments({ status_sfwr: 'pending' }),
      Claim.countDocuments({ status_sfwr: 'approved' }),
      Claim.countDocuments({ status_sfwr: 'rejected' }),
      Food.countDocuments({
        expiry_date_sfwr: { $gte: new Date(), $lte: new Date(Date.now() + 7 * 86400000) },
      }),
      Food.aggregate([
        { $group: { _id: '$foodcategory_sfwr', total: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);
    res.json({
      stats: {
        totalUsers,
        totalAdmins,
        totalFoods,
        totalHeaders,
        pendingClaims,
        approvedClaims,
        rejectedClaims,
        totalExpiringSoon,
      },
      categories: categoryRows.map((row) => ({ name: row._id, count: row.total })),
    });
  }),
);

router.get(
  '/trackers/:kind',
  auth,
  asyncRoute(async (req, res) => {
    if (!['calorie', 'expense', 'reminder'].includes(req.params.kind))
      return res.status(404).json({ message: 'Tracker not found.' });
    res.json({
      records: await Tracker.find({ kind_sfwr: req.params.kind, id_user_sfwr: req.user._id }).sort({
        date_sfwr: -1,
        createdAt: -1,
      }),
    });
  }),
);
router.post(
  '/trackers/:kind',
  auth,
  asyncRoute(async (req, res) => {
    if (!['calorie', 'expense', 'reminder'].includes(req.params.kind))
      return res.status(404).json({ message: 'Tracker not found.' });
    const { title_sfwr, amount_sfwr, category_sfwr, date_sfwr, status_sfwr, notes_sfwr } = req.body;
    if (!title_sfwr?.trim()) return res.status(422).json({ message: 'A name is required.' });
    const record = await Tracker.create({
      kind_sfwr: req.params.kind,
      id_user_sfwr: req.user._id,
      title_sfwr: title_sfwr.trim(),
      amount_sfwr: Number(amount_sfwr || 0),
      category_sfwr,
      date_sfwr,
      status_sfwr,
      notes_sfwr,
    });
    res.status(201).json({ record });
  }),
);
router.put(
  '/trackers/:kind/:id',
  auth,
  asyncRoute(async (req, res) => {
    const editable = [
      'title_sfwr',
      'amount_sfwr',
      'category_sfwr',
      'date_sfwr',
      'status_sfwr',
      'notes_sfwr',
    ];
    const patch = Object.fromEntries(
      editable.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]),
    );
    const record = await Tracker.findOneAndUpdate(
      { _id: req.params.id, kind_sfwr: req.params.kind, id_user_sfwr: req.user._id },
      patch,
      { new: true, runValidators: true },
    );
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json({ record });
  }),
);
router.delete(
  '/trackers/:kind/:id',
  auth,
  asyncRoute(async (req, res) => {
    const record = await Tracker.findOneAndDelete({
      _id: req.params.id,
      kind_sfwr: req.params.kind,
      id_user_sfwr: req.user._id,
    });
    if (!record) return res.status(404).json({ message: 'Record not found.' });
    res.json({ message: 'Record deleted.' });
  }),
);

router.get('/profile', auth, (req, res) => res.json({ user: publicUser(req.user) }));
router.put(
  '/profile',
  auth,
  parseUpload,
  asyncRoute(async (req, res) => {
    const { username_sfwr, email_sfwr, current_password, password } = req.body;
    if (
      email_sfwr &&
      email_sfwr.toLowerCase() !== req.user.email_sfwr &&
      (await User.exists({ email_sfwr: email_sfwr.toLowerCase() }))
    )
      return res.status(409).json({ message: 'Email is already in use.' });
    if (password) {
      const user = await User.findById(req.user._id).select('+password_sfwr');
      if (!(await bcrypt.compare(current_password || '', user.password_sfwr)))
        return res.status(401).json({ message: 'Current password is incorrect.' });
      if (password.length < 8)
        return res.status(422).json({ message: 'New password must be at least 8 characters.' });
      user.password_sfwr = await bcrypt.hash(password, 12);
      if (username_sfwr) user.username_sfwr = username_sfwr.trim();
      if (email_sfwr) user.email_sfwr = email_sfwr.trim().toLowerCase();
      if (req.file) user.profile_image_sfwr = `/uploads/${req.file.filename}`;
      await user.save();
      return res.json({ user: publicUser(user), message: 'Profile saved.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(username_sfwr && { username_sfwr: username_sfwr.trim() }),
        ...(email_sfwr && { email_sfwr: email_sfwr.trim().toLowerCase() }),
        ...(req.file && { profile_image_sfwr: `/uploads/${req.file.filename}` }),
      },
      { new: true },
    );
    res.json({ user: publicUser(user), message: 'Profile saved.' });
  }),
);

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
export default router;
