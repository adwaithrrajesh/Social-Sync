const { Router } = require('express');
const {userAuthentication} = require('../middleware/tokenMiddleware');
const controller = require('../controller/messageController')
const router = Router();


router.post('/addMessage',userAuthentication,controller.addMessage);
router.post('/getMessages',userAuthentication,controller.getMessages);
router.delete('/unsendMessage',userAuthentication,controller.unsendMessage);

module.exports = router;