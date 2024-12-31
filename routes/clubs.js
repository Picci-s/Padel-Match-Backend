var express = require('express');
var router = express.Router();
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const moment = require('moment');
// import des schémas
const Club = require('../models/clubs');
const Tournament = require('../models/tournaments');

/*---------------------------------------------------------------------------------------------*/

// Route POST pour s'inscrire en tant qu'administrateur de club
router.post('/signup', (req, res) => {
    // Vérifier si le club n'a pas déjà été créé 
    Club.findOne({ email: req.body.email })
    .then(data => {
        console.log(data);
        if (data === null) {
            const hash = bcrypt.hashSync(req.body.password, 10);
            const body = req.body;

            const newClub = new Club({
                email: body.email,
                password: hash,
                token: uid2(32),
                avatar: body.avatar,
                name: body.name,
                address: {
                    street: body.street,
                    zipCode: body.zipCode,
                    city: body.city,
                },
                phone: body.phone,
                bank_id: body.bank_id,
                invoice: [],
                tournament: [],
            });
            // Créer club si non trouvé sinon message erreur
            newClub.save()
            .then(data => {
                res.json({
                    result: true,
                    token: data.token,
                    data: {
                        _id: data._id,
                        name: data.name,
                        email: data.email,
                        avatar: data.avatar,
                        phone: data.phone,
                        address: data.address,
                    },
                });
            });
        } else {
            res.json({ 
                result: false, 
                error: 'Le club existe déjà' 
            });
        };
    });
});

/*---------------------------------------------------------------------------------------------*/

// Route POST pour se connecter en tant qu'administrateur de club
router.post('/signin', (req, res) => {
    // Vérifier si l'utilisateur existe et si les identifiants sont valides
    Club.findOne({ email: req.body.email })
    .then(data => {
        if(data && bcrypt.compareSync(req.body.password, data.password)) {
            res.json({
                result: true,
                token: data.token,
                data: {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    avatar: data.avatar,
                    phone: data.phone,
                    address: data.address,
                },
            });
        } else {
            res.json({ 
                result: false, 
                error: 'Adresse mail non trouvé ou mauvais mot de passe' 
            });
        };
    });
});

/*---------------------------------------------------------------------------------------------*/

// Route pour afficher la liste des tournois d'un club
router.get("/tournaments/:token", (req, res) => {
    // Étape 1 : récupérer l'ID du club à partir du token récupéré du front
    Club.findOne({ token: req.params.token })
    .then(club => {
    // étape 2 : rechercher les prochains tournois dans la collection tournaments
        if (club) {
            Tournament.find({ club: club._id }).sort({ start_date: 1 })
            .then(tournaments => {
                if (tournaments.length) {
                    res.json({
                        result: true,
                        data: tournaments,
                    })
                } else {
                    res.json({
                        result: false,
                        message: "Aucun tournoi n'a été trouvé"
                    })
                }
            })
            .catch(error => {
                res.json({
                    message: "Erreur côté serveur",
                    error: error
                })
                console.error(error);
            });
        // afficher un message d'erreur si l'authentification du club a échoué  
        } else {
            res.json({
                result: false,
                error: "Le token d'identification de l'utilisateur n'est pas valide"
            })
        };
    });
});
  
  /*---------------------------------------------------------------------------------------------*/
  
  // Route pour afficher la liste des 3 prochains tournois d'un club
  router.get("/tournaments/next/:token", (req, res) => {
    // étape 1 : récupérer l'ID du club à partir du token récupéré du front
    Club.findOne({ token: req.params.token })
    .then(club => {
    // étape 2 : rechercher  les 3 prochains tournois dans la collection tournaments
        if (club) {
        // Requête avec `find`, `sort`, et `limit`(https://www.mongodb.com/docs/drivers/node/current/fundamentals/crud/read-operations/limit/)
        Tournament.find({ start_date: { $gte: new Date() }, club: club._id })
        .sort({ start_date: 1 })
        .limit(3)
        .then(tournaments => {
            if (tournaments.length) {
                // Sélectionner uniquement les données qu'on veut récupérer en front
                const nextTournaments = tournaments.map((tournament) => ({
                    start_date: tournament.start_date,
                    players_number: tournament.players_number,
                    participants: tournament.participants,
                    category: tournament.category,
                    tournamentType: tournament.tournamentType,
                    gender: tournament.gender,
                }));
                res.json({
                    result: true,
                    data: nextTournaments,
                });
            } else {
                res.json({ 
                    result: false,
                    message: "Aucun tournoi à venir trouvé." 
                });
            };
        })
        .catch((error) => {
            res.json({
                message: "Erreur côté serveur",
                error: error
            })
            console.error(error);
        });
        // afficher un message d'erreur si l'authentification du club a échoué  
        } else {
            res.json({
                result: false,
                error: "Le token d'identification de l'utilisateur n'est pas valide"
            });
        };
    });
});

/*---------------------------------------------------------------------------------------------*/

// Route DELETE pour supprimer le compte d'un club
router.delete("/:email", (req, res) => {
    Club.deleteOne({ email: { $regex: new RegExp(req.params.email, "i")} })
    .then((deletedDoc) => {
      if (deletedDoc.deletedCount > 0) {
        // Document supprimé
        Club.find().then((data) => {
          res.json({ result: true });
        });
      } else {
        res.json({ result: false, error: "Adresse email introuvable" });
      }
    });
  });

module.exports = router;