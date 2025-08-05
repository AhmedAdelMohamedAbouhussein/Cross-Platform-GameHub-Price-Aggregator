import express from 'express';


const router = express.Router();

let posts = [
    { id: 1, title: 'First Post', content: 'This is the content of the first post.' },
    { id: 2, title: 'Second Post', content: 'This is the content of the second post.' },
    { id: 3, title: 'Third Post', content: 'This is the content of the third post.' },
]

router.get('/', (req, res) => 
{
    // Return all posts
    return res.status(200).json(posts);
});

router.get('/:id', (req, res) => 
{
    const postId = parseInt(req.params.id);

    // Check if the ID is not a number
    if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = posts.find((post) => post.id === postId);

    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }

    // Valid ID and post found
    return res.status(200).json(post);
});


//router.get('/', (req, res) => {
    //res.send('<h1>Server is running Welcome to the backend server!</h1>');
    //res.send({message: 'Hello World'});
    //res.sendstatus(500);
    //res.status(200).send('Server is running. Welcome to the backend server!');
    //res.status(200).json({ message: 'Server is running. Welcome to the backend server!' });
    //res.download('server-status.txt');
    //res.render('index.html'); 
//});



export default router;