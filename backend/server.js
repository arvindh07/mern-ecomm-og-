const app = require("./app");
const dotenv = require("dotenv");
const connectDatabase = require("./config/db");
const bodyParser = require("body-parser");

process.on("uncaughtException",(err) => {
    console.log(err.message);
    console.log("Shutting down the server due to uncaught exception...");
    process.exit(1);
})

// config files
dotenv.config({path:"backend/config/config.env"});

connectDatabase();

// letting express to know that we r using these,
app.use(bodyParser.urlencoded({ extended: false }));


const server = app.listen(process.env.PORT,()=>{
    console.log(`Server is running...`); 
})

// unhandled promise rejection
process.on("unhandledRejection",(err) => {
    console.log(err.message);
    console.log("Shutting down the server due to unhandled promise rejection...");
    server.close(() => {
        process.exit(1);
    })
})