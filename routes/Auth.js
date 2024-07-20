const router = require('express').Router();
const conn = require("../db/dbconnection");
const { body, validationResult } = require("express-validator");
const util =require("util");
const bcrypt=require('bcrypt');
const crypto = require('crypto');
//LOgIn
router.post(
    "/login", // Correct the route path here
    body("email").isEmail().withMessage("Please enter valid email"),
    body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between {8-12}"),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }
        //chack is email exist
        const query= util.promisify(conn.query).bind(conn); // transform qury my sql --> promise to use [await/async]
        const user = await query(
        "select * from users where email =?",[req.body.email]);
        if(user.length==0)
          {
              res.status(404).json({
                  errors:[
                      {msg:"email or password not correct !",}
                  ] 
  
              })
          }
         else
         {
            //compare password
            const checkpassword = await bcrypt.compare(req.body.password,user[0].password);
            if(checkpassword)
                {
                    delete user[0].password;
                    res.status(200).json(user[0])
                }
                else
                {
                    res.status(404).json({
                        errors:[
                            {msg:"email or password not correct !",}
                        ] 
        
                    })
                }
            
         }
          
          
          
      }
        
       catch (err) {
          console.log(err);
        res.status(500).json({ err: err });
      }})
//  registration     
router.post(
  "/register", // Correct the route path here
  body("email").isEmail().withMessage("Please enter valid email"),
  body("name").isString().withMessage("Please enter valid name")
    .isLength({ min: 10, max: 20 }).withMessage("name should be between {10-20}"),
  body("password").isLength({ min: 8, max: 12 }).withMessage("password should be between {8-12}"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      //chack is email exist
      const query= util.promisify(conn.query).bind(conn); // transform qury my sql --> promise to use [await/async]
      const checkEmailExist = await query(
      "select * from users where email =?",[req.body.email]);
      if(checkEmailExist.length>0)
        {
            res.status(400).json({
                errors:[
                    {msg:"email already exist !",}
                ] 

            })
        }
        else{
        const userdata ={
            name:req.body.name,
            email:req.body.email,
            password: await bcrypt.hash(req.body.password,10),
            token : crypto.randomBytes(16).toString("hex"),

        }
        //insert object in db
        await query ("insert into users set ?", userdata);
        delete userdata.password;
        res.status(200).json(userdata);
    }
      
    } catch (err) {
        console.log(err);
      res.status(500).json({ err: err });
    }
  }
);

module.exports = router;
