const express = require('express')
const router = express.Router()
const controller = require('../controllers/productController')
const authMiddleware = require('../middleware/productAuth')

router.get('/', controller.getAll)
router.get('/:id', controller.getById)
router.post('/', authMiddleware, controller.create)
router.put('/:id', authMiddleware, controller.update)
router.delete('/:id', authMiddleware, controller.remove)

module.exports = router
