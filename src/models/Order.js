const mongoose = require('mongoose')

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: Number,
        price: Number,
        image: String
      }
    ],
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'dispatched', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
    orderDate: { type: Date, default: Date.now },
    dispatchDate: Date,
    departureDate: Date,
    deliveryDate: Date,
    cancellationFee: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    refundStatus: { type: String, enum: ['none', 'pending', 'completed'], default: 'none' },
    shippingAddress: String,
    paymentMethod: String
  },
  { timestamps: true }
)

module.exports = mongoose.model('Order', OrderSchema)
