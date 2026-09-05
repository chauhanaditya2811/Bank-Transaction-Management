const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")




async function authMiddleware(req,res,next){
    const authorization = req.headers.authorization;
    const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    const token = req.cookies.token || bearerToken;

    if(!token){
        return res.status(403).json({message:"Unauthorized"})
    }

    try{
        const decoded = jwt.verify(token, process.env.jwt_secret)
        const user = await userModel.findById(decoded.userId)
        if (!user) {
            return res.status(401).json({message:"Invalid token"})
        }
        req.user = user
        return next()
    } catch (error) {
        return res.status(401).json({message:"Invalid token"})
    }
}


module.exports ={ authMiddleware }
