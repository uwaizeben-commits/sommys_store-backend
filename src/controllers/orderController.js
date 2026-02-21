const Order = require('../models/Order')
const User = require('../models/User')
const mongoose = require('mongoose')
const nodemailer = require('nodemailer')

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

// Helper: Send admin notification email
async function notifyAdminOfOrder(order) {
  const transporter = createTransport()
  if (!transporter) return // Email not configured
  
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sommys.store'
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER
    
    // Format items for email
    const itemsHtml = order.items.map(item => 
      `<tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td><td>$${(item.quantity * item.price).toFixed(2)}</td></tr>`
    ).join('')
    
    const html = `
      <h2>New Order #${order._id.toString().slice(-8).toUpperCase()}</h2>
      <p><strong>Customer:</strong> ${order.shippingAddress?.fullName || 'N/A'}</p>
      <p><strong>Email:</strong> ${order.shippingAddress?.email || 'N/A'}</p>
      <p><strong>Address:</strong> ${order.shippingAddress?.address}, ${order.shippingAddress?.city} ${order.shippingAddress?.postalCode}</p>
      <h3>Items:</h3>
      <table border="1" cellpadding="8">
        <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
        ${itemsHtml}
      </table>
      <h3>Total: $${order.total.toFixed(2)}</h3>
      <p><a href="${process.env.ADMIN_DASHBOARD_URL || '#'}">View in Dashboard</a></p>
    `
    
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `New Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html
    })
  } catch (err) {
    console.error('Failed to send admin notification:', err)
  }
}

// Create a new order (called after checkout)
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, total, shippingAddress, paymentMethod } = req.body
    if (!userId || !items || !total) return res.status(400).json({ message: 'Missing required fields' })

    // Convert userId string to MongoDB ObjectId if needed
    const normalizedUserId = mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(userId)

    const order = new Order({
      userId: normalizedUserId,
      items,
      total,
      shippingAddress,
      paymentMethod
    })
    await order.save()
    
    // Notify admin asynchronously (don't block response)
    notifyAdminOfOrder(order).catch(err => console.error('Admin notification error:', err))
    
    res.status(201).json({ message: 'Order created', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params
    // Convert userId string to MongoDB ObjectId
    const normalizedUserId = mongoose.Types.ObjectId.isValid(userId) ? userId : new mongoose.Types.ObjectId(userId)
    const orders = await Order.find({ userId: normalizedUserId }).populate('items.productId').sort({ orderDate: -1 })
    res.json({ orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params
    // Handle string orderId conversion to ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' })
    }
    const order = await Order.findById(orderId).populate('items.productId')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Cancel order (3% fee applied, refund scheduled)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' })
    }
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (['delivered', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled in current status' })
    }

    const cancellationFee = Math.round(order.total * 0.03 * 100) / 100 // 3% fee
    const refundAmount = order.total - cancellationFee

    order.status = 'cancelled'
    order.cancellationFee = cancellationFee
    order.refundAmount = refundAmount
    order.refundStatus = 'pending'
    await order.save()

    res.json({ message: 'Order cancelled', cancellationFee, refundAmount, refundStatus: 'pending' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Update order status (admin only, for demo purposes any authenticated user can call)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params
    const { status, dispatchDate, departureDate, deliveryDate } = req.body
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' })
    }

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (status) order.status = status
    if (dispatchDate) order.dispatchDate = new Date(dispatchDate)
    if (departureDate) order.departureDate = new Date(departureDate)
    if (deliveryDate) order.deliveryDate = new Date(deliveryDate)

    await order.save()
    res.json({ message: 'Order updated', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Track order (return current status and dates)
exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID format' })
    }
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })

    res.json({
      orderId: order._id,
      status: order.status,
      orderDate: order.orderDate,
      dispatchDate: order.dispatchDate,
      departureDate: order.departureDate,
      deliveryDate: order.deliveryDate,
      total: order.total
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
// Get all orders (admin endpoint)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email phone')
      .populate('items.productId')
      .sort({ orderDate: -1 })
    res.json({ orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}