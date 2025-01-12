const mongoose = require('mongoose');

class rentRecordSchema extends mongoose.Schema {
    constructor() {
        super({
            Equipment_Name: String,
            Equipment_ID: String,
            Rent_Date: String,
        });
    }
}

module.exports = mongoose.model('RentRecord', new rentRecordSchema());