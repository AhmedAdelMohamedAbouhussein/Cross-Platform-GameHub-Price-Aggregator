
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    //res.send('Server is running Welcome to the backend server!')
    //res.sendstatus(500);
    //res.status(200).send('Server is running. Welcome to the backend server!');
    //res.status(200).json({ message: 'Server is running. Welcome to the backend server!' });
    //res.download('server-status.txt');
    //res.render('index.html');
    
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
