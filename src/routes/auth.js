const express = require('express')
const router = express.Router()
const controller = require('../controllers/authController')

router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/recover', controller.recover)
router.post('/reset', controller.resetPassword)
router.post('/admin/login', controller.adminLogin)
router.post('/admin/register', controller.adminRegister)

module.exports = router
