const mongoose = require('mongoose');

class UserSchema extends mongoose.Schema {
    constructor() {
        super({
            UserName: String,
            Email: String,
            Password: String,
            ContactNum: String,
            isadmin: String,
        });
    }
}

module.exports = mongoose.model('User', new UserSchema());