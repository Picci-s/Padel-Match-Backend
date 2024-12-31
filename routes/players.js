var express = require("express");
var router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
// import des schémas
const Player = require("../models/players");
const Tournament = require("../models/tournaments");

/*---------------------------------------------------------------------------------------------*/

// Route POST pour s'inscrire en tant que joueur
router.post("/signup", (req, res) => {
  // Check si l'utilisateur est déjà enregistré/existant
  Player.findOne({ email: req.body.email })
  .then((data) => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const body = req.body;

      const newPlayer = new Player({
        suscriber: true,
        email: body.email,
        password: hash,
        token: uid2(32),
        avatar: body.avatar,
        firstName: body.firstName,
        lastName: body.lastName,
        gender: body.gender,
        licence: body.licence,
        rank: body.rank,
        address: {
          street: body.street,
          zipCode: body.zipCode,
          city: body.city,
        },
        phone: body.phone,
        payment: body.payment,
        tournaments: [],
      });
      // enregistre/créer le joueur
      newPlayer.save()
      .then((data) => {
        res.json({
          result: true,
          token: data.token,
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            licence: data.licence,
            phone: data.phone,
            gender : data.gender,
            avatar: data.avatar,
            email: data.email,
            address: data.address,
          },
        });
      });
    } else {
      // le joueur existe déjà
      res.json({ 
        result: false, 
        error: "Le joueur existe déjà" 
      });
    };
  });
});

/*---------------------------------------------------------------------------------------------*/

// Route POST pour se connecter en tant que joueur
router.post("/signin", (req, res) => {
  // recherche du joueur
  Player.findOne({ email: req.body.email })
  .then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({
        result: true,
        token: data.token,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          licence: data.licence,
          phone: data.phone,
          gender : data.gender,
          avatar: data.avatar,
          email: data.email,
          address: data.address,
        },
      });
    } else {
      res.json({
        result: false,
        error: "Adresse email du joueur introuvable ou mot de passe erroné",
      });
    };
  });
});

/*---------------------------------------------------------------------------------------------*/

// Route PUT pour s'inscrire à un tournoi en tant que joueur
router.put("/register/:token", (req, res) => {
  // destructuration des données reçues du frontend
  const {
    tournamentId,
    partnerFirstName,
    partnerLastName,
    partnerGender,
    partnerLicence,
    partnerEmail,
  } = req.body;
  // vérifier que tous les champs ont été complétés
  if (
    !partnerFirstName || 
    !partnerLastName || 
    !partnerGender ||
    !partnerLicence || 
    !partnerEmail
    ) {
      return res.json({
        result: false,
        error: "Veuillez compléter tous les champs"
      });
  };
  // créer la variable pour stocker l'ID du partenaire
  let partnerId = "6762db096a5bb80897b1db6c";

  // vérifier si le token est valide
  Player.findOne({ token: req.params.token })
  .then(player => {
    // si le token est valide le joueur a été trouvé en BDD
    if (player) {
      // vérifier que le joueur n'est pas déjà inscrit
      let alreadyRegistered = false;
      for (let i = 0 ; i < player.tournaments.length ; i++) {
        if (player.tournaments[i].tournament.toString() === tournamentId) {
          alreadyRegistered = true;
        };
      }
      if (alreadyRegistered) {
         return res.json({
          result: false,
          error: "Vous êtes déjà inscrit à ce tournoi"
        });
      };

    // gérer l'inscription du partenaire
      // vérifier si le partenaire possède un compte player
      Player.findOne({ email: partnerEmail })
      .then(partner => {
        // si un compte est trouvé, récupérer l'ID
        if (partner) {
          console.log("Partenaire trouvé dans la collection joueurs :", partner)
          return partnerId = partner._id;
        // si non, créer un nouveau document
        } else {
          const newPlayer = new Player({
            suscriber: false,
            email: partnerEmail,
            firstName: partnerFirstName,
            lastName: partnerLastName,
            gender: partnerGender,
            licence: partnerLicence,
          });
          newPlayer.save()
          .then(newPartner => {
            console.log("Nouveau document enregistré :", newPartner);
            return partnerId = newPartner._id;
          });
        };
      })
      .catch(error => console.error(error));

      // ajouter le joueur dans la liste des participants du document tournoi
      Tournament.findByIdAndUpdate(
        req.body.tournamentId,
        { $push: { participants: { player1: player._id, player2: partnerId } }}, // objet contenant les clés des 2 joueurs (voir playersPairSchema dans le fichier ../models/tournaments.js
        { new: true } // permet de retourner la version modifiée du document
      )
      .then(tournament => {
        // ajouter le tournoi dans la liste du document joueur
        Player.findByIdAndUpdate(
          player._id,
          { $push: { tournaments: { tournament: tournament._id, partner: partnerId } }}, // objet contenant les clés du tournoi et du joueur partenaire (voir playerRegistrationSchema dans le fichier ../models/players.js
          { new: true } // permet de retourner la version modifiée du document
        )
        .then(updatedPlayer => {
          console.log("Document joueur mis à jour : ", updatedPlayer);
          // réponse en cas de succès
          res.json({
            result: true,
            message: "Inscription réussie"
          });
        });
      });
    } else {
      res.json({
        result: false,
        error: "Le token d'identification de l'utilisateur n'est pas valide"
      });
    };
  });
});

