const mongoose = require('mongoose');

class EquipmentSchema extends mongoose.Schema {
    constructor() {
        super({
            Equipment_id: String,
            Name: String,
            Location: String,
            Description: String,
            Image_URL: String,
            Highlight: String,
        });
    }
}

module.exports = mongoose.model('Equipment', new EquipmentSchema());