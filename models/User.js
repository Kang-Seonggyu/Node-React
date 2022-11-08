const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxLength: 50,
    },
    email: {
        type: String,
        trim: true,
        unique: 1
    },
    password: {
        type: String,
        minLength: 5
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
})

userSchema.pre('save', function( next ){
    let user = this;

    //비밀번호를 변경할 때만 암호화
    if(user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if(err) return next(err)

            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) return next(err)
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})

userSchema.methods.comparePassword = async function(candidatePassword, cb) {
    //plainPassword를 암호화 후, 저장되어 있는 암호화된 비밀번호화 비교해야 함
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) return cb(err)
        cb(null, isMatch)
    })
}

userSchema.methods.generateToken = function(cb) {
    const user = this;
    //jwt 사용하여 토큰 생성
    const token = jwt.sign(user._id.toHexString(), 'secretToken')

    user.token = token
    user.save(function(err, user) {
        if(err) return cb(err)
        cb(null, user)
    })
}

userSchema.statics.findByToken = function(token, cb) {
    const user = this;

    //토큰 복호화
    jwt.verify(token, 'secretToken', function(err, decoded) {
        //유저 아이디 사용하여 해당 유저 찾음
        //클라이언트에서 가져온 토큰과 DB에 저장된 토큰과 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err, user) {
            if(err) return cb(err);
            cb(null, user);
        })
    })
}

const User = mongoose.model('User', userSchema)

module.exports = {User}