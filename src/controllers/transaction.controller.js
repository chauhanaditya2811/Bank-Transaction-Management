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
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({message:"Missing required fields"})
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
    const isTransactionAlreadyExists = await transactionModel.findOne({idempotencyKey: idempotencyKey});

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === 'completed'){
            return res.status(200).json({message:"Transaction is already completed",
                 transaction:isTransactionAlreadyExists})
           
            }
        }
        if(isTransactionAlreadyExists.status === 'pending'){
            return res.status(200).json({message:"Transaction is already pending",
                 transaction:isTransactionAlreadyExists})
        }
        if(isTransactionAlreadyExists.status === 'failed'){
            return res.status(200).json({message:"Transaction is already failed",
                 transaction:isTransactionAlreadyExists})
        }
        if(isTransactionAlreadyExists.status === 'reversed'){
            return res.status(200).json({message:"Transaction is already reversed",
                 transaction:isTransactionAlreadyExists})
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
        if(balance < amount){
            return res.status(400).json({
                message:`insufficient balance. Current balance is ${balance}. required amount is ${amount}`
            })
        }
        /**
         * Step 5: Create transaction pending
         */

        const session = await mongoose.startSession();
         session.startTransaction();

         const transaction = await transactionModel.create({
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status:'pending'
         }, {session});

         const debitLedgerEntry = await ledgerModel.create({
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: 'debit'
         }, {session});

         const creditLedgerEntry = await ledgerModel.create({
            account: toAccount,
            amount: amount,
            type: 'credit'
         }, {session});

         transaction.status = 'completed';
         await transaction.save({session});

         await session.commitTransaction();
         session.endSession();

            return res.status(201).json({message:"Transaction completed successfully", transaction});

        }

        module.exports = { createTransaction };
