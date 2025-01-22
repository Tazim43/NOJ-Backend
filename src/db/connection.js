import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionURL = `${process.env.MONGO_URI}/${DB_NAME}`;

    const con = await mongoose.connect(connectionURL);
    console.log(`DB is connected! HOST : ${con.connection.host}`);
  } catch (error) {
    console.log("Database connection failed!" + error);
    throw error;
  }
};

export { connectDB };
