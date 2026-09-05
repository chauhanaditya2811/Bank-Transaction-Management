const accountmodel = require('../models/account.model');


async function createAccountController(req,res){
    const user = req.user;

    const account = await accountmodel.create({user:user._id})

    res.status(201).json({message:"Account created successfully", account})

}

async function getUserAccountsController(req,res){
    
    const accounts = await accountmodel.find({ user: req.user._id});

    res.status(200).json({
        accounts
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController
}
