import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { problemController } from '../controllers/problem.controller.js';
import { commentController } from '../controllers/comment.controller.js';
import { aiController } from '../controllers/ai.controller.js';
import { algorithmController } from '../controllers/algorithm.controller.js';
import { interviewController } from '../controllers/interview.controller.js';
import { codeExecutionController } from '../controllers/codeExecution.controller.js';
const router = Router();

// --- Client / Auth Routes ---
router.post('/client/signup', userController.signup);
router.post('/client/login', userController.login);
router.post('/client/sendotp', userController.sendOtp);
router.post('/client/otpvarify', userController.verifyOtp);
router.post('/client/finduser', userController.findUser);
router.post('/client/changePassword', userController.changePassword);
router.post('/client/change-name', userController.changeName);
router.post('/client/change-email', userController.changeEmail);
router.post('/admin/login', userController.adminLogin);

// --- Problem / Coding Sheet Routes ---
router.post('/questions/user-solve', problemController.getUserSolveStats);
router.post('/questions/user-data', problemController.getUserTopicStats);
router.post('/questions/topic-wise-count', problemController.getTopicCount);
router.post('/questions/sheet-wise-count', problemController.getUserSheetTopicStats);
router.post('/questions/sheet-wise', problemController.getSheetProblemsCategorized);
router.post('/algorithm-details/addcheck', problemController.addCheck);
router.post('/algorithm-details/removecheck', problemController.removeCheck);

// --- Comments & Discussion Routes ---
router.get('/comment/show-comment', commentController.getComments);
router.post('/comment/send-comment', commentController.sendComment);
router.post('/comment/send-reply', commentController.sendReply);
router.post('/comment/like-handle', commentController.likeHandle);
router.post('/comment/comment-delete', commentController.deleteComment);
router.post('/comment/reply-delete', commentController.deleteReply);

// --- AI / Code Editor Routes ---
router.post('/code-editor/explain', aiController.explainCode);
router.post('/code-editor/hints', aiController.getHints);
router.post('/code-editor/code', aiController.generateCode);
router.post('/google-api', aiController.generateDSAResponse);

// --- Algorithm Info Routes ---
router.post('/algorithm/algorithm-find', algorithmController.findAlgorithm);
router.post('/algorithm/algorithm-search', algorithmController.searchAlgorithm);
router.post('/algorithm/algorithm-sidebar', algorithmController.getSidebar);
router.post('/algorithm/show-home-algorithm', algorithmController.getHomeAlgorithms);
router.post('/algorithm-details/algorithm-details-find', algorithmController.getAlgorithmDetails);
router.post('/algorithm-details/algorithm-question', algorithmController.getAlgorithmQuestions);

// --- Student Interview & Analyzer Routes ---
router.get('/interview/show-interview', interviewController.showInterview);
router.post('/interview/show-home-interview', interviewController.showHomeInterview);
router.post('/interview/interview-send', interviewController.sendInterview);
router.post('/interview/interview-find', interviewController.findInterview);
router.post('/interview/interview-search', interviewController.searchInterview);
router.post('/interview/varify-interview', interviewController.verifyInterview); // matches 'varify-interview' misspelling
router.post('/interview/show-interview-all', interviewController.showInterviewAll);

router.post('/interview-analyzer/interview-analyzer-sidebar', interviewController.analyzerSidebar);
router.post('/interview-analyzer/interview-analyzer-search', interviewController.analyzerSearch);
router.post('/interview-analyzer/interview-analyzer-find', interviewController.analyzerFind);
router.post('/interview-analyzer/interview-analyzer-algorithm', interviewController.analyzerAlgorithm);



// --- Code Execution Routes ---
router.post("/code-editor/run", codeExecutionController.run);

export default router;
