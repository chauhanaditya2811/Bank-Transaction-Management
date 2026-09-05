const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

/*
* User Registration Controller
* post: /api/auth/register
*/

async function userRegisterController(req, res){

    const {email, name, password, passward} = req.body || {};
    const userPassword = password || passward;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !name?.trim() || !userPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email, name, and password are required'
        });
    }

    const isExistingUser = await userModel.findOne({email: normalizedEmail});
    
    if(isExistingUser){
        return res.status(400).json({
            success: false,
            message: "User already exists"
        })
    }

    const user = await userModel.create({
        email: normalizedEmail,
        name: name.trim(),
        password: userPassword
    })

    const token = jwt.sign({ userId: user._id }, process.env.jwt_secret, { expiresIn: '1h' });

    res.cookie('token',token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token 
    })


}

/**
 * User Login Controller
 * post: /api/auth/login
 */
async function userLoginController(req, res){
    const {email, password, passward} = req.body || {};
    const normalizedEmail = email?.trim().toLowerCase();
    const userPassword = password || passward;

    if (!normalizedEmail || !userPassword) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }

    const user = await userModel.findOne({email: normalizedEmail}).select('+password')
    if(!user || !userPassword || !user.password){
        return res.status(401).json({
            success: false,
            message: "email or password is incorrect"
        })
    }
    const isPasswordValid = await user.comparePassword(userPassword);
    if(!isPasswordValid){
        return res.status(401).json({
            success: false,
            message: "email or password is incorrect"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.jwt_secret, { expiresIn: '1h' });
    res.cookie('token', token);  
    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}



module.exports = {
    userRegisterController,
    userLoginController
}
