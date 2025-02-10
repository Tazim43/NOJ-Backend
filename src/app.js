import express from "express";
import { BASEURL, LIMIT } from "./constants.js";
const app = express();

// app config
app.use(express.json({ limit: LIMIT }));
app.use(express.urlencoded({ limit: LIMIT }));
app.use(express.static("public"));
app.use(cookieParser());

// import routes
import UserRouter from "./routes/User.router.js";
import ProblemRouter from "./routes/Problem.router.js";
import cookieParser from "cookie-parser";

// define routes
app.use(`${BASEURL}/auth`, UserRouter);
app.use(`${BASEURL}/problems`, ProblemRouter);

app.get("/", (req, res) => {
  res.json({
    msg: "Wellcome to   NaiveOJ v1.0",
  });
});

export default app;
