export type PolicyHelp = {
  term: string;
  gloss: string;
  what: string;
  ifRaise: string;
  ifLower: string;
};

function minLabel(n: number): string {
  return `${n} min`;
}

function eurLabel(n: number): string {
  return `${n} €`;
}

export function helpHeartbeat(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "Heartbeat",
    gloss: "Durée d’un cycle de recherche",
    what: `Après l’heure prévue, on cherche encore ${t}. Personne ? On demande au client s’il continue. S’il dit oui (ou s’il ajoute un bonus), on recommence ${t}.`,
    ifRaise: "Les courses sans chauffeur restent ouvertes plus longtemps.",
    ifLower: "On arrête plus vite : plus d’annulations « personne trouvé ».",
  };
}

export function helpSilence(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "Silence",
    gloss: "Délai sans réponse après la pause",
    what: `Quand on a demandé au client s’il continue, s’il ne répond pas pendant ${t}, la course est annulée. Personne ne paie. Il peut recréer la même course.`,
    ifRaise: "On attend plus longtemps une réponse avant d’annuler.",
    ifLower: "Sans réponse, on ferme plus vite.",
  };
}

export function helpEnRoute(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "En route",
    gloss: "Le chauffeur est déjà parti (ou presque)",
    what: `Si la prise en charge est dans moins de ${t}, ou si le GPS tourne, ou s’il a signalé son arrivée, on considère qu’il s’est déplacé. Annuler alors peut coûter le palier « en route ».`,
    ifRaise: "On traite plus de courses comme « déjà parti » (frais plus tôt).",
    ifLower: "Le client peut annuler plus longtemps sans ce frais.",
  };
}

export function helpDriverLate(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "Grâce chauffeur",
    gloss: "Retard du chauffeur, pas encore arrivé",
    what: `Passé l’heure prévue + ${t}, s’il n’est pas marqué arrivé : le client annule sans frais. Le chauffeur peut se libérer sans facturer.`,
    ifRaise: "On attend plus longtemps avant de dire « chauffeur en retard ».",
    ifLower: "Le client (et le chauffeur) peuvent se dégager plus tôt, 0 €.",
  };
}

export function helpWaitGrace(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "Grâce d’attente",
    gloss: "Minutes offertes une fois le chauffeur arrivé",
    what: `Après « je suis arrivé », les ${t} premières minutes sont offertes. Annuler pendant ce temps : 0 €.`,
    ifRaise: "Plus de temps gratuit pour le client sur place.",
    ifLower: "Les frais d’attente commencent plus tôt.",
  };
}

export function helpWaitMax(minutes: number): PolicyHelp {
  const t = minLabel(minutes);
  return {
    term: "Attente max",
    gloss: "Ensuite, client considéré absent (no-show)",
    what: `Si le chauffeur attend plus de ${t} après son arrivée, il peut marquer le client absent. Des frais no-show s’affichent (pas de paiement automatique).`,
    ifRaise: "Le chauffeur doit attendre plus longtemps avant le no-show.",
    ifLower: "No-show possible plus tôt.",
  };
}

export function helpNoShowFlat(amount: number): PolicyHelp {
  const e = eurLabel(amount);
  return {
    term: "No-show",
    gloss: "Client absent après l’arrivée du chauffeur",
    what: `Forfait ${e} ajouté au palier no-show quand le chauffeur déclare l’absence. Affiché seulement, pas débité tout seul.`,
    ifRaise: "Le montant affiché en cas d’absence augmente.",
    ifLower: "Le montant affiché diminue (0 = pas de forfait).",
  };
}

export function helpCancelAfterArrivalFlat(amount: number): PolicyHelp {
  const e = eurLabel(amount);
  return {
    term: "Forfait après arrivée",
    gloss: "Le client annule alors que le chauffeur est sur place",
    what: `${e} s’ajoute aux paliers d’attente si le client annule après « je suis arrivé » (hors grâce).`,
    ifRaise: "Annuler sur place coûte plus cher à l’affichage.",
    ifLower: "Moins de forfait (0 = paliers seuls).",
  };
}

export function helpTierWait(): PolicyHelp {
  return {
    term: "Palier attente",
    gloss: "Prix pendant l’attente après arrivée",
    what: "Après la grâce, on prend le palier dont « après X min » est le plus proche sans dépasser le temps d’attente. Forfait + euros par minute ensuite.",
    ifRaise: "L’attente affichée coûte plus cher.",
    ifLower: "L’attente affichée coûte moins cher.",
  };
}

export function helpTierEnRoute(): PolicyHelp {
  return {
    term: "Palier en route",
    gloss: "Le client annule alors que le chauffeur s’est déplacé",
    what: "Montant affiché si le chauffeur est déjà parti (GPS, arrivée, ou prise en charge proche). En général un forfait dès 0 min.",
    ifRaise: "Annuler une fois parti coûte plus cher à l’affichage.",
    ifLower: "Ce cas coûte moins (0 = gratuit).",
  };
}

export function helpTierAfterArrival(): PolicyHelp {
  return {
    term: "Palier après arrivée",
    gloss: "Annulation client une fois le chauffeur arrivé",
    what: "S’ajoute à l’attente et au forfait « après arrivée ». Utile pour un palier en plus du temps d’attente.",
    ifRaise: "Annuler sur place coûte plus à l’affichage.",
    ifLower: "Moins de frais sur ce palier.",
  };
}

