const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ApiFeatures = require("../utils/ApiFeatures");

exports.createProduct = catchAsyncErrors(async(req,res) => {
    req.body.user = req.user.id;
    const prod = await Product.create(req.body);

    res.status(201).json({
        success:true,
        prod
    })
});

exports.getAllProducts = catchAsyncErrors(async(req,res) => {
    const resultPerPage = 10;
    const totalCount = await Product.countDocuments();
    const apiFeature = new ApiFeatures(Product.find(),req.query)
        .search()
        .filter()
        .pagination(resultPerPage);
    const prods = await apiFeature.query;
    res.json({
        success:true,
        prods
    })
});

exports.updateProduct = catchAsyncErrors(async(req,res,next) => {
    let prod = await Product.findById(req.params.id);

    if(!prod){
        return next(new ErrorHandler("Product not found",404));
    }

    prod = await Product.findByIdAndUpdate(req.params.id,req.body);
    res.json({
        success:true,
        message:"Product updated successfully"
    })
});

exports.deleteProduct = catchAsyncErrors(async(req,res,next) => {
    const prod = await Product.findById(req.params.id);

    if(!prod){
        return next(new ErrorHandler("Product not found",404));
    }

    await prod.remove();
    res.json({
        success:true,
        message:"Product deleted successfully"
    })
});

exports.getProduct = catchAsyncErrors(async(req,res) => {
    const prod = await Product.findById(req.params.id);

    if(!prod){
        return next(new ErrorHandler("Product not found",404));
    }

    res.status(200).json({
        success:true,
        prod,
        totalCount
    })
});