const ErrorHandler = require("../utils/ErrorHandler");

module.exports = (err,req,res,next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    if(err.name === "CastError"){
        const message = `Resource not found. Invalid ${err.path}`;
        err = new ErrorHandler(message,400);
    }

    // duplicate user error
    if(err.code === "E11000") {
        const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
        err = new ErrorHandler(message,400);
    }

    // wrong jwt token error
    if(err.name === "JsonWebTokenError") {
        const message = `Json web token is invalid, Try again`;
        err = new ErrorHandler(message,400);
    }

    // wrong jwt token expiry
    if(err.name === "TokenExpiredError") {
        const message = `Json web token is expired, Try again`;
        err = new ErrorHandler(message,400);
    }

    res.status(err.statusCode).json({
        success:false,
        message:err.message
    })
}