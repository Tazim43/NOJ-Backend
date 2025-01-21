import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

try {
  app.listen(PORT, () => {
    console.log(`server is listening at port : ${PORT}`);
  });
} catch (error) {
  console.log(`Error starting the server : ${error.message}`);
}
