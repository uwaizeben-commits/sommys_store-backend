const express = require('express')
const router = express.Router()
const controller = require('../controllers/cartController')
const auth = require('../middleware/auth')

router.get('/', auth, controller.getCart)
router.post('/', auth, controller.addItem)
router.put('/', auth, controller.updateItem)
router.delete('/', auth, controller.clear)

module.exports = router
