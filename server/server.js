const express = require('express');

const app = express(); 

let PORT = 3000;

app.get('/app/v1/' , (req, res) => {
    res.status(200).json({
        message:'welcom to blog server',
        action:'go on our beatuful app'
    })
})


app.listen(PORT, () => {
    console.log(`server running port ${PORT}`);
})