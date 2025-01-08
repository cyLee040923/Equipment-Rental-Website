const { MongoClient, ObjectId } = require('mongodb');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// mongoose.connect('mongodb://localhost:27017/Rental', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });


process.env.MONGODB_URI = 'mongodb://cylee040923:JBvZh0NkODivwtVTpCkkcI0ZjyMRFj8hm9KTBd20IQ4rZoWc9UKdRsaMFnqG8XNlHeV2wwpZka4tACDbAXjNdQ==@cylee040923.mongo.cosmos.azure.com:10255/?ssl=true&retrywrites=false&replicaSet=globaldb&maxIdleTimeMS=120000&appName=@cylee040923@';

if (!process.env.MONGODB_URI) {
    // throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    process.env.MONGODB_URI = 'mongodb://localhost:27017';
}

// Connect to MongoDB
async function connectToDB() {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db('Rental');
    db.client = client;
    return db;
}

module.exports = { connectToDB, ObjectId };