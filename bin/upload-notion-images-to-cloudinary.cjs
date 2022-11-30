#!/usr/bin/env node
require("dotenv").config();
const uploadNotionImagesToCloudinary = require("../dist/uploadNotionImagesToCloudinary.js");
uploadNotionImagesToCloudinary.default({ logLevel: "debug" });
