const Order = require('../models/Order')

// Create a new order (called after checkout)
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, total, shippingAddress, paymentMethod } = req.body
    if (!userId || !items || !total) return res.status(400).json({ message: 'Missing required fields' })

    const order = new Order({
      userId,
      items,
      total,
      shippingAddress,
      paymentMethod
    })
    await order.save()
    res.status(201).json({ message: 'Order created', order })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params
    const orders = await Order.find({ userId }).populate('items.productId').sort({ orderDate: -1 })
    res.json({ orders })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Get single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params
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
