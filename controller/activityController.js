const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Activity = require('./../models/Activity');

const { whatsappNotif } = require('../utils/whatsapp');

exports.getAllActivity = catchAsync(async (req, res, next) => {
  const data = await Activity.find();

  res.status(200).json({
    status: 'success',
    results: data.length,
    data,
  });
});

exports.createNewActivity = catchAsync(async (req, res, next) => {
  const newDocument = await Activity.create(req.body);

  const messageWa = `${req.body.title} akan dilaksanakan pada tanggal ${req.body.date} pada pukul ${req.body.waktuMulai} - ${req.body.waktuSelesai}`;

  await whatsappNotif(messageWa, process.env.WHATSAPP_NUMBER);

  res.status(201).json({
    status: 'success',
    data: newDocument,
  });
});

exports.editActivity = catchAsync(async (req, res, next) => {
  const document = await Activity.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!document) {
    return next(new AppError('No document found with that id', 401));
  }

  res.status(200).json({
    message: 'success',
    data: { document },
  });
});

exports.singleActivity = catchAsync(async (req, res, next) => {
  const data = await Activity.findById(req.params.id);

  if (!data) {
    return next(new AppError('No data found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.deleteActivity = catchAsync(async (req, res, next) => {
  const document = await Activity.findByIdAndDelete(req.params.id);

  if (!document) {
    return next(new AppError('No document found with that id', 404));
  }

  res.status(204).json({
    message: 'success',
    data: null,
  });
});
