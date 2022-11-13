const mongoose = require("mongoose");

const connectDatabase = () => {

    mongoose.connect(process.env.DB_URI,{
            useUnifiedTopology:true,
            useNewUrlParser:true
        }).then((data) => {
            console.log(`Connected to mongodb with server: ${data.connection.host}`);
        })
}

module.exports = connectDatabase;