"use strict";

const CLE_STOCKAGE = "blip-dates-selectionnees";

const titreMois = document.getElementById("titre-mois");
const grilleCalendrier = document.getElementById("grille-calendrier");
const zoneCalendrier = document.getElementById("zone-calendrier");
const resumeSelection = document.getElementById("resume-selection");

const boutonMoisPrecedent = document.getElementById("mois-precedent");
const boutonMoisSuivant = document.getElementById("mois-suivant");
const boutonAujourdhui = document.getElementById("bouton-aujourdhui");
const boutonReglages = document.getElementById("bouton-reglages");
const fondModal = document.getElementById("fond-modal");
const panneauReglages = document.getElementById("panneau-reglages");
const boutonFermerReglages = document.getElementById("fermer-reglages");

const boutonExporter = document.getElementById("exporter-donnees");
const boutonImporter = document.getElementById("importer-donnees");
const boutonEffacer = document.getElementById("effacer-donnees");

const fichierImport = document.getElementById("fichier-import");
const messageReglages = document.getElementById("message-reglages");

const aujourdHui = new Date();

let moisAffiche = new Date(
  aujourdHui.getFullYear(),
  aujourdHui.getMonth(),
  1
);

let datesSelectionnees = chargerDatesSelectionnees();

let gesteEnCours = false;
let positionDepartX = 0;
let positionDepartY = 0;
let deplacementX = 0;
let deplacementY = 0;
let glissementDetecte = false;

function chargerDatesSelectionnees() {
  const valeurEnregistree = localStorage.getItem(CLE_STOCKAGE);

  if (!valeurEnregistree) {
    return new Set();
  }

  try {
    const dates = JSON.parse(valeurEnregistree);

    if (!Array.isArray(dates)) {
      return new Set();
    }

    return new Set(dates);
  } catch (erreur) {
    console.error(
      "Impossible de lire les dates enregistrées :",
      erreur
    );

    return new Set();
  }
}

function enregistrerDatesSelectionnees() {
  const datesTriees = Array
    .from(datesSelectionnees)
    .sort();

  localStorage.setItem(
    CLE_STOCKAGE,
    JSON.stringify(datesTriees)
  );
}

