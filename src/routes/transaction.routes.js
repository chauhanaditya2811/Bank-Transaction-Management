const {router} = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const trasactionController = require('../controllers/transaction.controller');


const transactionRoutes = router();

/**
 * post/api/transactions/
 * create a new transaction 
 * protected route
 */
transactionRoutes.post('/', authMiddleware.authMiddleware, transactionController.createTransaction);




module.exports = transactionRoutes;