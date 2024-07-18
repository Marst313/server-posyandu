const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const Kids = require('./../models/Kids');
const User = require('./../models/User');

exports.getAllKids = catchAsync(async (req, res, next) => {
  const data = await Kids.find().lean();

  res.status(200).json({
    status: 'success',
    results: data.length,

    data,
  });
});

exports.createNewKids = catchAsync(async (req, res, next) => {
  const newDocument = await Kids.create(req.body);

  res.status(201).json({
    status: 'success',
    data: newDocument,
  });
});

exports.editKid = catchAsync(async (req, res, next) => {
  const document = await Kids.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!document) {
    return next(new AppError('Tidak ada anak dengan id tersebut!', 401));
  }

  res.status(200).json({
    message: 'success',
    data: { document },
  });
});

exports.singleKid = catchAsync(async (req, res, next) => {
  const data = await Kids.findById(req.params.id).lean();

  if (!data) {
    return next(new AppError('Tidak ada anak dengan id tersebut!', 404));
  }

  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.deleteKid = catchAsync(async (req, res, next) => {
  const document = await Kids.findByIdAndDelete(req.params.id);

  if (!document) {
    return next(new AppError('Tidak ada anak dengan id tersebut!', 404));
  }

  const data = await User.updateMany({ nikKids: req.params.id }, { $pull: { nikKids: document.nik } });

  console.log(data);

  res.status(204).json({
    message: 'success',
    data: null,
  });
});

exports.connectKidNik = catchAsync(async (req, res, next) => {
  const { nik } = req.body;

  //! 1. Check if each NIK exists in the Kids collection
  const kid = await Kids.findOne({ nik });
  if (!kid) {
    return next(new AppError(`Tidak ada anak dengan NIK ${nik}, silahkan daftarkan terlebih dahulu`, 404));
  }

  //! 2. Check if each NIK is already used by another user
  const userWithNik = await User.findOne({ nikKids: nik });
  if (userWithNik && userWithNik.id !== req.user.id) {
    return next(new AppError(`NIK ${nik} sudah digunakan oleh user lain!`, 400));
  }

  //! 3. Update nikKids in the User model
  const user = await User.findById(req.user.id);
  if (!user.nikKids.includes(nik)) {
    user.nikKids.push(nik);
  } else {
    return next(new AppError(`NIK ${nik} sudah terdaftar pada akun Anda`, 400));
  }

  await user.save();

  //! 4. Send success response
  res.status(200).json({
    message: 'success',
    data: user,
  });
});

exports.getAllConnectedKids = catchAsync(async (req, res, next) => {
  const nikArray = req.body.nikKids;
  const allData = [];

  if (!nikArray.length === 0) return next(new AppError('Tolong berikan NIK yang valid!', 404));

  await Promise.all(
    nikArray.map(async (nik) => {
      const data = await Kids.find({ nik });

      allData.push(...data);
    })
  );

  res.status(200).json({
    message: 'success',
    data: allData,
  });
});
