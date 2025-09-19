const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://ak:143@cluster0.waxcn9c.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => {
        console.log("db connected");
    })
    .catch(() => {
        console.log("db not connected");
    });

const credential = mongoose.model("credential", {}, "bulkmail");

app.post("/sendmail", (req, res) => {
    const msg = req.body.msg;
    const emailList = req.body.emailList;

    credential.find()
        .then((data) => {
            console.log(data[0].toJSON());

            
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: data[0].toJSON().user,
                    pass: data[0].toJSON().pass,
                },
            });

            
            new Promise(async (resolve, reject) => {
                try {
                    for (let i = 0; i < emailList.length; i++) {
                        await transporter.sendMail({
                            from: data[0].toJSON().user,
                            to: emailList[i],
                            subject: "Testing Nodemailer",
                            text: msg,
                        });
                        console.log("Mail sent successfully to " + emailList[i]);
                    }
                    resolve("success");
                } catch (err) {
                    console.error("Error:", err);
                    reject("failed");
                }
            })
                .then(() => {
                    res.send(true);
                })
                .catch(() => {
                    res.send(false);
                });
        })
        .catch((err) => {
            console.log(err);
            res.send(false);
        });
});

app.listen(5000, () => {
    console.log("server is started.....");
});
