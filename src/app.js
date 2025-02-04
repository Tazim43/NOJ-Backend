import express from "express";
import { BASEURL, LIMIT } from "./constants.js";
const app = express();

// app config
app.use(express.json({ limit: LIMIT }));
app.use(express.urlencoded({ limit: LIMIT }));
app.use(express.static("public"));

// import routes
import AuthRouter from "./routes/Auth.js";

// define routes
app.use(`${BASEURL}/auth`, AuthRouter);

app.get("/", (req, res) => {
  res.json({
    msg: "Wellcome to   NaiveOJ v1.0",
  });
});

export default app;
