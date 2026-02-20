const mongoose = require('mongoose')

const PasswordResetSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('PasswordReset', PasswordResetSchema)
