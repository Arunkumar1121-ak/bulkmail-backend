const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");

require('dotenv').config(); // If using .env locally

const app = express();

// ---------- CORS Setup ----------
const corsOptions = {
  origin: process.env.FRONTEND_URL, // e.g., https://bulkmail-frontend-pi.vercel.app
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
};
app.use(cors(corsOptions));
app.options("/sendmail", cors(corsOptions)); // preflight for /sendmail

// ---------- Middleware ----------
app.use(express.json());

// ---------- MongoDB Connection ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.error("DB connection failed:", err));

// ---------- Mongoose Model ----------
const credential = mongoose.model("credential", {}, "bulkmail");

// ---------- Send Mail Route ----------
app.post("/sendmail", async (req, res) => {
  const { msg, emailList } = req.body;

  try {
    const data = await credential.find();
    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: "No credentials found" });
    }

    const { user, pass } = data[0].toJSON();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });

    for (let email of emailList) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "Testing Nodemailer",
        text: msg
      });
      console.log("Mail sent successfully to", email);
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Error sending emails:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