function formaterDatePourStockage(date) {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function obtenirDateDepuisCle(cleDate) {
  const [annee, mois, jour] = cleDate
    .split("-")
    .map(Number);

  return new Date(annee, mois - 1, jour);
}

function memeJour(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function obtenirPremiereDateDeLaGrille(annee, mois) {
  const premierJourDuMois = new Date(annee, mois, 1);

  /*
    JavaScript utilise :
    dimanche = 0
    lundi = 1
    ...
    samedi = 6

    Cette conversion permet d'obtenir :
    lundi = 0
    ...
    dimanche = 6
  */
  const decalageDepuisLundi =
    (premierJourDuMois.getDay() + 6) % 7;

  return new Date(
    annee,
    mois,
    1 - decalageDepuisLundi
  );
}

function creerBoutonJour(date, moisPrincipal) {
  const cleDate = formaterDatePourStockage(date);
  const bouton = document.createElement("button");
  const numeroJour = document.createElement("span");

  bouton.type = "button";
  bouton.className = "jour";
  bouton.dataset.date = cleDate;

  numeroJour.textContent = String(date.getDate());
  bouton.appendChild(numeroJour);

  if (date.getMonth() !== moisPrincipal) {
    bouton.classList.add("hors-mois");
  }

  if (datesSelectionnees.has(cleDate)) {
    bouton.classList.add("selectionne");
    bouton.setAttribute("aria-pressed", "true");
  } else {
    bouton.setAttribute("aria-pressed", "false");
  }

  if (memeJour(date, aujourdHui)) {
    bouton.classList.add("aujourdhui");
  }

  const dateLisible = new Intl.DateTimeFormat(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(date);

  bouton.setAttribute(
    "aria-label",
    `${dateLisible}, ${
      datesSelectionnees.has(cleDate)
        ? "sélectionné"
        : "non sélectionné"
    }`
  );

  bouton.addEventListener("click", () => {
    /*
      Lorsqu'un glissement vient d'avoir lieu,
      le clic généré à la fin du geste est ignoré.
    */
    if (glissementDetecte) {
      return;
    }

    basculerSelectionDate(cleDate);
  });

  return bouton;
}

function afficherCalendrier() {
  const annee = moisAffiche.getFullYear();
  const mois = moisAffiche.getMonth();

  titreMois.textContent = new Intl.DateTimeFormat(
    "fr-FR",
    {
      month: "long",
      year: "numeric"
    }
  ).format(moisAffiche);

  grilleCalendrier.replaceChildren();

  const premiereDate =
    obtenirPremiereDateDeLaGrille(annee, mois);

  /*
    Une grille fixe de 42 jours correspond à
    6 semaines de 7 jours.

    Sa hauteur reste ainsi stable lorsque
    l'utilisateur change de mois.
  */
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(
      premiereDate.getFullYear(),
      premiereDate.getMonth(),
      premiereDate.getDate() + index
    );

    const boutonJour =
      creerBoutonJour(date, mois);

    grilleCalendrier.appendChild(boutonJour);
  }

  mettreAJourResume();
}

function basculerSelectionDate(cleDate) {
  if (datesSelectionnees.has(cleDate)) {
    datesSelectionnees.delete(cleDate);
  } else {
    datesSelectionnees.add(cleDate);
  }

  enregistrerDatesSelectionnees();
  afficherCalendrier();
}

function changerMois(nombreDeMois) {
  moisAffiche = new Date(
    moisAffiche.getFullYear(),
    moisAffiche.getMonth() + nombreDeMois,
    1
  );

  afficherCalendrier();
}

function revenirAujourdhui() {
  moisAffiche = new Date(
    aujourdHui.getFullYear(),
    aujourdHui.getMonth(),
    1
  );

  afficherCalendrier();
}

function mettreAJourResume() {
  const annee = moisAffiche.getFullYear();
  const mois = moisAffiche.getMonth();

  const nombreDeDatesDuMois = Array
    .from(datesSelectionnees)
    .map(obtenirDateDepuisCle)
    .filter((date) => {
      return (
        date.getFullYear() === annee &&
        date.getMonth() === mois
      );
    })
    .length;

  if (nombreDeDatesDuMois === 0) {
    resumeSelection.textContent =
      "Aucun jour sélectionné ce mois-ci";
    return;
  }

  if (nombreDeDatesDuMois === 1) {
    resumeSelection.textContent =
      "1 jour sélectionné ce mois-ci";
    return;
  }

  resumeSelection.textContent =
    `${nombreDeDatesDuMois} jours sélectionnés ce mois-ci`;
}

function commencerGeste(event) {
  /*
    Seul le doigt principal ou le bouton principal
    de la souris doit démarrer le geste.
  */
  if (!event.isPrimary) {
    return;
  }

  gesteEnCours = true;
  glissementDetecte = false;

  positionDepartX = event.clientX;
  positionDepartY = event.clientY;

  deplacementX = 0;
  deplacementY = 0;

}

function suivreGeste(event) {
  if (!gesteEnCours || !event.isPrimary) {
    return;
  }

  deplacementX = event.clientX - positionDepartX;
  deplacementY = event.clientY - positionDepartY;

  /*
    Le geste n'est considéré comme un glissement
    que si le déplacement horizontal devient
    nettement supérieur au déplacement vertical.
  */
  if (
    Math.abs(deplacementX) > 12 &&
    Math.abs(deplacementX) > Math.abs(deplacementY)
  ) {
    glissementDetecte = true;
  }
}

function terminerGeste(event) {
  if (!gesteEnCours || !event.isPrimary) {
    return;
  }

  gesteEnCours = false;

  const distanceHorizontale =
    Math.abs(deplacementX);

  const mouvementPrincipalementHorizontal =
    distanceHorizontale >
    Math.abs(deplacementY) * 1.2;

  const seuilGlissement = 50;

  if (
    distanceHorizontale >= seuilGlissement &&
    mouvementPrincipalementHorizontal
  ) {
    if (deplacementX < 0) {
      changerMois(1);
    } else {
      changerMois(-1);
    }

    /*
      Le blocage reste actif juste assez longtemps
      pour ignorer le clic parfois généré après
      un geste tactile.
    */
    window.setTimeout(() => {
      glissementDetecte = false;
    }, 80);

    return;
  }

  glissementDetecte = false;
}

function annulerGeste() {
  gesteEnCours = false;
  glissementDetecte = false;
  deplacementX = 0;
  deplacementY = 0;
}

function ouvrirReglages() {
  messageReglages.textContent = "";
  messageReglages.classList.remove("erreur");

  fondModal.hidden = false;
  document.body.style.overflow = "hidden";

  boutonFermerReglages.focus();
}

function fermerReglages() {
  fondModal.hidden = true;
  document.body.style.overflow = "";

  boutonReglages.focus();
}

function afficherMessageReglages(message, estUneErreur = false) {
  messageReglages.textContent = message;
  messageReglages.classList.toggle(
    "erreur",
    estUneErreur
  );
}

function obtenirDatePourNomFichier() {
  const maintenant = new Date();

  const annee = maintenant.getFullYear();
  const mois = String(
    maintenant.getMonth() + 1
  ).padStart(2, "0");
  const jour = String(
    maintenant.getDate()
  ).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}

function exporterDonnees() {
  const sauvegarde = {
    application: "Blip",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    selectedDates: Array
      .from(datesSelectionnees)
      .sort()
  };

  const contenuJSON = JSON.stringify(
    sauvegarde,
    null,
    2
  );

  const fichier = new Blob(
    [contenuJSON],
    {
      type: "application/json"
    }
  );

  const adresseTemporaire =
    URL.createObjectURL(fichier);

  const lienTelechargement =
    document.createElement("a");

  lienTelechargement.href = adresseTemporaire;
  lienTelechargement.download =
    `blip-sauvegarde-${obtenirDatePourNomFichier()}.json`;

  document.body.appendChild(lienTelechargement);
  lienTelechargement.click();
  lienTelechargement.remove();

  URL.revokeObjectURL(adresseTemporaire);

  afficherMessageReglages(
    "La sauvegarde a été créée."
  );
}

function dateEstValide(cleDate) {
  if (typeof cleDate !== "string") {
    return false;
  }

  const formatEstValide =
    /^\d{4}-\d{2}-\d{2}$/.test(cleDate);

  if (!formatEstValide) {
    return false;
  }

  const [annee, mois, jour] = cleDate
    .split("-")
    .map(Number);

  const date = new Date(
    annee,
    mois - 1,
    jour
  );

  return (
    date.getFullYear() === annee &&
    date.getMonth() === mois - 1 &&
    date.getDate() === jour
  );
}

function sauvegardeEstValide(sauvegarde) {
  if (
    !sauvegarde ||
    typeof sauvegarde !== "object"
  ) {
    return false;
  }

  if (sauvegarde.application !== "Blip") {
    return false;
  }

  if (sauvegarde.formatVersion !== 1) {
    return false;
  }

  if (!Array.isArray(sauvegarde.selectedDates)) {
    return false;
  }

  return sauvegarde.selectedDates.every(
    dateEstValide
  );
}

function importerSauvegarde(fichier) {
  const lecteur = new FileReader();

  lecteur.addEventListener("load", () => {
    try {
      const sauvegarde = JSON.parse(
        lecteur.result
      );

      if (!sauvegardeEstValide(sauvegarde)) {
        throw new Error(
          "Le format de la sauvegarde n’est pas valide."
        );
      }

      const nombreDeDates =
        sauvegarde.selectedDates.length;

      const confirmation = window.confirm(
        `Cette sauvegarde contient ${nombreDeDates} ` +
        `${nombreDeDates > 1 ? "dates" : "date"}.\n\n` +
        "Les données actuellement présentes dans Blip " +
        "seront remplacées.\n\n" +
        "Continuer l’importation ?"
      );

      if (!confirmation) {
        afficherMessageReglages(
          "L’importation a été annulée."
        );

        return;
      }

      datesSelectionnees = new Set(
        sauvegarde.selectedDates
      );

      enregistrerDatesSelectionnees();
      afficherCalendrier();

      afficherMessageReglages(
        nombreDeDates === 0
          ? "La sauvegarde vide a été importée."
          : `${nombreDeDates} ${
              nombreDeDates > 1
                ? "dates ont été importées"
                : "date a été importée"
            }.`
      );
    } catch (erreur) {
      console.error(
        "Impossible d’importer la sauvegarde :",
        erreur
      );

      afficherMessageReglages(
        "Ce fichier n’est pas une sauvegarde Blip valide.",
        true
      );
    } finally {
      /*
        Cette remise à zéro permet de sélectionner
        à nouveau le même fichier si nécessaire.
      */
      fichierImport.value = "";
    }
  });

  lecteur.addEventListener("error", () => {
    afficherMessageReglages(
      "Le fichier n’a pas pu être lu.",
      true
    );

    fichierImport.value = "";
  });

  lecteur.readAsText(fichier);
}

function demanderImportation() {
  fichierImport.click();
}

function effacerToutesLesDonnees() {
  if (datesSelectionnees.size === 0) {
    afficherMessageReglages(
      "Aucune donnée n’est actuellement enregistrée."
    );

    return;
  }

  const confirmation = window.confirm(
    "Toutes les dates sélectionnées seront supprimées.\n\n" +
    "Cette opération ne pourra pas être annulée, sauf si " +
    "tu disposes d’une sauvegarde exportée.\n\n" +
    "Supprimer toutes les données ?"
  );

  if (!confirmation) {
    afficherMessageReglages(
      "La suppression a été annulée."
    );

    return;
  }

  datesSelectionnees.clear();
  enregistrerDatesSelectionnees();
  afficherCalendrier();

  afficherMessageReglages(
    "Toutes les données ont été supprimées."
  );
}

boutonMoisPrecedent.addEventListener(
  "click",
  () => changerMois(-1)
);

boutonMoisSuivant.addEventListener(
  "click",
  () => changerMois(1)
);

boutonAujourdhui.addEventListener(
  "click",
  revenirAujourdhui
);

titreMois.addEventListener(
  "click",
  revenirAujourdhui
);

boutonReglages.addEventListener(
  "click",
  ouvrirReglages
);

boutonFermerReglages.addEventListener(
  "click",
  fermerReglages
);

boutonExporter.addEventListener(
  "click",
  exporterDonnees
);

boutonImporter.addEventListener(
  "click",
  demanderImportation
);

boutonEffacer.addEventListener(
  "click",
  effacerToutesLesDonnees
);

fichierImport.addEventListener(
  "change",
  () => {
    const fichier = fichierImport.files[0];

    if (!fichier) {
      return;
    }

    importerSauvegarde(fichier);
  }
);

fondModal.addEventListener(
  "click",
  (event) => {
    /*
      Le panneau se ferme uniquement si le clic
      se produit sur le fond sombre.
    */
    if (event.target === fondModal) {
      fermerReglages();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      !fondModal.hidden
    ) {
      fermerReglages();
    }
  }
);

zoneCalendrier.addEventListener(
  "pointerdown",
  commencerGeste
);

zoneCalendrier.addEventListener(
  "pointermove",
  suivreGeste
);

zoneCalendrier.addEventListener(
  "pointerup",
  terminerGeste
);

zoneCalendrier.addEventListener(
  "pointercancel",
  annulerGeste
);

afficherCalendrier();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((enregistrement) => {
        console.log(
          "Service worker enregistré :",
          enregistrement.scope
        );
      })
      .catch((erreur) => {
        console.error(
          "Échec de l’enregistrement du service worker :",
          erreur
        );
      });
  });
}