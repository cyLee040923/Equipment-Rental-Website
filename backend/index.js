const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Equipment = require('./Schema/equipmentSchema');
const User = require('./Schema/userSchema');
const HighlightedEquipment = require('./Schema/equipmentSchema');
const { connectToDB, ObjectId } = require('./utils/db');
const { authenticate, verifyToken, generateToken} = require('./utils/auth');
const cors = require('cors');

// //For HTTPS server
// const https = require('https');
// const fs = require('fs');
// const path = require('path');

class Server {
    constructor() {
        this.app = express();
        const port = 3000;
        this.app.use(express.json());
        this.app.use(cors({
            origin: 'http://localhost:3001', // Your React app's URL
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type'],
        }));
        // this.connectDatabase();
        this.setupRoutes();
        // this.startServer();
        this.app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    }


    setupRoutes() {
        this.app.get('/api', async function(req, res) {
            let db;
            try {
                db = await connectToDB();
                console.log("fetching highlighted equipment");
                const highlightedEquipment = await db.collection("equipment").find({ Highlight: "on" }).toArray();
                
                // Send only one response
                return res.json(highlightedEquipment);
            } catch (err) {
                console.error(err);
                return res.status(400).json({message: err.message});
            } finally {
                if (db) await db.client.close();
            }
        });

        // // Core Account Management Routes
        // this.app.post('/api/login', this.handleLogin);           
        // this.app.post('/api/register', this.handleRegister);     
        // this.app.get('/api/users', this.getUsers);              
        // this.app.post('/api/users', this.createUser);           
        // this.app.delete('/api/users/:username', this.deleteUser); 
        // this.app.get('/api/users/:username/info', this.getUserInfo); 
        // this.app.put('/api/users/:username/password', this.updateUserPassword);
        

        

        // Equipment Management Routes

        // Create new equipment
        this.app.post('/api/equipments', async (req, res) => {
            const db = await connectToDB();
            console.log("creating new equipment");
            try{
                req.body.created_at = new Date();
                req.body.modified_at = new Date();
                let result = await db.collection("equipment").insertOne(req.body);
                res.status(201).json({ id: result.insertedId });
            }catch(err){
                res.status(400).json({ message: err.message });
            }finally{
                await db.client.close();
            }
        });

        // Get all equipment
        this.app.get('/api/equipments', async (req, res) => {
            const db = await connectToDB();
            try {
                const db = await connectToDB();
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 6;
                const skip = (page - 1) * limit;

                const totalItems = await db.collection("equipment").countDocuments();
                const totalPages = Math.ceil(totalItems / limit);

                
                const equipment = await db.collection("equipment")
                                .find()
                                .skip(skip)
                                .limit(limit)
                                .toArray();
                const total = await db.collection("equipment").countDocuments();
                res.json({ equipment, total, page, pages: Math.ceil(total / limit) });
            } catch (err) {
              console.error(err);
              res.status(500).json({ message: err.message });
            } finally {
              await db.client.close();
            }
        });
        
        // Get one single equipment by the equipment id
        this.app.get('/api/equipments/:id', async (req, res) => {
            const db = await connectToDB();
            console.log("get one single equipment by the equipment id");
            try {
                let result = await db.collection("equipment").findOne({ _id: new ObjectId(req.params.id) });
                if (result) {
                    res.json({ equipment: result });
                } else {
                    res.status(404).json({ message: "Equipment not found" });
                }
            } catch (err) {
                res.status(400).json({ message: err.message });
            } finally {
                await db.client.close();
            }
        });

        // Update equipment
        this.app.put('/api/equipments/:id', async (req, res) => {
            const db = await connectToDB();
            console.log("editing equipment");
            try {
                // Validate ID
                if (!req.params.id || !ObjectId.isValid(req.params.id)) {
                    return res.status(400).json({ message: "Invalid equipment ID" });
                }

                // Validate required fields
                if (!req.body.Name || !req.body.Location) {
                    return res.status(400).json({ message: "Name and Location are required" });
                }

                // Create update object
                const updateData = {
                    Name: req.body.Name,
                    Location: req.body.Location,
                    Description: req.body.Description,
                    Image_URL: req.body.Image_URL,
                    Highlight: req.body.Highlight || "", 
                    modified_at: new Date()
                };

                console.log("Updating with data:", updateData);

                const result = await db.collection("equipment").updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: updateData }
                );
            
                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: "Equipment updated" });
                } else {
                    res.status(404).json({ message: "Equipment not found" });
                }
            } catch (err) {
                res.status(400).json({ message: err.message });
            } finally {
                await db.client.close();
            }
        });

        // Delete equipment
        this.app.delete('/api/equipments/:id', async (req, res) => {
            const db = await connectToDB();
            console.log("deleting equipment");
            try {
            let result = await db.collection("equipment").deleteOne({ _id: new ObjectId(req.params.id) });
            if (result.deletedCount > 0) {
                res.status(200).json({ message: "Equipment deleted" });
            } else {
                res.status(404).json({ message: "Equipment not found" });
            }
            } catch (err) {
            res.status(400).json({ message: err.message });
            } finally {
            await db.client.close();
            }
        });

        // List of equipment in rent page
        this.app.get('/api/equipments/rent', async (req, res) => {
            const db = await connectToDB();
            console.log("fetching equipment for rent");
            try {
                let result = await db.collection("equipment").find().toArray();
                res.json({ equipment: result });
            } catch (err) {
                res.status(400).json({ message: err.message });
            }
        });


        // Rent equipment
        this.app.post('/api/equipments/rent/:id', async (req, res) => {
            const db = await connectToDB();
            console.log("Rent equipment");
            try {
                const equipmentId = req.params.id;
                const rentDate = req.body.Rent_Date;

                // Validate equipment ID
                if (!ObjectId.isValid(equipmentId)) {
                    return res.status(400).json({ message: "Invalid equipment ID" });
                }

                // Validate rent date exists
                if (!rentDate) {
                    return res.status(400).json({ message: "Rent date is required" });
                }

                // Check if rent date is in the past
                const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
                if (rentDate < today) {
                    return res.status(401).json({ 
                        message: "Cannot rent equipment for past dates" 
                    });
                }


                
                // const { Equipment_Name, Equipment_ID, Rent_Date } = req.body;

                // Check if the equipment is avaliable for the day user want to rent
                const currentRental = await db.collection("rental-records").findOne({
                    Equipment_ID: equipmentId,
                    Rent_Date: rentDate
                });
        
                if (currentRental) {
                    return res.status(400).json({ 
                        message: `Equipment unavailable on ${rentDate}` 
                    });
                }
        
                // Fetch equipment details
                const equipment = await db.collection("equipment").findOne({ _id: new ObjectId(equipmentId) });
        
                if (!equipment) {
                    return res.status(404).json({ message: "Equipment not found" });
                }
        
                // Create rent record
                const rentRecord = {
                    Equipment_Name: equipment.Name,
                    Equipment_ID: equipment._id.toString(),
                    Rent_Date: rentDate,
                    created_at: new Date()
                };
        
                let result = await db.collection("rental-records").insertOne(rentRecord);

                if (!result.insertedId) {
                    throw new Error("Failed to create rent record");
                }

                res.status(201).json({ 
                    message: "Rent record created successfully",
                    id: result.insertedId,
                    rentRecord: {
                        ...rentRecord,
                        _id: result.insertedId
                    }
                });
            }catch(err){
                res.status(400).json({ message: err.message });
            }finally{
                await db.client.close();
            }
        });



        // User Management Routes

        // Create new user
        this.app.post('/api/register', async (req, res) => {
            const db = await connectToDB();
            const { username, password, email, contact, isAdmin } = req.body;
            try {
                const existingUser = await db.collection("users").findOne({
                    $or: [
                        { username: username },
                        { email: email }
                    ]
                });
        
                if (existingUser) {
                    return res.status(400).json({ message: 'User already exists' });
                }
                console.log("creating new user");
                req.body.created_at = new Date();
                req.body.modified_at = new Date();
                let result = await db.collection("users").insertOne(req.body);
                res.status(201).json({
                    success: true,
                    id: result.insertedId,
                    message: "Registration successful",
                });
                
            } catch (err) {
                res.status(400).json({
                    success: false,
                    message: err.message
                });
            } finally {
                await db.client.close();
            }
        });


        // login
        this.app.post(`/api/login`, async (req, res) => {
            const db = await connectToDB();
            const { email, password } = req.body;
            try {
                console.log("logging in");
                const user = await db.collection("users").findOne({ email: email });
                if (!user) {
                    return res.status(401).json({ message: 'User not found for email.' });
                }

                if(user.password !== password){
                    return res.status(402).json({ message: 'Invalid password' });
                } 

                console.log("login successful");
                console.log("User admin status:", user.isAdmin);
                const token = jwt.sign({ id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin }, 'your_jwt_secret', { expiresIn: '1h' }); 

                if (!token) {
                    return res.status(500).json({ message: 'Error generating token' });
                }

                res.json({ token, isAdmin: user.isAdmin, username: user.username });

                

                // const isMatch = await bcrypt.compare(password, user.password);
                // if (!isMatch) {
                //     return res.status(401).json({ message: 'Invalid credentials' });
                // }

                // console.log("login successful");
                // const token = jwt.sign({ id: user._id, username: user.username, email: user.email, isadmin: user.isadmin }, 'your_jwt_secret', { expiresIn: '1h' }); 
                // res.json({ token, isadmin: user.isadmin, username: user.username });
                
            }catch(err){
                res.status(400).json({ message: err.message }); 
            }finally {
                await db.client.close();
            }

        });

        
        // Get one single user by the user id
        this.app.get('/api/equipments/:User_id', authenticate, verifyToken, async (req, res) => {
            const db = await connectToDB();
            try {
                let result = await db.collection("users").findOne({
                    _id: new ObjectId(req.params.id)
                });
                if (result) {
                    res.json({
                        success: true,
                        data: result
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
            } catch (err) {
                res.status(400).json({
                    success: false,
                    message: err.message
                });
            } finally {
                await db.client.close();
            }
        });

        // Update user
        this.app.put('/api/users/:User_id', authenticate, verifyToken, async (req, res) => {
            const db = await connectToDB();
            try {
                req.body.modified_at = new Date();
                let result = await db.collection("users").updateOne(
                    { _id: new ObjectId(req.params.id) },
                    { $set: req.body }
                );

                if (result.modifiedCount > 0) {
                    res.json({
                        success: true,
                        message: "User updated successfully"
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
            } catch (err) {
                res.status(400).json({
                    success: false,
                    message: err.message
                });
            } finally {
                await db.client.close();
            }
        });

        // Delete user
        this.app.delete('/api/users/:User_id', authenticate, verifyToken, async (req, res) => {
            const db = await connectToDB();
            try {
                let result = await db.collection("users").deleteOne({
                    _id: new ObjectId(req.params.id)
                });
                if (result.deletedCount > 0) {
                    res.json({
                        success: true,
                        message: "User deleted successfully"
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        message: "User not found"
                    });
                }
            } catch (err) {
                res.status(400).json({
                    success: false,
                    message: err.message
                });
            } finally {
                await db.client.close();
            }
        });

    }
    

    
    
    // Function to handle user login and admin page (Section Start)
    async handleLogin(req, res) {
        const { username, password } = req.body;
        try {
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (!user.isEmailVerified) {
                return res.status(403).json({ 
                    message: 'Email verification required',
                    requiresVerification: true,
                    username: user.username
                });
            }

            const token = jwt.sign(
                { userId: user._id, username, isadmin: user.isadmin },
                'your_jwt_secret',
                { expiresIn: '1h' }
            );
            res.json({ token, isadmin: user.isadmin, username });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async handleRegister(req, res) {
        const { username, password, email } = req.body;
        try {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                username,
                password: hashedPassword,
                email,
                isadmin: 0,
                isEmailVerified: false
            });

            await user.save();
            await authService.handleResendOTP(username);
            res.status(201).json({ 
                message: 'Registration successful. Please verify your email.',
                username 
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await User.find({}, { password: 0 });
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async createUser(req, res) {
        const { username, password, isadmin } = req.body;
        try {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' }); // avoid duplicate user
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                username,
                password: hashedPassword,
                isadmin: isadmin ? 1 : 0,
                isEmailVerified: isadmin ? true : false
            });

            await user.save();
            res.status(201).json({ message: 'User created successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async deleteUser(req, res) {
        try {
            await User.deleteOne({ username: req.params.username });
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async getUserInfo(req, res) {
        try {
            const user = await User.findOne(
                { username: req.params.username },
                { otp: 0 }
            );
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }

    async updateUserPassword(req, res) {
        try {
            const { newPassword } = req.body;
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            const user = await User.findOneAndUpdate(
                { username: req.params.username },
                { password: hashedPassword },
                { new: true }
            );
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'Password updated successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
    // Function to handle login page and admin page (Section End)

}

// Initialize server
new Server();
