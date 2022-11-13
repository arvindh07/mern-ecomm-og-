const express = require("express");
const router = express.Router();
const {isAuthenticatedUser, authorizedRoles} = require("../middleware/auth");
const { registerUser, loginUser, logoutUser, forgotPassword, resetPassword, getUserDetails, updatePassword, updateProfile, getAllUsers, getSingleUser, updateRole, deleteUser, createReview, getProductReviews, deleteReview } = require("../controllers/userController");

// auth routes
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logoutUser);
router.route("/password/forgot").post(forgotPassword);
router.route("/password/reset/:token").put(resetPassword);

// user routes
router.route("/me").get(isAuthenticatedUser,getUserDetails); //view profile (from client side)
router.route("/password/update").put(isAuthenticatedUser,updatePassword); // change password (from client side)
router.route("/me/update").put(isAuthenticatedUser,updateProfile); // update profile (from client side)
router.route("/admin/users").get(isAuthenticatedUser,authorizedRoles("admin"),getAllUsers); // view all users (for admin)
router.route("/admin/user/:id").get(isAuthenticatedUser,authorizedRoles("admin"),getSingleUser)
    .put(isAuthenticatedUser,authorizedRoles("admin"),updateRole)
    .delete(isAuthenticatedUser,authorizedRoles("admin"),deleteUser);
router.route("/review").put(isAuthenticatedUser,createReview); // create review
router.route("/reviews").get(getProductReviews).delete(isAuthenticatedUser,deleteReview);

module.exports = router;