const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userschema = mongoose.Schema({
    email: {
        type: String,
        required:[true, 'Please provide an email'],
        trim: true,
        unique: [true, 'Email already exists'],
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        trim: true,
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false,

    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true
    }
}, {
    timestamps: true
})

userschema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next();
    }
    const hash= await bcrypt.hash(this.password, 10);
    this.password = hash;
    
})

userschema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password);
}
const userModel = mongoose.model('User', userschema);

module.exports = userModel;