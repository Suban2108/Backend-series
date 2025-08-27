import mongoose from "mongoose";
import { DB_Name } from "../constants.js";

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`);
        console.log(`MongoDb connected & HOST is : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB Connection Error : ", error);
        console.log(process.env.MONGODB_URI);
        process.exit(1);    
    }
}

export default connectDB;