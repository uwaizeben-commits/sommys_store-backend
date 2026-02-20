const Product = require('../models/Product')

exports.getAll = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 })
    res.json(products)
  } catch (err) {
    console.error('getAll /api/products error:', err)
    res.status(500).json({ message: err.message })
  }
}

exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Not found' })
    res.json(product)
  } catch (err) {
    console.error(`getById /api/products/${req.params.id} error:`, err)
    res.status(500).json({ message: err.message })
  }
}

exports.create = async (req, res) => {
  try {
    const p = new Product(req.body)
    const saved = await p.save()
    res.status(201).json(saved)
  } catch (err) {
    console.error('create /api/products error:', err)
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!updated) return res.status(404).json({ message: 'Not found' })
    res.json(updated)
  } catch (err) {
    console.error(`update /api/products/${req.params.id} error:`, err)
    res.status(400).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    console.error(`delete /api/products/${req.params.id} error:`, err)
    res.status(500).json({ message: err.message })
  }
}
