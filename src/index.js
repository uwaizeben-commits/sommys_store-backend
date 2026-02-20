const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const productsRouter = require('./routes/products')
const authRouter = require('./routes/auth')
const cartRouter = require('./routes/cart')
const ordersRouter = require('./routes/orders')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/cart', cartRouter)
app.use('/api/products', productsRouter)
app.use('/api/orders', ordersRouter)

const PORT = process.env.PORT || 5000

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('Mongo connection error', err)
    process.exit(1)
  })
