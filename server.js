const multer = require ("multer")
const express = require('express')
const app = express()
const dotenv= require ('dotenv')
const colors = require('colors')
const bcrypt = require("bcrypt") 
const File = require("./models/File")
app.use(express.urlencoded({extended: true}))

const upload = multer ({dest: "uploads"})

const connectDB = require('./config/db')

dotenv.config({path: './config/config.env'})

connectDB()

app.set("view engine", "ejs")

app.get("/", (req, res) => {
    res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
const fileData = {
    path: req.file.path,
    originalName: req.file.originalname
    }
    if(req.body.password !== null && req.body.password !== ""){
        fileData.password = await bcrypt.hash(req.body.password, 10)  
    }

     const file = await File.create(fileData)
    
     res.render("index", {fileLink: `${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id").get(handleDownload).post(handleDownload)



async function handleDownload(req, res){
    const file = await File.findById(req.params.id)

    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
    
        if(!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", {error: true})
            return
        }
    }
    
    file.downloadCount++ 
    await file.save()
    console.log(file.downloadCount)
    res.download(file.path, file.originalName)
    
}

const PORT = process.env.PORT || 5000


app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`))