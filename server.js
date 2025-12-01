import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import wishlistRoutes from "./src/routes/wishlist.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/wishlist", wishlistRoutes);

// Start server (skip in test mode)
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
