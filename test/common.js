var chai = require("chai");
const request = require('supertest');
exports.chai = chai;
exports.assert = chai.assert;
exports.request = request;
require('dotenv').config()
exports.app = require('./../app');