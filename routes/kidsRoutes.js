const express = require('express');
const kidsController = require('../controller/kidsController');
const authController = require('../controller/authController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/nik') //
  .post(kidsController.getAllConnectedKids);

router
  .route('/connect') //
  .post(kidsController.connectKidNik);

router
  .route('/') //
  .get(kidsController.getAllKids)
  .post(kidsController.createNewKids);

router
  .route('/:id') //
  .get(kidsController.singleKid) //
  .patch(authController.restrictTo('admin'), kidsController.editKid)
  .delete(authController.restrictTo('admin'), kidsController.deleteKid);

module.exports = router;
