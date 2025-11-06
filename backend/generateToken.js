const jwt = require("jsonwebtoken");
const token = jwt.sign(
  { id: "dev123", email: "dev@local" },
  process.env.JWT_SECRET || "testsecret",
  { expiresIn: "1h" }
);
console.log(token);
