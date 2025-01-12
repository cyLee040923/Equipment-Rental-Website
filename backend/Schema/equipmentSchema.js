const mongoose = require('mongoose');

class EquipmentSchema extends mongoose.Schema {
    constructor() {
        super({
            Name: String,
            Location: String,
            Description: String,
            Image_URL: String,
            Highlight: String,
        });
    }
}

module.exports = mongoose.model('Equipment', new EquipmentSchema());