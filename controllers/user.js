const router = require('express').Router();
const pool = require('../db/database');
const CryptoJS = require('crypto-js');
const jwt = require("jsonwebtoken");
var crypto = require('crypto');
const multer = require('multer');
const { response } = require('express');
const PoolCluster = require('mysql/lib/PoolCluster');
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


router.post("/register",verify,(req,res)=>{
    const {first_name,second_name,email} = req.body
    const emailAdmin = req.body.emailAdmin;
    let id_project =null;
    const adm =`SELECT * FROM nc_user_admin WHERE email = ?`
    pool.query(adm,emailAdmin,(err,result)=>{
        if(err)
        {
            console.log(err)
        }else
        {
            id_project = result[0].id;
        }
    })
    const db_email =`SELECT * FROM nc_user WHERE email = ? AND id_project =${id_project}`
    pool.query(db_email,[email],(err,result)=>{
        if(err)
        {
            return res.status(401).json(error);
        }
        if(result[0]){
            return res.status(500).json("esse email ja esta em uso, tente outro");
        }else{
            const password = CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_PASS).toString();
            const sqlInsert =
            `INSERT INTO nc_user (first_name,second_name,id_project,email,password)
            VALUES(?,?,?,?,?)`
            pool.query(sqlInsert,[first_name,second_name,id_project,email,password],
                (error,result)=>{
                if(error)
                {
                    return res.status(401).json(error);
                }else
                {
                    return res.status(200).json("usuario registrado com sucesso");
                }
            });
        }
    }) 
    
});

router.post("/login",(req,res)=>{
    const email= req.body.email;
    try{
            const user = `SELECT * FROM nc_user WHERE email = ?`
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
                        },process.env.SECRET_JWT,
                        {expiresIn:"2d"});
                        return res.status(200).json({email:result[0].email,accessToken}); 
                    }
                }
            });
        }catch(err){
            return res.status(500).json(err);
        }
});
router.get("/alluser/:id",verify,(req,res)=>{
    const email = req.params.id;
    let id =null;
    const adm =`SELECT * FROM nc_user_admin WHERE email = ?`
    pool.query(adm,email,(error,result)=>{
        if(error)
        {
            console.log(error)
        }else
        {
            id = result[0].id;
            
        }
        
    try{
        const user = `SELECT * FROM nc_user WHERE id_project = ?`
        pool.query(user,id,(error,result)=>{
            if(error)
            {
                return res.status(500).json(error);
            }else
            {
                if(!result)
                {
                    return res.status(403).json("o usuario nao existe");  
                }else
                {
                    return res.status(200).json(result);    
                }
            }
            });}
            catch(err){
                        return res.status(500).json(err);
                    }
        });
    })
router.get("/OneUser/:id",verify,(req,res)=>{
    try{
        const user = `SELECT * FROM nc_user WHERE id=?`
        pool.query(user,req.params.id,(error,result)=>{
            if(error)
            {
                return res.status(500).json(err);
            }else
            {
                if(!result)
                {
                    return res.status(403).json("o usuario nao existe");  
                }else
                {
                    const hashedpassword = CryptoJS.AES.decrypt(result[0].password, process.env.SECRET_PASS);
                    const DBpassword = hashedpassword.toString(CryptoJS.enc.Utf8);
                    return res.status(200).json({
                        first_name:result[0].first_name,
                        second_name:result[0].second_name,
                        email:result[0].email,
                        password:DBpassword
                    });    
                }
            }
    });}
    catch(err){
                return res.status(500).json(err);
    }
});
router.put("/edit/:id",verify,(req,res)=>{
    const id = req.params.id;
    const {first_name,second_name,email} = req.body
   const verifyUser = `SELECT * FROM nc_user WHERE id = ${id}`
   pool.query(verifyUser,(err,result)=>{
       if(err)
       {
           return res.status(500).json(err)
       }if(result)
       {
        const password = CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_PASS).toString();
        const sqlInsert =
        `UPDATE nc_user SET first_name= ?,second_name= ?,email=?,password=? where id=?`
        pool.query(sqlInsert,[first_name,second_name,email,password,id],
            (error,result)=>{
            if(error)
            {
                return res.status(401).json(error);
            }else
            {
                return res.status(200).json("Editado com sucesso");
            }
        });           
       }else if(result >0){
        const db_email =`SELECT * FROM nc_user`
        db_email_validation = req.body.email;
        vd = 0;
        pool.query(db_email,(err,result)=>{
            if(err)
            {
                return res.status(401).json(err);
            }
            if(result){
                emails = result.length;
                for(let i=0;i<emails;i++)
                {
                    if(result[i].email == db_email_validation)
                    {
                        vd+=i;
                       let total = vd;
                    }
                }
                if(total > 0){
                    return res.status(500).json("Email invalido");
                }else
                {       
                    const password = CryptoJS.AES.encrypt(req.body.password, process.env.SECRET_PASS).toString();
                    const sqlInsert =
                    `UPDATE nc_user SET first_name= ?,second_name= ?,email=?,password=? where id=?`
                    pool.query(sqlInsert,[first_name,second_name,email,password,id],
                        (error,result)=>{
                        if(error)
                        {
                            return res.status(401).json(error);
                        }else
                        {
                            return res.status(200).json("Editado com sucesso");
                        }
                    });
                }
            }
        });        
       }
   })
});
router.put("/photo/:id",upload.single("file"),verify,(req,res)=>{
    const id = req.params.id;
    const perfil_photo = req.body.name;
    const sqlInsert =
    `UPDATE nc_user SET perfil_photo= ? where id=?`
    pool.query(sqlInsert,[perfil_photo,id],
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

router.delete("/delete/:id",verify,(req,res)=>{
    const id = req.params.id;
   const sqlInsert = `DELETE FROM nc_user where id=?`
    pool.query(sqlInsert,id,
        (error,result)=>{
        if(error)
        {
            return res.status(401).json(error);
        }else
        {
            return res.status(200).json("Removido com sucesso");
        }
    });
});
router.get("/me/:email",(req,res)=>{
    const email = req.params.email;
    try{
        const me = `SELECT * FROM nc_user WHERE email = ?`
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
                    return res.status(200).json({
                        first_name:result[0].first_name,
                        second_name:result[0].second_name
                    });
                }
            }
        });
    }catch(err){res.status(500).json(err);}
})

module.exports = router;