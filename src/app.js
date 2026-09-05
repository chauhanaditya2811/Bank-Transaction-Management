const express = require('express');
const cookieParser = require('cookie-parser');




const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/**
 * routes required
 */
const authRoutes = require('./routes/auth.routes');
const accountRouter = require('./routes/account.routes');
const transactionRoutes = require('./routes/transaction.routes');


/**
 * use routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRouter);
app.use('/api/transactions', transactionRoutes);

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: Object.values(err.errors).map(error => error.message).join(', ')
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({ message: 'A record with this value already exists' });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid resource identifier' });
    }

    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
});



module.exports = app;
