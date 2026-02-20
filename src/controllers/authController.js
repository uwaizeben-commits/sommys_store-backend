const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const PasswordReset = require('../models/PasswordReset')
const nodemailer = require('nodemailer')

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body
    const normalizedPhone = phone ? String(phone).replace(/\D/g, '') : undefined
    // Check for existing user by email or phone
    const exists = await User.findOne({ $or: [ { email }, { phone: normalizedPhone } ] })
    if (exists) return res.status(400).json({ message: 'Email or phone already in use' })
    const hashed = await bcrypt.hash(password, 10)
    const user = new User({ name, email, phone: normalizedPhone, password: hashed })
    await user.save()
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, phone: user.phone } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, identifier, password } = req.body
    let user = null
    if (email) {
      user = await User.findOne({ email })
    } else if (identifier) {
      // identifier may be email or phone
      if (identifier.includes('@')) {
        user = await User.findOne({ email: identifier })
      } else {
        const norm = String(identifier).replace(/\D/g, '')
        user = await User.findOne({ phone: norm })
      }
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, phone: user.phone } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

function createTransport() {
  // Use SMTP settings from env. If none provided, return null.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  })
}

exports.recover = async (req, res) => {
  try {
    const { identifier } = req.body
    if (!identifier) return res.status(400).json({ message: 'Missing identifier' })
    // only email supported server-side
    const email = identifier
    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'No account found' })

    // generate token
    const token = crypto.randomBytes(20).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 hour
    await PasswordReset.findOneAndDelete({ email })
    await PasswordReset.create({ email, token, expires })

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetLink = `${frontend.replace(/\/$/, '')}/reset/${token}`

    const transporter = createTransport()
    if (transporter) {
      const from = process.env.FROM_EMAIL || process.env.SMTP_USER
      await transporter.sendMail({
        from,
        to: email,
        subject: 'Password reset for Sommy\'s Store',
        text: `Use this link to reset your password: ${resetLink}`,
        html: `<p>Use this link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
      })
      return res.json({ message: 'Recovery email sent' })
    }

    // If no transporter configured, return the reset link in response (dev fallback)
    return res.json({ message: 'Reset link generated', resetLink })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to generate reset link' })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ message: 'Missing token or password' })
    const entry = await PasswordReset.findOne({ token })
    if (!entry) return res.status(400).json({ message: 'Invalid or expired token' })
    if (new Date() > entry.expires) {
      await PasswordReset.deleteOne({ token })
      return res.status(400).json({ message: 'Token expired' })
    }

    const user = await User.findOne({ email: entry.email })
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.password = await bcrypt.hash(password, 10)
    await user.save()
    await PasswordReset.deleteOne({ token })
    return res.json({ message: 'Password updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Failed to reset password' })
  }
}

// Simple in-memory admin store for demo (use DB in production)
const admins = []

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' })

    // Check in-memory store
    const admin = admins.find(a => a.email === email && a.password === password)
    if (!admin) return res.status(401).json({ message: 'Invalid admin credentials' })

    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, email, role: 'admin' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.adminRegister = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Missing email or password' })

    // Check if admin already exists
    if (admins.find(a => a.email === email)) return res.status(400).json({ message: 'Admin already exists' })

    // Add to in-memory store (use bcrypt in production)
    admins.push({ email, password })
    const token = jwt.sign({ email, role: 'admin' }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    res.json({ token, email, role: 'admin' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
