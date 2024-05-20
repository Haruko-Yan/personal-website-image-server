import express from "express";
import {fileURLToPath} from "url";
import {dirname} from "path";
import multer from "multer";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fs from "fs";
import env from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));

// configure the path and name of the uploaded images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/uploadedImages/' + req.body.author + '/' + req.body.title + '/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, 'public/uploadedImages/' + req.body.author + '/' + req.body.title + '/');
    },
    filename: function (req, file, cb) {
        // By default, multer may decode headers values using latin1, now we use utf-8 to decode the file name
        file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, file.originalname);
    }
  });
const upload = multer({ storage: storage })

env.config();
const port = 3000;

const app = express();

app.use(express.static("public")); // set the path of static resources
app.use(bodyParser.urlencoded({ extended: true }));

await mongoose.connect("mongodb+srv://admin-Bruce:" + process.env.ATLAS_PASSWORD + "@cluster0.lpt8u6w.mongodb.net/personal-website");
const articleSche = new mongoose.Schema({
    author: String,
    title: String,
    tag: [String],
    text: String,
    date: Date,
    editDate: [Date],
    hits: Number,
    recommend: Boolean
});
const Article = mongoose.model("Article", articleSche);


app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/welcome.html");
});

// Update the content of the article
app.post("/manage/editList/edit/:articleId", upload.array('images'), async (req, res) => {
    const article = await Article.findOne({_id: req.params.articleId});
    article.editDate.push(new Date());
    await Article.updateOne({_id: req.params.articleId}, 
        {author: req.body.author, title: req.body.title, tag: req.body.tag, text: req.body.text, editDate: article.editDate});
    res.render(__dirname + "/views/success.ejs", {pageName: "Edit List", route: "manage/editList"});
});
// Save the images uploaded from publication
app.post("/publish", upload.array('images'), (req, res) => {
    var result = req.body;
    var tags = req.body.tag.split(" ");
    // make the every tag unique
    const uniqueTag = tags.filter((obj, index) => {
        return index === tags.findIndex(o => obj === o);
    });
    const article = new Article({
        author: result.author,
        title: result.title,
        tag: uniqueTag,
        text: result.text,
        date: new Date(),
        hits: 0
    });
    article.save();
    res.render(__dirname + "/views/success.ejs", {pageName: "Management", route: "manage/write"});
});

app.listen(port, () => {
    console.log("Server running on port " + port);
});
