const express = require('express');
const app=express();
const mongoose = require('mongoose');
const articleRoute = require('./routes/article')
const authRoute = require('./routes/auth')

app.use(express.json());
app.use('/uploads', express.static('uploads'));


mongoose.connect('mongodb://localhost:27017/userTable', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Database connected successfully');
}).catch(error => {
    console.log('Connection Failed', error)
});

app.use('/api', articleRoute);
app.use('/api',authRoute);

app.listen(6000, () => {
    console.log('server running on port number 6000');
})
