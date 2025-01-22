import app from "./app.js";
import { connectDB } from "./db/connection.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    try {
      app.listen(PORT, () => {
        console.log(`server is listening at port : ${PORT}`);
      });
    } catch (error) {
      console.log(`Error starting the server : ${error.message}`);
    }
  })
  .catch((err) => {
    console.log("DB connection failed!" + err);
  });
