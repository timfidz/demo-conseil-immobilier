// Comportements communs du site : menu, bannière cookies, formulaires, filtres
(function () {
  "use strict";

  // En-tête : ombre au défilement
  const entete = document.querySelector(".entete");
  const majEntete = () => entete && entete.classList.toggle("defile", window.scrollY > 8);
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  // Menu mobile
  const boutonMenu = document.querySelector(".bouton-menu");
  const nav = document.querySelector(".nav");
  if (boutonMenu && nav) {
    boutonMenu.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("ouvert");
      boutonMenu.setAttribute("aria-expanded", String(ouvert));
    });
    // Échap referme le menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("ouvert")) { boutonMenu.click(); boutonMenu.focus(); }
    });
  }

  // Consentement cookies : choix conservé 6 mois (recommandation CNIL), refus aussi simple que l'acceptation
  const CLE = "consentement-cookies";
  const DUREE = 1000 * 60 * 60 * 24 * 182;
  const lireChoix = () => {
    try {
      const choix = JSON.parse(localStorage.getItem(CLE));
      return choix && Date.now() - choix.date < DUREE ? choix : null;
    } catch { return null; }
  };
  const enregistrerChoix = (mesure) => {
    const choix = { mesure, date: Date.now() };
    try { localStorage.setItem(CLE, JSON.stringify(choix)); } catch {}
    appliquer(choix);
  };
  // La mesure d'audience ne se charge qu'après accord explicite
  const appliquer = (choix) => {
    if (choix && choix.mesure && !window.__mesureChargee) {
      window.__mesureChargee = true;
      // Emplacement du script de statistiques (Matomo auto-hébergé ou équivalent) : non chargé dans la démonstration
    }
  };

  const banniere = document.querySelector(".cookies");
  if (banniere) {
    const detail = banniere.querySelector(".cookies-detail");
    const caseMesure = banniere.querySelector("#mesure-audience");
    const montrer = () => {
      const choix = lireChoix();
      if (caseMesure) caseMesure.checked = !!(choix && choix.mesure);
      banniere.classList.add("visible");
    };
    const cacher = () => { banniere.classList.remove("visible"); detail.classList.remove("ouvert"); };
    banniere.querySelector("[data-cookies='accepter']").addEventListener("click", () => { enregistrerChoix(true); cacher(); });
    banniere.querySelector("[data-cookies='refuser']").addEventListener("click", () => { enregistrerChoix(false); cacher(); });
    banniere.querySelector("[data-cookies='personnaliser']").addEventListener("click", () => detail.classList.toggle("ouvert"));
    banniere.querySelector("[data-cookies='enregistrer']").addEventListener("click", () => { enregistrerChoix(caseMesure.checked); cacher(); });
    document.querySelectorAll("[data-gerer-cookies]").forEach((b) => b.addEventListener("click", montrer));
    const choix = lireChoix();
    if (choix) appliquer(choix); else montrer();
  }

  // Formulaires : validation côté navigateur, message d'erreur par champ, piège à robots
  document.querySelectorAll("form[data-formulaire]").forEach((form) => {
    form.setAttribute("novalidate", "");
    const messages = {
      valueMissing: "Ce champ est obligatoire.",
      typeMismatch: "Le format n'est pas valide.",
      patternMismatch: "Le format n'est pas valide.",
    };
    const verifier = (champ) => {
      const bloc = champ.closest(".champ");
      if (!bloc) return true;
      const erreur = bloc.querySelector(".erreur");
      const cle = Object.keys(messages).find((k) => champ.validity[k]);
      bloc.classList.toggle("invalide", !!cle);
      if (erreur) erreur.textContent = cle ? messages[cle] : "";
      return !cle;
    };
    form.querySelectorAll("input, select, textarea").forEach((c) => c.addEventListener("blur", () => verifier(c)));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.querySelector(".pot-de-miel input").value) return;
      const champs = [...form.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select, textarea")].filter((c) => c.closest(".champ"));
      const valides = champs.map(verifier).every(Boolean);
      const groupes = [...form.querySelectorAll("[data-requis-groupe]")];
      const groupesOk = groupes.every((g) => {
        const ok = !!g.querySelector("input:checked");
        const err = g.parentElement.querySelector(".erreur");
        if (err) err.textContent = ok ? "" : "Choisissez une option.";
        return ok;
      });
      const accord = form.querySelector("[name=accord]");
      const accordErr = form.querySelector(".erreur-accord");
      if (accordErr) accordErr.textContent = accord.checked ? "" : "Votre accord est nécessaire pour traiter la demande.";
      if (!valides || !groupesOk || !accord.checked) {
        const premier = form.querySelector(".invalide input, .invalide select, .invalide textarea");
        if (premier) premier.focus();
        return;
      }
      // Démonstration : aucun envoi. En production, envoi au serveur puis courriel au cabinet.
      form.style.display = "none";
      const succes = form.parentElement.querySelector(".succes");
      if (succes) { succes.style.display = "block"; succes.focus(); }
    });
  });

  // Actualités et études de cas : filtre par type
  const filtres = document.querySelectorAll(".filtre");
  filtres.forEach((f) => f.addEventListener("click", () => {
    filtres.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
    const type = f.dataset.type;
    document.querySelectorAll(".article[data-type]").forEach((a) => { a.hidden = type !== "tout" && a.dataset.type !== type; });
  }));

  document.querySelectorAll("[data-annee]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
