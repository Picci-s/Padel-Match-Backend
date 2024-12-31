const mongoose = require("mongoose");

const resultsSchema = mongoose.Schema({
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "tournaments" },
    results: [String],
});

const Result = mongoose.model("results", resultsSchema);

module.exports = Result;