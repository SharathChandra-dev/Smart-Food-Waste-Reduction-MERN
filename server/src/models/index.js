import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const options = { timestamps: true };
const UserSchema = new Schema(
  {
    username_sfwr: { type: String, required: true, trim: true, maxlength: 100 },
    email_sfwr: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_sfwr: { type: String, required: true, select: false },
    role_sfwr: { type: String, enum: ['User', 'Admin'], default: 'User' },
    profile_image_sfwr: String,
    two_factor_secret_sfwr: { type: String, select: false },
    two_factor_enabled_sfwr: { type: Boolean, default: false },
  },
  options,
);

const FoodSchema = new Schema(
  {
    foodname_sfwr: { type: String, required: true, trim: true, maxlength: 255 },
    foodcategory_sfwr: { type: String, required: true, trim: true },
    manufacturing_date_sfwr: { type: Date, required: true },
    expiry_date_sfwr: { type: Date, required: true },
    foodquantity_sfwr: { type: Number, required: true, min: 1 },
    calories_sfwr: { type: Number, required: true, min: 0 },
    fooddescription_sfwr: String,
    contact_sfwr: { type: String, required: true },
    pickup_location_sfwr: { type: String, required: true },
    available_till_sfwr: { type: Date, required: true },
    foodimage_sfwr: String,
    photo_credit_sfwr: Schema.Types.Mixed,
    id_user_sfwr: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    id_intake_sfwr: { type: Schema.Types.ObjectId, ref: 'Intake', default: null },
  },
  options,
);
const ClaimSchema = new Schema(
  {
    id_food_sfwr: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    id_user_sfwr: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status_sfwr: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    claimed_at: { type: Date, default: Date.now },
  },
  options,
);
ClaimSchema.index(
  { id_food_sfwr: 1, id_user_sfwr: 1 },
  { unique: true, partialFilterExpression: { status_sfwr: 'pending' } },
);
const IntakeSchema = new Schema(
  {
    foodintake_sfwr: { type: String, required: true },
    id_user_sfwr: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    id_food_sfwr: { type: Schema.Types.ObjectId, ref: 'Food', default: null },
    intake_date_sfwr: { type: Date, default: Date.now },
    notes_sfwr: String,
  },
  options,
);
const ContactSchema = new Schema(
  {
    name_sfwr: { type: String, required: true },
    email_sfwr: { type: String, required: true },
    subject_sfwr: { type: String, default: 'Contact Form Submission' },
    message_sfwr: { type: String, required: true },
    admin_response_sfwr: String,
    replied_at_sfwr: Date,
  },
  options,
);
const HeaderSchema = new Schema(
  {
    page_type_sfwr: { type: String, enum: ['admin', 'user'], required: true },
    heading_sfwr: { type: String, required: true },
  },
  options,
);
const TrackerSchema = new Schema(
  {
    kind_sfwr: { type: String, enum: ['calorie', 'expense', 'reminder'], required: true },
    id_user_sfwr: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title_sfwr: { type: String, required: true },
    amount_sfwr: { type: Number, default: 0 },
    category_sfwr: String,
    date_sfwr: Date,
    status_sfwr: { type: String, default: 'pending' },
    notes_sfwr: String,
  },
  options,
);

export const User = model('User', UserSchema);
export const Food = model('Food', FoodSchema);
export const Claim = model('Claim', ClaimSchema);
export const Intake = model('Intake', IntakeSchema);
export const Contact = model('Contact', ContactSchema);
export const Header = model('Header', HeaderSchema);
export const Tracker = model('Tracker', TrackerSchema);
