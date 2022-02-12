const express = require('express');
const app = express();
const cors = require("cors");
const path = require("path");
/*
* DOTENV
*/
const dotenv = require('dotenv');
dotenv.config();

/*
 * APP USES
 */
app.use(express.json());
app.use(cors());
app.use("/uploads",express.static(path.join(__dirname,"uploads")))
/**
 * ROUTES
 */
 const AdminRoutes = require('./controllers/admin_user');
 const UserRoutes = require('./controllers/user');
 app.use("/api/auth",AdminRoutes);
 app.use("/api/user",UserRoutes);

/*
* SERVER PORT
*/
app.listen(process.env.PORT,() => {
    console.log("Server online na porta "+process.env.PORT);
});