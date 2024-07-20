const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("upload"));
const cors = require("cors");
app.use(cors());
const auth = require("./routes/Auth");
const movies = require("./routes/movies");
app.use("/auth",auth);
app.use("/movies",movies);
app.listen(4000,"localhost",()=>{
    console.log("server Is Running");
});



