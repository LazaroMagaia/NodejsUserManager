const jwt = require('jsonwebtoken');

 const verifyToken =(req,res,next)=>{
    const authHeader = req.headers.authorization;
    if(authHeader)
    {
        const Token = authHeader.split(" ")[1];
        jwt.verify(Token,process.env.SECRET_JWT,(err,user)=>{
            if(err)
            {
                return res.status(401).json("token invalido");
            }else
            if(user.admin)
            {
                req.user = user;
                next();
            }
            else{
                return res.status(500).json("Nao tem autorização");
            }
        })
    }else
    {
        return res.status(403).json("Não tem autorização");
    }
}
exports.module = verifyToken;