const mongoose = require("mongoose");

const playersPairSchema = mongoose.Schema({
    player1: { type: mongoose.Schema.Types.ObjectId, ref: "players" },
    player2: { type: mongoose.Schema.Types.ObjectId, ref: "players" }
});

const tournamentSchema = mongoose.Schema({
    club: { type: mongoose.Schema.Types.ObjectId, ref: "clubs" },
    created_at: Date,
    start_date: Date,
    end_date: Date,
    category: String,
    tournamentType: String,
    gender: String,
    players_number: Number,
    registration_start_date: Date,
    registration_end_date: Date,
    registration_fee: Number,
    registration_conditions: String,
    participants: [playersPairSchema],
    results: { type: mongoose.Schema.Types.ObjectId, ref: "results" },
});

const Tournament = mongoose.model("tournament", tournamentSchema);

module.exports = Tournament;