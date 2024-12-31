const express = require("express");
const router = express.Router();
const moment = require("moment");

//definition des variable pour les schemas
const Tournament = require("../models/tournaments");
const Player = require("../models/players");

// route GET pour cherche un tournoi suivant différents critères

router.get("/:token&:startDate&:level&:gender", (req, res) => {
    // enregistrer les params de l'URL en tant que variables à traiter pour les utiliser dans le search query
    const userToken = req.params.token;

    let searchedStartDate = null;
    if (req.params.startDate !== "null") {
        searchedStartDate = moment(req.params.startDate).format("YYYY-MM-DD")
    };

    let searchedLevel = null;
    if (req.params.level !=="null") {
        searchedLevel = req.params.level;
    };

    let searchedGender = null;
    if (req.params.gender !== "null") {
        searchedGender = req.params.gender;
    };

    // étape 1 : vérifier la légitimité de la requête via le token
    Player.findOne({ token: userToken })
    .then((player) => {
        if (player) {
        
        // construire la requête en fonction des informations reçues en params
        let query = {};
        // aucun params n'est renseigné
        if (!searchedStartDate && !searchedLevel && !searchedGender) {
            query = { start_date: { $gte: new Date() } }
        } // seule la date de début est renseignée
        else if (searchedStartDate && !searchedLevel && !searchedGender) {
            query = { start_date: { $gte: new Date(searchedStartDate) } }
        } // seule la catégorie est renseignée
        else if (!searchedStartDate && searchedLevel && !searchedGender) {
            query = { start_date: { $gte: new Date() }, category: searchedLevel }           
        } // seul le genre est renseigné
        else if (!searchedStartDate && !searchedLevel && searchedGender) {
            query = { start_date: { $gte: new Date() }, gender: searchedGender } 
        } // la date et la catégorie sont renseignés
        else if (searchedStartDate && searchedLevel && !searchedGender) {
            query = { start_date: { $gte: new Date(searchedStartDate) }, category: searchedLevel }
        } // la date et le genre sont renseignés
        else if (searchedStartDate && !searchedLevel && searchedGender) {
            query = { start_date: { $gte: new Date(searchedStartDate) }, gender: searchedGender }             
        } // la catégorie et le genre sont renseignés
        else if (!searchedStartDate && searchedLevel && searchedGender) {
            query = { category: searchedLevel, gender: searchedGender }            
        } // tous les critères de recherche sont renseignés
        else if (searchedStartDate && searchedLevel && searchedGender) {
            query = { start_date: { $gte: new Date(searchedStartDate) }, category: searchedLevel, gender: searchedGender }             
        };

        // lancer la recherche
        Tournament.find(query)
        .sort({ start_date: 1})
        .populate("club", "name email phone address")
        .then(data => {
            if (data.length) {
                // Filter les données que l'on souhate renvoyer
                const searchResults = data.map(e => e = {
                    tournamentId: e._id,
                    start_date: e.start_date,
                    players_number: e.players_number,
                    participants: e.participants,
                    category: e.category,
                    tournamentType: e.tournamentType,
                    gender: e.gender,
                    clubName: e.club?.name,
                    email: e.club?.email,
                    phone: e.club?.phone,
                    address: e.club?.address,
                    conditionGenerale: e.registration_conditions,
                    registration_fee: e.registration_fee
                })
                res.json({
                    result: true,
                    tournaments: searchResults
                })
            } else {
                res.json({ 
                    result: false,
                    message: "Aucun tournoi n'a été trouvé"
                })
            };
        })
        .catch(err => console.error(err));
        
        } else {
            // envoyer un message d'erreur si le token n'est pas valide
            res.json({
                result: false,
                message: "Token d'indentification invalide : accès non autorisé"
            })
        }
    })
});

module.exports = router;


