const errorHandeler = (err, req, res, next) => 
{
    if(err.status)
    {
        return res.status(err.status).json({ error: err.message });
    }
    res.status(500).json({ message: err.message});
};

export default errorHandeler;