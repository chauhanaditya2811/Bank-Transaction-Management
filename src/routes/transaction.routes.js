const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const transactionController = require('../controllers/transaction.controller');


const transactionRoutes = Router();

/**
 * post/api/transactions/
 * create a new transaction 
 * protected route
 */
transactionRoutes.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);

/**
 * post/api/transactions/system/initial-funds
 * add initial funds to an authenticated user's account
 */
transactionRoutes.post(
    '/system/initial-funds',
    authMiddleware.authMiddleware,
    transactionController.createInitialFundsTransaction
);


module.exports = transactionRoutes;
