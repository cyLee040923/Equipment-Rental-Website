const mongoose = require('mongoose');

class UserSchema extends mongoose.Schema {
    constructor() {
        super({
            User_id: String,
            Email: String,
            Password: String,
            UserName: String,
            ContactNum: String,
            Department: String,
            isadmin: String,
        });
    }
}

module.exports = mongoose.model('User', new UserSchema());