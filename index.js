const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

require("dotenv").config(); // make sure you have a .env with MONGO_URI

const app = express();
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: "https://bulkmail-frontend-pi.vercel.app", // frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // handle preflight requests

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB connection error:", err));

// MongoDB model for email credentials
const Credential = mongoose.model("credential", {}, "bulkmail");

// Send emails
app.post("/sendmail", async (req, res) => {
  try {
    const { msg, emailList } = req.body;

    if (!msg || !emailList || emailList.length === 0) {
      return res.status(400).json({ success: false, message: "Message or email list missing" });
    }

    const data = await Credential.find();
    if (!data || data.length === 0) {
      return res.status(400).json({ success: false, message: "No credentials found" });
    }

    const { user, pass } = data[0].toJSON();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    // Send emails sequentially
    for (let email of emailList) {
      await transporter.sendMail({
        from: user,
        to: email,
        subject: "Bulk Mail",
        text: msg,
      });
      console.log("Mail sent to:", email);
    }

    res.json({ success: true, message: "Emails sent successfully" });

  } catch (err) {
    console.error("Error sending emails:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
