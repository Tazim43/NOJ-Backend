import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    msg: "Wellcome to  NaiveOJ v1.0",
  });
});

export default app;
