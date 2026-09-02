import { Router } from 'express';
import { FinleyController } from '../controllers/finley.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @route   POST /api/finley/chat
 * @desc    Send a message to Mr. Finley (relayed to Server A)
 * @access  Private
 */
router.post('/chat', authenticate, FinleyController.chat);

/**
 * @route   POST /api/finley/chat/stream
 * @desc    Send a message to Mr. Finley with SSE streaming response
 * @access  Private
 */
router.post('/chat/stream', authenticate, FinleyController.chatStream);

/**
 * @route   GET /api/finley/disclosure
 * @desc    Get current disclosure text/version
 * @access  Public
 */
router.get('/disclosure', FinleyController.getDisclosure);

/**
 * @route   GET /api/finley/disclosure/status
 * @desc    Check if current user has accepted the disclosure
 * @access  Private
 */
router.get('/disclosure/status', authenticate, FinleyController.getDisclosureStatus);

/**
 * @route   POST /api/finley/disclosure/accept
 * @desc    Accept the current disclosure version
 * @access  Private
 */
router.post('/disclosure/accept', authenticate, FinleyController.acceptDisclosure);

export default router;