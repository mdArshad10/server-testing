import express from 'express'
import {config} from 'dotenv'

config()

const app = express();

app.use(express.json())
app.use(express.urlencoded({}))

app.get("/",(req,res)=>{
    res.status(200).json({
        message:"Api running successfully",
        success:true,
    })
})

app.get('/test',(req,res)=>{
    res.status(200).json({
        message:"Testing the api",
        success:true
    })
})

const port = process.env.PORT;

app.listen(port,()=>{
    console.log(`server is running at port => ${port}`);  
})