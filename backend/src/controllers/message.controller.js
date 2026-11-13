const multer  = require('multer');
const chatService = require('../services/chat.service');
const { asyncHandler } = require('../middleware/error.middleware');

// ── Multer — store files in memory (max 20 MB) ──────────────────────────────
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
  // Video
  'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime',
  // Audio
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4',
  'audio/m4a', 'audio/aac',
  // Documents
  'application/pdf',
  'text/plain',
  'text/csv',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
  },
});

// Export the multer middleware so the router can apply it
const uploadMiddleware = upload.single('file');

// ── POST /api/chats/:chatId/messages  (non-streaming) ──────────────────────
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId }  = req.params;
  const { message } = req.body;

  const fileData = req.file
    ? { mimeType: req.file.mimetype, data: req.file.buffer, originalName: req.file.originalname }
    : null;

  const { assistantMessage } = await chatService.sendMessage(
    req.userId, chatId, message || '', fileData
  );

  res.status(200).json({
    success: true,
    message: {
      role:      assistantMessage.role,
      content:   assistantMessage.content,
      createdAt: assistantMessage.createdAt,
    },
  });
});

// ── POST /api/chats/:chatId/messages/stream  (SSE streaming) ────────────────
const sendMessageStream = asyncHandler(async (req, res) => {
  const { chatId }  = req.params;
  const { message } = req.body;

  // Require either a text message or a file (or both)
  if (!message?.trim() && !req.file) {
    return res.status(400).json({ success: false, message: 'Message or file is required.' });
  }

  const fileData = req.file
    ? { mimeType: req.file.mimetype, data: req.file.buffer, originalName: req.file.originalname }
    : null;

  res.writeHead(200, {
    'Content-Type':    'text/event-stream',
    'Cache-Control':   'no-cache',
    'Connection':      'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let clientDisconnected = false;
  req.on('close', () => { clientDisconnected = true; });

  try {
    const generator = chatService.sendMessageStream(
      req.userId, chatId, message || '', fileData
    );

    for await (const chunk of generator) {
      if (clientDisconnected) break;
      send('chunk', { text: chunk });
    }

    if (!clientDisconnected) send('done', {});
  } catch (error) {
    console.error('Streaming error:', error);
    if (!clientDisconnected) {
      send('error', {
        message: error.statusCode ? error.message : 'Something went wrong. Please try again.',
      });
    }
  } finally {
    res.end();
  }
});

module.exports = { sendMessage, sendMessageStream, uploadMiddleware };
