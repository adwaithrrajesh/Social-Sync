const { Router } = require('express');
const router = Router();
const controller = require('../controller/userController');
const {userAuthentication} = require('../middleware/tokenMiddleware')


// -------------------------------------------------------------POST METHODS--------------------------------------------------------------

router.post('/sendOtp',controller.sendOtp);
router.post('/verifyOtp',controller.verifyOtp);
router.post('/login',controller.login);

// -------------------------------------------------------------GET METHODS--------------------------------------------------------------
router.get('/refreshToken',controller.refreshToken);
router.get('/demo',userAuthentication);



module.exports = router;