/*---------------------------------------------------------------------------------------------*/

// Route GET pour récupérer la liste des tournois d'un joueur
router.get("/tournaments/:token", (req, res) => {
  // vérifier si le token est valide
  Player.findOne({ token: req.params.token })
  .then(player => {
    // si le token est valide le joueur a été trouvé en BDD
    if (player) {
      // vérifier si des tournois sont bien enregistrés
      if (player.tournaments) {
        const tournamentsId = player.tournaments.map(e => e = e.tournament);
        //console.log(tournamentsId);
        // rechercher les tournois dans la collection tournaments
        Tournament.find({ _id: { $in: tournamentsId } })
        .populate("club")
        .sort({ start_date: 1 })
        .then(tournaments => {
          // vérifier que la seconde requête en BDD a fonctionné
          if(tournaments.length) {
            res.json({
              result: true,
              data: tournaments
            });
          // réponse si la seconde requête en BDD a échoué
          } else {
            res.json({
              result: false,
              error: "La liste des tournois n'a pas pu être récupérée"
            });
          };
        })
        .catch(error => console.error(error));
      // réponse si aucun tournoi n'est trouvé
      } else {
        res.json({
          result: false,
          error: "Aucun tournoi n'est associé à l'utilisateur"
        })
      }
    // réponse si l'identification par token a échoué
    } else {
      res.json({
        result: false,
        error: "Le token d'identification de l'utilisateur n'est pas valide"
      });
    };
  })
  .catch(error => console.error(error)) 
});


/*---------------------------------------------------------------------------------------------*/

// Route GET pour récupérer la liste des 3 prochain tournois d'un joueur

router.get("/tournaments/next/:token", (req, res) => {
  // récupérer l'ID du player à partir du token récupéré du front
  Player.findOne({ token: req.params.token })
  .then(player => {
    // si le token est valide le joueur a été trouvé en BDD
    if (player) {
      // vérifier si des tournois sont bien enregistrés
      if (player.tournaments) {
        const tournamentsId = player.tournaments.map(e => e = e.tournament);
        //console.log(tournamentsId);
        // rechercher les tournois dans la collection tournaments
        Tournament.find({ _id: { $in: tournamentsId }, start_date: { $gte: new Date() }})
        .populate("club")
        .sort({ start_date: 1 })
        .limit(3)
        .then(tournaments => {
          // sélectionne les 3 tournois 
          if (tournaments.length) {
            const nextTournaments = tournaments.map(tournament => ({
              start_date: tournament.start_date,
              players_number: tournament.players_number,
              participants: tournament.participants,
              category: tournament.category,
              tournamentType: tournament.tournamentType,
              gender: tournament.gender,
              clubName: tournament.club?.name,
            }));
            res.json({
              result: true,
              data: nextTournaments,
            });
          } else {
            res.json({
              result: false,
              error: "Aucun tournoi n'a été trouvé."
            });
          };
        })
        .catch(error => console.error(error));
      // réponse si aucun tournoi n'est trouvé  
      } else {
        res.json({
          result: false,
          error: "Aucun tournoi pour ce joueur."
        });
      }
      // afficher un message d'erreur si l'authentification du player a échoué
    } else {
      res.json({
        result: false,
        error: "Le token d'identification de l'utilisateur n'est pas valide"
      });
    }
  })
  .catch(error => console.error(error));
});

/*---------------------------------------------------------------------------------------------*/

// Route DELETE pour supprimer le compte d'un joueur
router.delete("/:email", (req, res) => {
  Player.deleteOne({ email: { $regex: new RegExp(req.params.email, "i")} })
  .then((deletedDoc) => {
    if (deletedDoc.deletedCount > 0) {
      // Document supprimé
      Player.find().then((data) => {
        res.json({ result: true });
      });
    } else {
      res.json({ result: false, error: "Adresse email introuvable" });
    }
  });
});

module.exports = router;