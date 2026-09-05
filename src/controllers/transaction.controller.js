const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const mongoose = require('mongoose');



/**
 * Create a new transaction
 * the 10 step transfer flow:
 *  1. Validate the request 
 *  2. Validate idempotency key
 *  3. cheack account status
 *  4. derive sender balance from leger
 *  5. create transaction pending
 *  6. create debit ledger entry
 *  7. create credit ledger entry
 *  8. mark transaction as completed
 *  9. commit mongodb session
 *  10. send mail notification to sender and receiver
 */

async function createTransaction(req, res) {

    /**
     * Step 1: Validate the request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body || {};
    const numericAmount = Number(amount);
    if (!fromAccount || !toAccount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!mongoose.isValidObjectId(fromAccount) || !mongoose.isValidObjectId(toAccount)) {
        return res.status(400).json({ message: 'Account IDs must be valid' });
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    if (fromAccount === toAccount) {
        return res.status(400).json({ message: 'Source and destination accounts must be different' });
    }

    const fromUserAccount = await accountModel.findOne({ _id:fromAccount});
    const toUserAccount = await accountModel.findOne({ _id:toAccount});

    if(!fromUserAccount){
        return res.status(404).json({message:"From account not found"})
    }
    if(!toUserAccount){
        return res.status(404).json({message:"To account not found"})
    }

    /**
     * Step 2: Validate idempotency key
     */
    const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey });

    if(isTransactionAlreadyExists){
        return res.status(200).json({
            message: `Transaction is already ${isTransactionAlreadyExists.status}`,
            transaction: isTransactionAlreadyExists
        });
    }

    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only transfer funds from your own account' });
    }

    /**
     * Step 3: Check account status
     */
    if(fromUserAccount.status !== 'active'){
        return res.status(400).json({message:"From account is not active"})
    }
    if(toUserAccount.status !== 'active'){
        return res.status(400).json({message:"To account is not active"})
    }


        /**
         * Step 4: Derive sender balance from ledger
         */
    const balance = await fromUserAccount.getBalance();
    if(balance < numericAmount){
        return res.status(400).json({
            message:`insufficient balance. Current balance is ${balance}. required amount is ${numericAmount}`
        })
    }
        /**
         * Step 5: Create transaction pending
         */

    const session = await mongoose.startSession();
    try {
        let transaction;
        await session.withTransaction(async () => {
            transaction = new transactionModel({
                fromAccount,
                toAccount,
                amount: numericAmount,
                idempotencyKey,
                status: 'pending'
            });
            await transaction.save({ session });

            await new ledgerModel({
                account: fromAccount,
                amount: numericAmount,
                transaction: transaction._id,
                type: 'debit'
            }).save({ session });

            await new ledgerModel({
                account: toAccount,
                amount: numericAmount,
                transaction: transaction._id,
                type: 'credit'
            }).save({ session });

            transaction.status = 'completed';
            await transaction.save({ session });
        });

        return res.status(201).json({ message: 'Transaction completed successfully', transaction });
    } finally {
        await session.endSession();
    }
}

async function createInitialFundsTransaction(req, res) {
    const { accountId, amount, idempotencyKey } = req.body;

    if (!accountId || !amount || !idempotencyKey) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!mongoose.isValidObjectId(accountId) || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: 'Account ID and a positive amount are required' });
    }

    const existingTransaction = await transactionModel.findOne({ idempotencyKey });
    if (existingTransaction) {
        return res.status(200).json({
            message: 'Initial funds transaction already exists',
            transaction: existingTransaction
        });
    }

    const account = await accountModel.findById(accountId);
    if (!account) {
        return res.status(404).json({ message: 'Account not found' });
    }

    if (account.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only fund your own account' });
    }

    if (account.status !== 'active') {
        return res.status(400).json({ message: 'Account is not active' });
    }

    const session = await mongoose.startSession();
    try {
        let transaction;
        await session.withTransaction(async () => {
            transaction = new transactionModel({
                toAccount: account._id,
                amount: Number(amount),
                idempotencyKey,
                type: 'initial_funds',
                status: 'completed'
            });
            await transaction.save({ session });

            await new ledgerModel({
                account: account._id,
                amount: Number(amount),
                transaction: transaction._id,
                type: 'credit'
            }).save({ session });
        });

        return res.status(201).json({
            message: 'Initial funds added successfully',
            transaction
        });
    } finally {
        await session.endSession();
    }
}

        module.exports = { createTransaction, createInitialFundsTransaction };
