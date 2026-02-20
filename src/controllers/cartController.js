const Cart = require('../models/Cart')

exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.userId }).populate('items.productId')
    if (!cart) return res.json({ items: [] })
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body
    let cart = await Cart.findOne({ userId: req.userId })
    if (!cart) {
      cart = new Cart({ userId: req.userId, items: [] })
    }
    const idx = cart.items.findIndex((i) => i.productId.toString() === productId)
    if (idx >= 0) {
      cart.items[idx].quantity += quantity
    } else {
      cart.items.push({ productId, quantity })
    }
    await cart.save()
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body
    const cart = await Cart.findOne({ userId: req.userId })
    if (!cart) return res.status(404).json({ message: 'Cart not found' })
    const idx = cart.items.findIndex((i) => i.productId.toString() === productId)
    if (idx >= 0) {
      if (quantity <= 0) cart.items.splice(idx, 1)
      else cart.items[idx].quantity = quantity
      await cart.save()
    }
    res.json(cart)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.clear = async (req, res) => {
  try {
    await Cart.findOneAndDelete({ userId: req.userId })
    res.json({ message: 'Cleared' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
