const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const corsOptions = {
  origin: "https://bulkmail-frontend-pi.vercel.app",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));  // ✅ handles OPTIONS automatically
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("db connected"))
  .catch((err) => console.error("DB connection failed:", err));

const credential = mongoose.model("credential", {}, "bulkmail");

app.post("/sendmail", async (req, res) => {
  const { msg, emailList } = req.body;

  try {
    const data = await credential.find();
    const { user, pass } = data[0].toJSON();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    for (const email of emailList) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "Testing Nodemailer",
        text: msg,
      });
      console.log("Mail sent to", email);
    }

    res.send(true);
  } catch (err) {
    console.error(err);
    res.send(false);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
