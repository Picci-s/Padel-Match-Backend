const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    street: String,
    zipCode: String,
    city: String,
});

const playerRegistrationSchema = mongoose.Schema({
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "tournaments"},
    partner: { type: mongoose.Schema.Types.ObjectId, ref: "players"}
})

const playerSchema = mongoose.Schema({
    suscriber: Boolean,
    email: String,
    password: String,
    token: String,
    avatar: String,
    firstName: String,
    lastName: String,
    gender: String,
    licence: String,
    rank: Number,
    address: addressSchema,
    phone: String,
    payment: String,
    tournaments: [playerRegistrationSchema],
});

const Player = mongoose.model("players", playerSchema);

module.exports = Player;