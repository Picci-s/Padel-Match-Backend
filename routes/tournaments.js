const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment"); // Utilisation de Moment.js uniquement

// import des variable pour les schemas
const Club = require("../models/clubs");
const Tournament = require("../models/tournaments");
const Player = require("../models/players");

const condition = `
En cas d'annulation, les participants seront notifiés par e-mail ou SMS. Le remboursement sera effectué sous 7 jours ouvrés.
Pour toute annulation à moins de 7 jours de l'événement, veuillez contacter directement le club `


/*---------------------------------------------------------------------------------------------*/

// Route POST pour créer un tournoi
router.post("/create", async (req, res) => {
  try {
    const {
      clubId,
      start_date,
      end_date,
      // registration_start_date,
      // registration_end_date,
      category,
      tournamentType,
      gender,
      players_number,
      registration_fee,
      //registration_conditions,
    } = req.body;

    // Vérification des champs requis
    if (
      !clubId ||
      !start_date ||
      !end_date ||
      !category ||
      !tournamentType ||
      !gender ||
      !players_number ||
      //!registration_start_date ||
      //!registration_end_date ||
      !registration_fee
      //!registration_conditions
      ) {
        return res.json({
          result: false,
          error: "Veuillez remplir tous les champs obligatoires.",
        });
    }

    // Conversion des dates avec Moment.js
    const startDate = moment(start_date).format("YYYY-MM-DD");
    const endDate = moment(end_date).format("YYYY-MM-DD");
    const createdAt = moment().format("YYYY-MM-DD");
    //console.log(startDate)
    //console.log(endDate)
    //console.log(createdAt)

    /* Donnée en attente pour l'instant fonctionnalité à développer par la suite
    const registrationStartDate = moment(registration_start_date, "DD/MM/YYYY")
      .startOf("day")
      .toDate();
    const registrationEndDate = moment(registration_end_date, "DD/MM/YYYY")
      .startOf("day")
      .toDate();
  
    // Vérification que la fin des inscriptions est au moins 7 jours avant le début du tournoi
    if (moment(startDate).diff(moment(registrationEndDate), "days") < 7) {
      return res.json({
        result: false,
        error:
          "La date de fin des inscriptions doit être au moins 7 jours avant la date de début du tournoi.",
      });
    }
    */

    // Vérification si un tournoi existe déjà avec le même club, la même date de début et de fin
    const existingTournament = await Tournament.findOne({
      club: clubId,
      start_date: startDate,
      end_date: endDate,
    });
    if (existingTournament) {
      return res.json({
        result: false,
        error: "Un tournoi avec les mêmes dates existe déjà pour ce club.",
      });
    }

    // Recherche du club par son ID
    const club = await Club.findById(clubId);
    if (!club) {
      return res.json({
        result: false,
        error: "Club non trouvé.",
      });
    }

    // Création d'un nouveau tournoi avec les informations reçues
    const newTournament = new Tournament({
      club: club._id,
      start_date: startDate,
      end_date: endDate,
      //registration_start_datee,
      //registration_end_date,
      created_at: createdAt,
      category,
      tournamentType,
      gender,
      players_number,
      registration_fee,
      registration_conditions: condition, // Utilise le texte de condition par défaut
      participants: [],
    });

    // Sauvegarde du nouveau tournoi dans la base de données
    const savedTournament = await newTournament.save();

    // Mettre à jour le club en ajoutant l'ID du tournoi
    await Club.findByIdAndUpdate(
      clubId,
      { $push: { tournaments: savedTournament._id } },
      { new: true }
    );

    res.json({
      result: true,
      message: "Tournoi créé et associé au club avec succès.",
      data: {
        tournament: savedTournament,
      },
    });
  } catch (error) {
    console.error("Erreur serveur :", error);

    //res.headersSent est une propriété de l'objet res (la réponse Express) qui renvoie :
    //true si les en-têtes de la réponse ont déjà été envoyés.
    //false si les en-têtes n'ont pas encore été envoyés.
    if (!res.headersSent) {
      res.status(500).json({
        result: false,
        error: "Erreur lors de la création du tournoi.",
      });
    }
  }
});

/*---------------------------------------------------------------------------------------------*/

// Route POST pour modifier dynamiquement les champs d'un tournoi
router.put("/update/:id", (req, res) => {
  const tournamentId = req.params.id;
  const updateData = req.body;

  // Conversion des dates avec Moment.js
  if (updateData.start_date) {
    updateData.start_date = moment(updateData.start_date).format("YYYY-MM-DD");
  }
  if (updateData.end_date) {
    updateData.end_date = moment(updateData.end_date).format("YYYY-MM-DD");
  }

  // Vérification si la date de fin est avant la date de début
  if (
    updateData.start_date &&
    updateData.end_date &&
    moment(updateData.end_date).isBefore(moment(updateData.start_date))
  ) {
    return res.json({
      result: false,
      error: "La date de fin ne peut pas être antérieure à la date de début.",
    });
  }

  //convertDate("registration_start_date");
  //convertDate("registration_end_date");

  // Mise à jour dynamique des champs avec $set ( voir doc https://openclassrooms.com/fr/courses/4462426-maitrisez-les-bases-de-donnees-nosql/4474606-interrogez-vos-donnees-avec-mongodb)
  Tournament.findByIdAndUpdate(
    tournamentId,
    { $set: updateData },
    { new: true } // Retourne le document mis à jour
  )
    .then((updatedTournament) => {
      if (!updatedTournament) {
        return res.json({
          result: false,
          error: "Tournoi non trouvé.",
        });
      }

      console.log("Tournoi mis à jour :", updatedTournament);

      res.json({
        result: true,
        message: "Tournoi mis à jour avec succès.",
        data: updatedTournament,
      });
    })
    .catch((error) => {
      console.error("Erreur serveur :", error);

      res.status(500).json({
        result: false,
        error: "Erreur lors de la mise à jour du tournoi.",
      });
    });
});

/*---------------------------------------------------------------------------------------------*/

// route DELETE pour supprimer un tournoi
router.delete("/delete/:id", async (req, res) => {
  const tournamentId = req.params.id;

  // Vérification que l'ID est valide
  if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
    return res.status(400).json({
      result: false,
      error: "ID du tournoi invalide.",
    });
  }

  try {
    // Trouver le tournoi
    const tournament = await Tournament.findById(tournamentId);

    if (!tournament) {
      return res.status(404).json({
        result: false,
        error: "Tournoi non trouvé.",
      });
    }

    // Vérification si des joueurs sont inscrits
    if (tournament.participants && tournament.participants.length > 0) {
      return res.json({
        result: false,
        error:
          "Suppression impossible : des joueurs sont inscrits à ce tournoi.",
      });
    }

    // Supprimer le tournoi si aucun joueur n'est inscrit
    const deletedTournament = await Tournament.findByIdAndDelete(tournamentId);

    // Retirer le tournoi du tableau `tournaments` du club associé
    await Club.findByIdAndUpdate(
      deletedTournament.club,
      { $pull: { tournaments: tournamentId } },
      { new: true }
    );

    res.json({
      result: true,
      message: "Le tournoi a été supprimé avec succès et retiré du club.",
    });
  } catch (error) {
    console.error("Erreur serveur :", error);
    res.status(500).json({
      result: false,
      error: "Erreur du serveur lors de la suppression du tournoi.",
    });
  }
});

/*---------------------------------------------------------------------------------------------*/

module.exports = router;