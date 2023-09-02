const { Router } = require('express');
const router = Router();
const controller = require('../controller/userController');
const {userAuthentication} = require('../middleware/tokenMiddleware')


// -------------------------------------------------------------POST METHODS--------------------------------------------------------------

router.post('/sendOtp',controller.sendOtp);
router.post('/verifyOtp',controller.verifyOtp);
router.post('/login',controller.login);
router.post('/addPost',userAuthentication,controller.addPost);
router.post('/getUserWithId',controller.getUserWithId);
router.post('/follow',userAuthentication,controller.follow);
router.post('/unfollow',userAuthentication,controller.unfollow)

// -------------------------------------------------------------PATCH METHODS--------------------------------------------------------------
router.patch('/addComment',userAuthentication,controller.addComment);
router.patch('/likeComment',userAuthentication,controller.likeComment);
router.patch('/likePost',userAuthentication,controller.likePost);
router.patch('/unlikePost',userAuthentication,controller.unlikePost);
router.patch('/unlikeComment',userAuthentication,controller.unlikeComment);
router.patch('/temperoryPostDelete',userAuthentication,controller.temperoryPostDelete)
router.patch('/changePassword',userAuthentication,controller.changePassword)

// -------------------------------------------------------------GET METHODS--------------------------------------------------------------
router.get('/refreshToken',controller.refreshToken);
router.get('/getUsers',controller.getUsers);
router.get('/getUserWithToken',userAuthentication,controller.getUserWithToken);
router.get('/getFollowersCount',userAuthentication,controller.getFollowersCount);
router.get('/getPostCount',userAuthentication,controller.getPostCount)

// -----------------------------------------------------------Delete Method------------------------------------------------------------
router.delete('/permenentPostDelete',userAuthentication,controller.permenentPostDelete)


module.exports = router;