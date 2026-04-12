const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name:              { type: String, required: true, trim: true },
  email:             { type: String, required: true, unique: true, lowercase: true },
  password:          { type: String, required: true, minlength: 6 },
  avatar:            { type: String, default: '' },
  isVerified:        { type: Boolean, default: false },
  verifyToken:       { type: String },
  verifyTokenExpiry: { type: Date },
}, { timestamps: true });

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);