export function helpTierNoShow(): PolicyHelp {
  return {
    term: "Palier no-show",
    gloss: "En plus du forfait no-show",
    what: "Quand le chauffeur déclare l’absence, on additionne ce palier + le forfait no-show + l’attente éventuelle.",
    ifRaise: "L’absence affichée coûte plus cher.",
    ifLower: "Moins de frais sur ce palier.",
  };
}

export const TIER_HELP = {
  wait: helpTierWait,
  cancel_en_route: helpTierEnRoute,
  cancel_after_arrival: helpTierAfterArrival,
  no_show: helpTierNoShow,
} as const;

export function helpTimelineSearch(): PolicyHelp {
  return {
    term: "Recherche",
    gloss: "On cherche un chauffeur",
    what: "Dès la réservation, les chauffeurs peuvent voir la course (tant qu’elle n’est pas en pause).",
    ifRaise: "Sans objet — ce n’est pas un chiffre à modifier ici.",
    ifLower: "Sans objet — ce n’est pas un chiffre à modifier ici.",
  };
}

export function helpTimelinePickup(): PolicyHelp {
  return {
    term: "Heure prévue",
    gloss: "Prise en charge",
    what: "Si l’heure est passée et personne n’a accepté, la course est en retard de recherche — ce n’est pas un retard du client.",
    ifRaise: "Sans objet — ce n’est pas un chiffre à modifier ici.",
    ifLower: "Sans objet — ce n’est pas un chiffre à modifier ici.",
  };
}

export function helpTimelinePause(heartbeat: number): PolicyHelp {
  return {
    term: "On demande",
    gloss: "Fin d’un heartbeat",
    what: `Au bout de ${minLabel(heartbeat)} après l’heure prévue (deadline), on met la recherche en pause et on demande au client s’il continue. Personne ne peut plus accepter tant qu’il n’a pas répondu.`,
    ifRaise: "Voir le champ Heartbeat : une hausse retarde cette pause.",
    ifLower: "Voir le champ Heartbeat : une baisse avance cette pause.",
  };
}

export function helpTimelineExpire(silence: number): PolicyHelp {
  return {
    term: "On arrête",
    gloss: "Silence trop long",
    what: `Sans réponse pendant ${minLabel(silence)} après la pause, la course est annulée. 0 €. Le client peut recréer la même course.`,
    ifRaise: "Voir le champ Silence.",
    ifLower: "Voir le champ Silence.",
  };
}

export function helpSectionHeartbeat(): PolicyHelp {
  return {
    term: "Onglet Heartbeat",
    gloss: "Combien de temps on cherche un chauffeur",
    what: "Ici : durée d’un cycle (heartbeat) et délai sans réponse (silence). Ça ne règle pas les frais d’annulation une fois un chauffeur assigné.",
    ifRaise: "Les deux champs de cet onglet allongent la recherche.",
    ifLower: "Les deux champs raccourcissent la recherche.",
  };
}

export function helpSectionCancel(): PolicyHelp {
  return {
    term: "Retards et frais",
    gloss: "Qui attend, qui paie à l’affichage",
    what: "Chauffeur en retard (pas arrivé) ≠ client en retard (chauffeur déjà là). Les montants s’affichent ; rien n’est débité automatiquement. Une course déjà créée garde ses règles.",
    ifRaise: "Les clients / chauffeurs voient des montants plus élevés.",
    ifLower: "Les montants affichés baissent.",
  };
}

export function helpExamples(): PolicyHelp {
  return {
    term: "Exemples",
    gloss: "Vérifier sans enregistrer",
    what: "Choisissez une situation. Le montant utilise les chiffres des autres onglets, même non enregistrés. Utile avant de sauver, pour ne pas se tromper.",
    ifRaise: "Sans objet — cet onglet ne sauve rien.",
    ifLower: "Sans objet — cet onglet ne sauve rien.",
  };
}

export function helpScenario(id: string): PolicyHelp {
  const map: Record<string, PolicyHelp> = {
    matching: {
      term: "Personne n’a pris la course",
      gloss: "Pas de chauffeur",
      what: "Le client peut annuler sans frais. C’est le cas matching.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
    far: {
      term: "Chauffeur assigné, encore loin",
      gloss: "Pas encore « en route »",
      what: "Prise en charge trop loin dans le temps, pas de GPS. Annuler : souvent 0 €.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
    en_route: {
      term: "Chauffeur déjà parti",
      gloss: "En route",
      what: "GPS, arrivée, ou prise en charge proche. Annuler côté client : palier en route.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
    driver_late: {
      term: "Chauffeur en retard",
      gloss: "Pas arrivé, grâce dépassée",
      what: "Le client annule 0 €. Le chauffeur peut se libérer sans facturer.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
    wait: {
      term: "Chauffeur arrivé, on attend",
      gloss: "Le client n’est pas encore là",
      what: "Les minutes d’attente (réglables ci-dessous) décident grâce, frais, puis no-show.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
    in_progress: {
      term: "Course commencée",
      gloss: "En cours",
      what: "Le client ne peut plus annuler depuis l’app.",
      ifRaise: "Sans objet — c’est un exemple.",
      ifLower: "Sans objet — c’est un exemple.",
    },
  };
  return map[id] ?? map.matching;
}
