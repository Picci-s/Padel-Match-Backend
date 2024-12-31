const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    street: String,
    zipCode: String,
    city: String,
});

const clubSchema = mongoose.Schema({
    email: String,
    password: String,
    token: String,
    avatar: String,
    name: String,
    address: addressSchema,
    phone: String,
    bank_id: String,
    invoices:  [{ type: mongoose.Schema.Types.ObjectId, ref: "invoices" }],
    tournaments: [{ type: mongoose.Schema.Types.ObjectId, ref: "tournaments"}],
});

const Club = mongoose.model("clubs", clubSchema);

module.exports = Club;