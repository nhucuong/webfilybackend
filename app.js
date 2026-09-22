
const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authController = require('./controllers/authcontrollers');
const path=require('path')
const { passport, initializePassport } = require("./config/passport");

dotenv.config();

// Allowed Frontend Domains
const allowedOrigins = [
  process.env.FRONTEND_BASE_URL,       // FRONTEND URL
  process.env.BASE_URL,       // ADMIN BASE
];

async function startServer() {
  try {

    // Load Google/Github strategies from DB
    await initializePassport();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use('/webhook',require('./routes/webhookroute'));

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {

      // Allow requests without Origin (Postman, Mobile Apps, Server-to-Server)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Domain not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-access-token"
    ]
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb"}));
app.set('view engine', 'ejs');
// Set views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files (assets)
app.use(express.static(path.join(__dirname, 'assets')));
app.use(
  session({
    secret: "securitykey",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true }
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/zips',express.static(path.join(__dirname,'public/zips')))

// --- Simple Session Setup (no MongoStore) ---
require('./cron/croncheck')
app.use('/cron',require('./cron/cronroute'));
// Routes
const DashRoutes = require("./routes/dashboardroutes");
app.use("/api", require('./routes/authroutes'));
app.use("/", DashRoutes);
app.use("/api/webhooks", require("./routes/webhookroute"));

// Handle CORS Errors
app.use((err, req, res, next) => {
  if (err.message === "Domain not allowed by CORS") {
    return res.status(403).json({
      success: false,
      message: "Access Denied. Domain is not allowed."
    });
  }

  next(err);
});

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));

} catch (error) {
    console.error("Server Startup Error:", error);
}
}

startServer();