import express from "express";

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

/* HOME */
app.get("/", (req, res) => {
  res.json({
    page: "Home",
    message: "Welcome to Node.js deployed on Vercel 🚀"
  });
});

/* ABOUT */
app.get("/about", (req, res) => {
  res.json({
    page: "About",
    message: "This is a sample Node.js project with basic routes"
  });
});

/* CONTACT (GET) */
app.get("/contact", (req, res) => {
  res.json({
    page: "Contact",
    info: "Send POST request with name, email and message"
  });
});

/* CONTACT (POST) */
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({
      error: "name, email and message are required"
    });
  }

  res.status(201).json({
    success: true,
    data: {
      name,
      email,
      message
    }
  });
});

app.listen(port,()=>{
   console.log( `Server Started on Port ${port}`);
   console.log( `http://localhost:${port}`);
})
