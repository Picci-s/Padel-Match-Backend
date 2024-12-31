const mongoose = require("mongoose");

const invoiceSchema = mongoose.Schema({
    amount: Number,
    biller: { type: mongoose.Schema.Types.ObjectId, ref: "clubs" },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: "players" },
});

const Invoice = mongoose.model("invoices", invoiceSchema);

module.exports = Invoice;