const mongoose = require('mongoose');


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'Account is required'],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        immutable: true,
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction is required'],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        message: 'Type can only be credit or debit',
        required: [true, 'Type is required'],
        immutable: true
    }

})

function preventLedgerModification() {
    // Implementation for preventing ledger modifications
    throw new Error('Ledger modifications are not allowed');
}
ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('updateMany', preventLedgerModification);
ledgerSchema.pre('findOneAndReplace', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);

const ledgerModel = mongoose.model('Ledger', ledgerSchema);

module.exports = ledgerModel;