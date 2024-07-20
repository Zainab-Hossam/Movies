const router = require('express').Router();
const conn = require("../db/dbconnection");
const authized = require("../middleware/Authrize");
const admin = require("../middleware/admin")
const { body, validationResult } = require("express-validator");
const upload = require("../middleware/uploadimages");
const util =require('util');
const fs = require("fs");
// Admin[Create ]
router.post("",admin,
  upload.single('image') ,
body("name").isString().withMessage("please enter avalid movie name")
.isLength({min:10}).withMessage("the minmuam move name 10 charachtere"),
body("description").isString().withMessage("please enter avalid movie description")
.isLength({min:20}).withMessage("the minmuam move description 20 charachtere"),
async(req,res)=>{
    try{
    const errors = validationResult(req);
    if(!errors.isEmpty())
        {
         return res.status(400).json({errors:errors.array()}) 
        }
        else
        {
            if(!req.file)
                {
                    return res.status(400).json({
                        errors:[
                            {
                            msg:"image is required"
                        },
                    ],
                    });
                }
            
           
             
            const newmovie={
                name:req.body.name,
                description:req.body.description,
                image_url:req.file.filename

            }
            const query= util.promisify(conn.query).bind(conn);
           await query("insert into movies set ?",newmovie);
           res.status(200).json({msg:"movie created successfuly !"});
        }
  
    }catch(err){
    console.log(err);
        res.status(500).json(err)
    }
})
// Update
router.put("/:id",admin,
    upload.single('image') ,
  body("name").isString().withMessage("please enter avalid movie name")
  .isLength({min:10}).withMessage("the minmuam move name 10 charachtere"),
  body("description").isString().withMessage("please enter avalid movie description")
  .isLength({min:20}).withMessage("the minmuam move description 20 charachtere"),
  async(req,res)=>{
    const query= util.promisify(conn.query).bind(conn);
      try{
      const errors = validationResult(req);
      if(!errors.isEmpty())
          {
           return res.status(400).json({errors:errors.array()}) 
          }
          else
          {
            
                       // check to found movie
                      const Umovie = await query("select * from movies where id=? ",[req.params.id]);
                      if (!Umovie[0])
                        {
                         res.status(404).json({
                            msg:"movie Not found"
                         }) 
                        }
                        else
                        {
                            const newmovie={
                                name:req.body.name,
                                description:req.body.description,
                            }
                            if(req.file)
                                {
                                    newmovie.image_url=req.file.filename;
                                    fs.unlinkSync("./upload/"+Umovie[0].image_url); // delet old image

                                }
                                // update the movie
                                await query("update movies set ? where id=?",[newmovie,Umovie[0].id]);
                                 res.status(200).json({msg:"movie Updated succesfully"});
                        }    
          }
    
      }catch(err){
      console.log(err);
          res.status(500).json(err)
      }
  })
  //Delete
  router.delete("/:id",admin,
  async(req,res)=>{
    const query= util.promisify(conn.query).bind(conn);
      try{
      const errors = validationResult(req);
      if(!errors.isEmpty())
          {
           return res.status(400).json({errors:errors.array()}) 
          }
          else
          {
            
                       // check to found movie
                      const Dmovie = await query("select * from movies where id=? ",[req.params.id]);
                      if (!Dmovie[0])
                        {
                         res.status(404).json({
                            msg:"movie Not found"
                         }) 
                        }
                        else
                        {
                            fs.unlinkSync("./upload/"+Dmovie[0].image_url); // delet old image
                            //delete movie
                            await query("Delete from movies where id=?",Dmovie[0].id);
                            res.status(200).json({msg:"Movie deleted successfully"})
 
                        }    
          }
    
      }catch(err){
      console.log(err);
          res.status(500).json(err);
      }
  })
// List & search
router.get("",async(req,res)=>{
const query= util.promisify(conn.query).bind(conn);
let search = "";
if(req.query.search)
    {
        search =`where name LIKE'%${req.query.search}%'`;
    }
  const movies = await query(`select * from movies ${search}`)
  movies.map(movie=>{
    movie.image_url="http://"+req.host+":4000"+"/"+movie.image_url; 
  })
  res.status(200).json(movies)
  })
  //show Movie
  router.get("/:id",async(req,res)=>{
    const query= util.promisify(conn.query).bind(conn);
      const movie = await query("select * from movies where id=?",[req.params.id])
      if(!movie[0])
        {
            res.status(404).json({msg:"movie not found"})
        }
        
            movie[0].image_url ="http://"+ req.hostname + ":4000/" + movie[0].image_url;
            movie[0].reviews = await query("select * from user_movie_review where movie_id =?",movie[0].id);   
            
            res.status(200).json(movie[0]);
       
         
      })
      //review
  router.post("/Review",authized,body("movie_id").isNumeric().withMessage("please enter a valid movie id")
  ,body("review").isString().withMessage("please enter a valid review")
  ,async(req,res)=>{
    try{
    const query= util.promisify(conn.query).bind(conn);
    const errors = validationResult(req);
      if(!errors.isEmpty())
          {
           return res.status(400).json({errors:errors.array()}) 
          }
          const movie = await query("select * from movies where id= ? ",[req.body.movie_id]);
          if(!movie[0])
            {
            res.status(404).json({msg:"The Movie Not found"});
            }
            
                const reviwe_movie ={
                    user_id :res.locals.user.id ,
                    movie_id :req.body.movie_id ,
                    review :req.body.review
                };
                await query("insert into user_movie_review set ?",reviwe_movie)
                res.status(200).json({msg:"review added successfully"});
            
            }catch(err)
            {
                res.status(500).json(err);
            }
                
    })
module.exports=router;
