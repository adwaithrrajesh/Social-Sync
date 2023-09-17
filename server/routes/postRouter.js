const { Router } = require('express');
const router = Router();
const {userAuthentication} = require('../middleware/tokenMiddleware');
const controller = require('../controller/postController');


// ----------------------------------------------------PoST METHOD------------------------------------------------------

router.post('/addPost',userAuthentication,controller.addPost);
router.post('/recoverPost',userAuthentication,controller.recoverPost);
router.post('/repost',userAuthentication,controller.repost);


// -------------------------------------------------------------PATCH METHODS--------------------------------------------------------------

router.patch('/addComment',userAuthentication,controller.addComment);
router.patch('/likeComment',userAuthentication,controller.likeComment);
router.patch('/likePost',userAuthentication,controller.likePost);
router.patch('/unlikePost',userAuthentication,controller.unlikePost);
router.patch('/unlikeComment',userAuthentication,controller.unlikeComment);
router.patch('/temperoryPostDelete',userAuthentication,controller.temperoryPostDelete);

// -------------------------------------------------------------Get Methods----------------------------------------------------------

router.get('/getPostCount',userAuthentication,controller.getPostCount);
router.get('/getPostForHomeScreen',userAuthentication,controller.getPostForHomeScreen);
router.get('/getDeletionScheduledPosts',userAuthentication,controller.getDeletionScheduledPosts);
router.get('/getReposts',userAuthentication,controller.getReposts);

// -----------------------------------------------------------Delete METHODS---------------------------------------------------------------

router.delete('/permenentPostDelete',userAuthentication,controller.permenentPostDelete);
router.delete('/removeRepost',userAuthentication,controller.removeRepost);


module.exports = router;