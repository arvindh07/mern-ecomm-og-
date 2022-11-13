const express = require("express");
const router = express.Router();
const {createProduct, getAllProducts, updateProduct, deleteProduct, getProduct} = require("../controllers/productController");
const { isAuthenticatedUser,authorizedRoles } = require("../middleware/auth");

router.route("/products").get(isAuthenticatedUser,getAllProducts);
router.route("/admin/product/new").post(isAuthenticatedUser,authorizedRoles("admin"),createProduct);
router.route("/admin/product/:id").put(isAuthenticatedUser,authorizedRoles("admin"),updateProduct)
    .delete(isAuthenticatedUser,authorizedRoles("admin"),deleteProduct)
router.route("/product/:id").get(getProduct);

module.exports = router; 