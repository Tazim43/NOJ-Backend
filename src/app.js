import express from "express";
import { LIMIT } from "./constants.js";
const app = express();

// app config
app.use(express.json({ limit: LIMIT }));
app.use(express.urlencoded({ limit: LIMIT }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({
    msg: "Wellcome to  NaiveOJ v1.0",
  });
});

export default app;
