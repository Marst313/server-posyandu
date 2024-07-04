const { GoogleGenerativeAI } = require('@google/generative-ai');
const catchAsync = require('../utils/catchAsync');
const Chat = require('../models/Chat');
const User = require('../models/User');
const AppError = require('../utils/appError');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function run(msg, history) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history,
    });

    const result = await chat.sendMessage(msg);
    const response = await result.response;

    // Check if the response was blocked due to safety
    if (response.safetyAttributes?.blocked) {
      throw new Error('Response blocked due to safety concerns');
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Error during chat message generation:', error);
    throw new AppError('Unable to generate chat response. Please try again later.', 500);
  }
}

exports.generateChatNew = catchAsync(async (req, res, next) => {
  let history = [];

  // ! 1.) Check if there is no user
  if (!req.user.id) return next(new AppError('Silahkan login terlebih dahulu!', 401));

  // ! 2.) Send user message to CHAT BOT and get Response
  const response = await run(req.body.message, history);

  let transformedHistory = [];
  for (let i = 0; i < history.length; i += 2) {
    transformedHistory.push({
      question: history[i]?.parts[0]?.text || '',
      answer: history[i + 1]?.parts[0]?.text || '',
    });
  }

  const multiChatString = JSON.stringify(transformedHistory);

  //! 4.) Convert history array to JSON string
  const historyString = JSON.stringify(history);

  // ! 5.) Store history and chat in DB
  const newChat = await Chat.create({ question: req.body.message, user: req.user.id, history: historyString, multiChat: multiChatString, isNewChat: false });

  res.status(200).json({
    message: 'success',
    id: newChat._id,
    response,
  });
});

exports.generateNextChat = catchAsync(async (req, res, next) => {
  // ! 1.) Check If User Is Login or Not
  if (!req.user.id) return next(new AppError('Silahkan login terlebih dahulu!', 401));

  // ! 2.) Get Single Chat First
  const prevChat = await Chat.findById(req.params.id).lean();

  // ! 3.) Load History To New Variabel
  let history = JSON.parse(prevChat.history);

  // ! 4.) Create response from new message + last History
  const response = await run(req.body.message, history);

  let transformedHistory = [];
  for (let i = 0; i < history.length; i += 2) {
    transformedHistory.push({
      question: history[i]?.parts[0]?.text || '',
      answer: history[i + 1]?.parts[0]?.text || '',
    });
  }

  const multiChatString = JSON.stringify(transformedHistory);

  // ! 5.) Parse Object To String
  const historyString = JSON.stringify(history);

  // ! 6.) Update History
  await Chat.findByIdAndUpdate(req.params.id, { history: historyString, multiChat: multiChatString }).lean();

  res.status(200).json({
    message: 'success',
    response,
  });
});

exports.getAllChat = catchAsync(async (req, res, next) => {
  const data = await Chat.find().lean();

  if (!data) return next(new AppError('Belom ada chat', 404));

  res.status(200).json({
    message: 'success',
    result: data.length,
    data,
  });
});

exports.getUsersChat = catchAsync(async (req, res, next) => {
  const data = await Chat.find({ user: req.body.id }).lean();

  if (!data) return next(new AppError('There is no chat with that id', 404));

  res.status(200).json({
    message: 'success',
    result: data.length,
    data,
  });
});

exports.getSingleChat = catchAsync(async (req, res, next) => {
  const data = await Chat.findById(req.params.id);

  if (!data) return next(new AppError('There is no chat with that id', 404));

  res.status(200).json({
    message: 'success',
    data,
  });
});

exports.deleteChat = catchAsync(async (req, res, next) => {
  await Chat.findByIdAndDelete(req.params.id);

  res.status(204).json({
    message: 'success',
    data: null,
  });
});
