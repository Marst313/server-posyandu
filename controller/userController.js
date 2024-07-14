const User = require('./../models/User');
const AppError = require('../utils/appError');

const catchAsync = require('../utils/catchAsync');

exports.getSingleUser = catchAsync(async (req, res, next) => {
  const data = await User.findById(req.params.id).lean();

  data.password = undefined;

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.getAllUser = catchAsync(async (req, res, next) => {
  const data = await User.find().select('-password').lean();

  if (!data) return next(new AppError('There is no data found', 401));

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { email, name, photo } = req.body;

  if (!email || !name) return next(new AppError('Data harus diisi semua!', 404));

  const user = await User.findByIdAndUpdate(req.user.id, { name, email, photo }).select('-password');

  res.status(200).json({
    status: 'success',
    data: user,
  });
});
