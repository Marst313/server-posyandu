const express = require('express');
const chatController = require('../controller/chatController');
const authController = require('../controller/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/') //
  .get(chatController.getAllChat)
  .post(chatController.generateChatNew);

router.route('/user').post(chatController.getUsersChat);

router
  .route('/:id') //
  .get(chatController.getSingleChat)
  .post(chatController.generateNextChat)
  .delete(chatController.deleteChat);

module.exports = router;
