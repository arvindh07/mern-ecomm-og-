const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/ErrorHandler");

exports.newOrder = catchAsyncErrors(async(req,res,next) => {
    const {shippingInfo,orderItems,paymentInfo,itemsPrice,taxPrice,shippingPrice,totalPrice} = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt:Date.now(),
        user:req.user._id
    });

    res.status(200).json({
        success:true,
        message:"Order created successfully",
        order
    })
});

exports.getSingleOrder = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.findById(req.params.id).populate("user","name email");
    if(!order){
        return next(new ErrorHandler("Order not found for this id",400));
    }

    res.status(200).json({
        success:true,
        order
    })
})

exports.myOrders = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.find({user: req.user._id});

    res.status(200).json({
        success:true,
        order
    })
})

// for admin
exports.getAllOrders = catchAsyncErrors(async(req,res,next) => {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    })

    res.status(200).json({
        sucess:true,
        orders,
        totalAmount
    }) 
});

exports.updateOrder = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.findById(req.params.id); 
    if(!order){
        return next(new ErrorHandler("Order not found for this id",400));
    }
    if(order.orderStatus === "Delivered"){
        return next(new ErrorHandler("Order already delivered",400));
    }

    order.orderItems.forEach(async(o) => {
        await updateStock(o.product,o.quantity);
    })
    order.orderStatus = req.body.status;
    if(req.body.status === "Delivered"){
        order.deliveredAt = Date.now();
    }

    await order.save({validateBeforeSave:false});
    res.status(200).json({
        success:true
    })
});

exports.deleteOrder = catchAsyncErrors(async(req,res,next) => {
    const order = await Order.findById(req.params.id);
    if(!order){
        return next(new ErrorHandler("Order not found for this id",400));
    }

    await order.remove();
    res.status(200).json({
        success:true,
        message:"Order deleted successfully"
    })
});

async function updateStock(id,quantity){
    const product = await Product.findById(id);

    product.stock -= quantity;

    await product.save({validateBeforeSave:false});
}

