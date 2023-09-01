const { Router } = require('express');
const router = Router();
const controller = require('../controller/userController');
const {userAuthentication} = require('../middleware/tokenMiddleware')


// -------------------------------------------------------------POST METHODS--------------------------------------------------------------

router.post('/sendOtp',controller.sendOtp);
router.post('/verifyOtp',controller.verifyOtp);
router.post('/login',controller.login);
router.post('/addPost',userAuthentication,controller.addPost);

// -------------------------------------------------------------PATCH METHODS--------------------------------------------------------------
router.patch('/addComment',userAuthentication,controller.addComment);
router.patch('/likeComment',userAuthentication,controller.likeComment);
router.patch('/likePost',userAuthentication,controller.likePost)
router.patch('/unlikePost',userAuthentication,controller.unlikePost)
router.patch('/unlikeComment',userAuthentication,controller.unlikeComment)


// -------------------------------------------------------------GET METHODS--------------------------------------------------------------
router.get('/refreshToken',controller.refreshToken);



module.exports = router;