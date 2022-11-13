const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/ErrorHandler");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendMail");
const crypto = require("crypto");

exports.registerUser = catchAsyncErrors(async(req,res,next) => {
    const {name,email,password} = req.body;

    const user = await User.create({
        name,
        email,
        password,
        avatar:{
            public_id:"avatarpubid",
            url:"avatarurl"
        }
    })

    sendToken(user,201,res);
});

exports.loginUser = catchAsyncErrors(async(req,res,next) => {
    const {email,password} = req.body;

    if(!email || !password){
        return next(new ErrorHandler("Please enter email and password",400));
    }

    const user = await User.findOne({email}).select("+password");
    if(!user){
        return next(new ErrorHandler("Invalid email or password",401));
    }

    const passwordMatch = await user.comparePassword(password);
    if(!passwordMatch){
        return next(new ErrorHandler("Invalid email or password",401));
    }

    sendToken(user,200,res);
})

exports.logoutUser = catchAsyncErrors((req,res,next) => {
    res.cookie("token",null,{
        expires:new Date(Date.now()), 
        httpOnly:true,
    });

    res.json({
        success:true,
        message:"Logout successfully done"
    })
});

exports.forgotPassword = catchAsyncErrors(async (req,res,next) => {
    const user = await User.findOne({email:req.body.email});
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({validateBeforeSave:false});

    const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`;
    const message = `Your password reset token is:- \n\n ${resetPasswordUrl} \n If you have not requested this email then, please ignore it`;

    try {
        await sendEmail({
            email:user.email,
            subject:"Password Recovery",
            message
        })

        res.json({
            success:true,
            message:"Mail sent successfully"
        })
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save({validateBeforeSave:false});

        return next(new ErrorHandler(error.message,500));
    }
})

exports.resetPassword = catchAsyncErrors(async(req,res,next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({resetPasswordToken,resetPasswordExpiry:{$gt:Date.now()}});
    if(!user){
        return next(new ErrorHandler("User not found",404));
    }

    if(req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler("Password doesnt match",400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();
    sendToken(user,200,res);
})

exports.getUserDetails = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.user.id);
    if(!user){
        return next(new ErrorHandler("User not found",400));
    }

    res.status(200).json({
        success:true,
        user
    })
})

exports.updatePassword = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.user.id).select("+password");
    const isPasswordMatch = await user.comparePassword(req.body.oldPassword);
    if(!isPasswordMatch){
        return next(new ErrorHandler("Old password is incorrect",400));
    }

    if(req.body.newPassword !== req.body.confirmNewPassword){
        return next(new ErrorHandler("Password does not match",400));
    }

    user.password = req.body.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();
    sendToken(user,200,res);
})

exports.updateProfile= catchAsyncErrors(async(req,res,next) => {
    const newUserData = {
        name:req.body.name,
        email:req.body.email
    }
    const user = await User.findByIdAndUpdate(req.user.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    await user.save();

    res.status(200).json({
        success:true,
        user
    })
})

exports.getAllUsers = catchAsyncErrors(async(req,res,next) => {
    const users = await User.find();

    res.status(200).json({
        success:true,
        users
    })
})

exports.getSingleUser = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.params.id);

    if(!user){
        return next(new ErrorHandler("Invalid user id",400));
    }

    res.status(200).json({
        success:true,
        user
    })
})

exports.updateRole = catchAsyncErrors(async(req,res,next) => {
    const newUserData = {
        name:req.body.name,
        email:req.body.email,
        role:req.body.role
    }

    let user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler("User not found",400));
    }
    user = await User.findByIdAndUpdate(req.params.id,newUserData,{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });
    await user.save();

    res.status(200).json({
        success:true,
        user
    })
})

exports.deleteUser = catchAsyncErrors(async(req,res,next) => {
    const user = await User.findById(req.params.id);
    if(!user){
        return next(new ErrorHandler("User not found",400));
    }
    await user.remove();

    res.status(200).json({
        success:true,
        message:"user deleted successfully"
    })
})

exports.createReview = catchAsyncErrors(async(req,res,next) => {
    const {productId,rating,comment} = req.body;
    const review = {
        user:req.user._id,
        name:req.user.name,
        rating:Number(rating),
        comment:comment
    }

    const prod = await Product.findById(productId);
    const isReviewed = prod.reviews.find(rev => rev.user.toString() === req.user._id.toString());
    if(isReviewed){
        prod.reviews.forEach(rev => {
            if(rev.user.toString() === req.user._id.toString()){
                rev.rating = rating,
                rev.comment = comment
            }
        })
    }else{
        prod.reviews.push(review);
        prod.numberOfReviews = prod.reviews.length;
    }

    let avg = 0;
    prod.reviews.forEach(rev => avg += rev.rating);
    prod.ratings = avg/prod.reviews.length;

    await prod.save({validateBeforeSave:false})
    res.status(200).json({
        success:true,
        prod
    })
})

exports.getProductReviews = catchAsyncErrors(async(req,res,next) => {
    const prod = await Product.findById(req.query.id);
    if(!prod){
        return next(new ErrorHandler("Product not found",400));
    }

    res.status(200).json({
        success:true,
        reviews: prod.reviews
    })
});

exports.deleteReview = catchAsyncErrors(async(req,res,next) => {
    console.log(req.query);
    const prod = await Product.findById(req.query.productId);
    if(!prod){
        return next(new ErrorHandler("Product not found",400));
    }

    const reviews = prod.reviews.filter((rev) => rev._id.toString() !== req.query.id.toString());
    let avg = 0;
    prod.reviews.forEach(rev => avg += rev.rating);
    const ratings = prod.ratings = avg/prod.reviews.length;
    const numberOfReviews = prod.reviews.length;
    await Product.findByIdAndUpdate(req.query.productId,{
        reviews,ratings,numberOfReviews
    },{
        new:true,
        runValidators:true,
        useFindAndModify:false
    });

    res.status(200).json({
        success:true,
        message:"review deleted successfully"
    })
});