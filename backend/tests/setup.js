const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, "..", ".env.test");
const examplePath = path.join(__dirname, "..", ".env.test.example");

dotenv.config({ path: envPath });
dotenv.config({ path: examplePath });

process.env.NODE_ENV = "test";

// aes-256-gcm needs a 32-byte key; example placeholders are not valid base64 keys
if (Buffer.from(process.env.SECRET_KEY || "", "base64").length !== 32) {
  process.env.SECRET_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
}
