const express = require("express");
const app = express();

const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use("/api", userRoutes);

const PORT = process.env.PORT || 5000;

// Listen on all network interfaces for Docker
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});