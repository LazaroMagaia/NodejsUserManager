const router = require('express').Router();
const pool = require('../db/database');
const CryptoJS = require('crypto-js');
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req,file,cb)
    {
        cb(null, './uploads/');
    },filename:function(req,file,cb)
    {
        cb(null,req.body.name)
    }
});
const fileFilter =(req,file,cb)=>
{
    if(file.mimetype === "image/jpeg" || file.mimetype == "image/png")
    {
        cb(null,true)
    }else
    {
        cb(null,false)
    }
}
const upload = multer({storage:storage,limits:{
    fileSize:1024*1024*5 
},fileFilter:fileFilter
});

let verify =(req,res,next)=>{
    let authHeader = req.headers.authorization;
    if(authHeader)
    {
        let Token = authHeader.split(" ")[1];
        jwt.verify(Token,process.env.SECRET_JWT,(err,user)=>{
            if(err)
            {
                return res.status(401).json("token invalido");
            }
            req.user = user;
            next();
        })
    }else
    {
        return res.status(403).json("Não tem autorização");
    }
}

router.post("/register",(req,res)=>{
    const {name_company,email,contact_01,contact_02,Endereco} = req.body
    const admin = true;
    const password = CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_PASS).toString();
    const db_email =`SELECT * FROM nc_user_admin WHERE email = ?`
    pool.query(db_email,[email],(err,result)=>{
        if(err)
        {
            return res.status(401).json(error);
        }
        if(result[0]){
            return res.status(403).json("esse email ja esta em uso, tente outro");
        }else
        {
            //console.log(result);
            const sqlInsert =
            `INSERT INTO nc_user_admin (name_company,endereco,email,contact_01,contact_02,password,admin)
             VALUES(?,?,?,?,?,?,?)`
            pool.query(sqlInsert,[name_company,Endereco,email,contact_01,contact_02,password,admin],
                (error,result)=>{
                if(error)
                {
                    return res.status(401).json(error);
                }else
                {
                    return res.status(200).json("usuario registrado com sucesso");
                }
            });
        }});
    });

router.put("/adminPhoto/:id",upload.single("file"),verify,(req,res)=>{
    const id = req.params.id;
    const image_company = req.body.name;
    const sqlInsert =
    `UPDATE nc_user_admin SET image_company= ? where id=?`
    pool.query(sqlInsert,[image_company,id],
        (error,result)=>{
        if(error)
        {
            return res.status(401).json(error);
        }else
        {
            return res.status(200).json("Editado com sucesso");
        }
    });
});


router.post("/login",(req,res)=>{
    const email= req.body.email;
    try{
            const user = `SELECT * FROM nc_user_admin WHERE email = ?`
            pool.query(user,email,(error,result)=>{
                if(error)
                {
                    return res.status(401).json(error);
                }else
                {
                    if(!user)
                    {
                        return res.status(402).json("O usuario nao existe");
                    }
                    else
                    {
                    const hashedpassword = CryptoJS.AES.decrypt(result[0].password, process.env.SECRET_PASS);
                    const DBpassword = hashedpassword.toString(CryptoJS.enc.Utf8);
                    if(DBpassword !== req.body.password){
                        return res.status(401).json("Credenciais incorrectas");
                    }
                        const accessToken = jwt.sign({
                            id: result[0].id, 
                            admin:result[0].admin,
                        },process.env.SECRET_JWT,
                        {expiresIn:"2d"});
                        return res.status(200).json({email:result[0].email,accessToken,admin:result[0].admin}); 
                    }
                }
            });
        }catch(err){
            return res.status(500).json(err);
        }
});
router.get("/me/:email",verify,(req,res)=>{
    const email = req.params.email;
    try{
        const me = `SELECT * FROM nc_user_admin WHERE email = ?`
        pool.query(me,email,(error,result)=>{
            if(error)
            {
                return res.status(401).json(error);
            }else
            {
                if(!result)
                {
                    return res.status(402).json("O usuario nao existe");
                }else
                {
                    //let {password,...another} = result
                    return res.status(200).json(result);
                }
            }
        });
    }catch(err){res.status(500).json(err);}
})

module.exports = router;