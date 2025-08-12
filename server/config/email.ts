import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail", // or use host + port if you're not using a built-in service
  auth: {
    user: "enlightechy@gmail.com",
    pass: "vzevrypctgjwdjaz",
  },
});

