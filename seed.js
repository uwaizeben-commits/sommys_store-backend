// Simple seed runner to add example products to the DB.
const mongoose = require('mongoose')
const Product = require('./src/models/Product')
require('dotenv').config()

const examples = [
  { name: 'Unisex Tee', price: 19.99, category: 'Clothing', images: [], description: 'Comfortable unisex tee' },
  { name: 'Classic Sneakers', price: 59.99, category: 'Shoes', images: [], description: 'Everyday sneakers' },
  { name: 'Leather Tote', price: 89.99, category: 'Bags', images: [], description: 'Spacious tote bag' }
]

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  await Product.deleteMany({})
  await Product.insertMany(examples)
  console.log('Seeded products')
  process.exit(0)
}

run().catch((err) => { console.error(err); process.exit(1) })
