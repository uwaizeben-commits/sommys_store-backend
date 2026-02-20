const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, required: true, default: 0 },
    category: { type: String },
    description: { type: String },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [{ type: String }],
    inStock: { type: Boolean, default: true }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Product', ProductSchema)
