const { Router } = require('express');
const router = Router();
const controller = require('../controller/userController');
const {userAuthentication} = require('../middleware/tokenMiddleware');
const {validateUserLogin} = require('../middleware/expressValidator');
const {validateUserSignup} = require('../middleware/expressValidator');


// -------------------------------------------------------------POST METHODS--------------------------------------------------------------

router.post('/sendOtp',validateUserSignup,controller.sendOtp);
router.post('/verifyOtp',controller.verifyOtp);
router.post('/login',validateUserLogin,controller.login);

router.post('/getUserWithId',controller.getUserWithId);
router.post('/follow',userAuthentication,controller.follow);
router.post('/unfollow',userAuthentication,controller.unfollow);
router.post('/createDailyLife',userAuthentication,controller.createDailyLife);
router.post('/getDailyLifeUsingId',userAuthentication,controller.getDailyLifeUsingId);
router.post('/getDailyLifeLikes',userAuthentication,controller.getDailyLifeLikes);
router.post('/getDailyLifeViews',userAuthentication,controller.getDailyLifeViews);

// -------------------------------------------------------------PATCH METHODS--------------------------------------------------------------

router.patch('/changePassword',userAuthentication,controller.changePassword);
router.patch('/viewDailyLife',userAuthentication,controller.viewDailyLife);
router.patch('/likeDailyLife',userAuthentication,controller.likeDailyLife);

// -------------------------------------------------------------GET METHODS--------------------------------------------------------------

router.get('/refreshToken',controller.refreshToken);
router.get('/getUsers',controller.getUsers);
router.get('/getUserWithToken',userAuthentication,controller.getUserWithToken);
router.get('/getFollowersCount',userAuthentication,controller.getFollowersCount);
router.get('/getDailyLife',userAuthentication,controller.getDailyLife);
router.get('/getDailyLifeWithUserId',userAuthentication,controller.getDailyLifeWithUserId);




module.exports = router;