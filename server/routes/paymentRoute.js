const { Router } = require('express');
const {userAuthentication} = require('../middleware/tokenMiddleware');
const controller = require('../controller/paymentController');
const router = Router();


router.post('/initializePayment',userAuthentication,controller.initializePayment);
router.post('/verifyPayment',userAuthentication,controller.verifyPayment);

module.exports = router;