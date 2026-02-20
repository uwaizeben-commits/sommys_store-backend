const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')

// Create order
router.post('/', orderController.createOrder)

// Get all orders for a user
router.get('/user/:userId', orderController.getUserOrders)

// Get single order by ID
router.get('/:orderId', orderController.getOrderById)

// Track order
router.get('/:orderId/track', orderController.trackOrder)

// Cancel order
router.post('/:orderId/cancel', orderController.cancelOrder)

// Update order status (admin endpoint)
router.put('/:orderId', orderController.updateOrderStatus)

module.exports = router
