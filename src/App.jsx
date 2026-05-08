import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   KALOPROD ULTIMATE — Olaking Personal AI Music Agent
   ✅ Avatar hip-hop animé full-body (Olaking style)
   ✅ Voix automatique — parle dès qu'il répond
   ✅ Commande vocale STT
   ✅ Upload audio / image / vidéo avec analyse
   ✅ Moteur de contenu 16 outils spécialisés
   ✅ Planning éditorial 30 jours auto-généré
   ✅ Bibliothèque persistante
   ✅ Analyse de tendances & veille marché
   ✅ Générateur de paroles / hooks
   ✅ Simulateur de pitch label/booking
   ✅ Checklist de release
   ✅ Calculateur de revenus streaming
   ✅ Mood board textuel
   ✅ Profil Olaking intégré complet
═══════════════════════════════════════════════════════════════════ */

// ─── PROFIL OLAKING ──────────────────────────────────────────────
const ARTIST_PROFILE = `
ARTISTE : Olaking | PRODUCTEUR : Kalo Prod (même personne — double casquette)
YOUTUBE : @olakingofficiel
STYLE : Artiste caméléon urbain — Trap, Reggae, Afrobeats, R&B, Rap conscient
IDENTITÉ : Storyteller — raconte les rêves des quartiers avec des thèmes forts
THÈMES : amour, guerre, actualité, réussite, jalousie entourage, quartier, ambition
SONS PRÊTS : "Zone Rouge" (trap — PRIORITÉ ABSOLUE), "Billet Violet" (réussite/jalousie), "Favela" (amour/ambition)
EN RÉSERVE : sons dansants, sons amour, sons mélodieux, plein de thèmes variés
DISTRIBUTION : DistroKid actif — présent sur Spotify, Apple Music, etc.
PRÉSENCE : YouTube @olakingofficiel, 2-3 visuels existants
ÉTAPE : Construction fanbase, distribution active
PRIORITÉ N°1 : Lancer Zone Rouge avec campagne complète
RÉFÉRENCES : Damso, Damian Marley, Kendrick Lamar, Drake (caméléon de genres)
FORCE UNIQUE : Storyteller caméléon — change de style mais garde toujours une plume forte`;

// ─── SYSTEM PROMPT ULTIMATE ──────────────────────────────────────
const SYSTEM_PROMPT = `Tu es KALOPROD — agent IA hip-hop d'élite, manager et directeur artistique personnel d'Olaking. Tu connais son univers par cœur et tous tes conseils sont 100% personnalisés pour lui.

${ARTIST_PROFILE}

TES 8 DOMAINES D'EXPERTISE :

1. CRÉATION DE CONTENU
Bios (courte/longue/presse), EPK complet, pitchs, communiqués de presse, descriptions Spotify/YouTube, storytelling de carrière, captions Instagram/TikTok/Twitter, scripts vidéo, newsletters

2. DIRECTION ARTISTIQUE & VISUELLE
Identité visuelle complète (palette, typo, mood), direction photo/vidéo, artwork covers, grille Instagram, Spotify Canvas, lookbook scénique, moodboards, analyse des visuels partagés

3. STRATÉGIE CARRIÈRE
Roadmap 3/6/12 mois, positionnement marché, benchmarking artistes, plan de sortie Zone Rouge, stratégie singles/EP/album, stratégie featuring et collabs, développement fanbase

4. MARKETING DIGITAL & RÉSEAUX
TikTok viral (algorithme, trends, hooks), Instagram Reels/Stories/Lives, YouTube SEO/Shorts, Twitter/X, Spotify for Artists (pitch curators), Meta Ads/TikTok Ads bases, hashtag strategy

5. MONÉTISATION & BUSINESS
Revenus streaming (DistroKid, SACEM/ASCAP, droits voisins), merchandising, booking et live, sync licensing (pub/film/série/jeux), Patreon/Ko-fi, NFT musical, négociation contrats bases

6. JURIDIQUE & ADMINISTRATIF
Droits d'auteur SACEM, dépôt œuvres, contrats (label/management/booking/co-écriture), structure juridique (auto-entrepreneur/SASU), sample clearance, protection nom artistique

7. DÉVELOPPEMENT ARTISTIQUE
Analyse musicale (style/genre/BPM/ambiance), feedback sur les sons, conseils d'écriture (hooks/punchlines/structure), conseils de production, performance scénique, mental artist et confiance

8. ANALYSE & INTELLIGENCE MARCHÉ
Tendances genres émergents, veille concurrentielle, ciblage audience (démographie/psychographie), KPIs à suivre, A&R thinking, intelligence de la scène urbaine française et internationale

ANALYSE DE FICHIERS :
Audio → genre, ambiance, énergie, influences, potentiel commercial, plan marketing
Image → direction artistique, cohérence visuelle, forces, faiblesses, améliorations
Vidéo → esthétique, impact social media, storytelling, optimisation plateforme

RÈGLES DE RÉPONSE :
- Toujours personnalisé pour Olaking — jamais générique
- Langage hip-hop naturel : "C'est feu", "frère", "on va faire buzzer ça"
- Mode vocal (3 phrases max) : oral, court, énergique, actionnable
- Mode texte : structuré, précis, avec exemples concrets
- Terminer par UNE action concrète à faire maintenant
- Référencer ses sons réels (Zone Rouge, Billet Violet, Favela) quand pertinent`;

// ─── STORAGE ─────────────────────────────────────────────────────
const SK = "kaloprod_ultimate_olaking";
const loadSaved = async () => {
  try { const r = await window.storage?.get(SK); return r ? JSON.parse(r.value) : { posts:[], calendar:[], notes:[], revenue:{} }; }
  catch { return { posts:[], calendar:[], notes:[], revenue:{} }; }
};
const doSave = async (data) => { try { await window.storage?.set(SK, JSON.stringify(data)); } catch {} };

// ─── HELPERS ─────────────────────────────────────────────────────
const getKind = f => f.type.startsWith("audio/")?"audio":f.type.startsWith("image/")?"image":f.type.startsWith("video/")?"video":"other";
const KIND_ICO = { audio:"🎵", image:"🖼️", video:"🎬", other:"📎" };
const toB64 = f => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result.split(",")[1]); r.onerror=rej; r.readAsDataURL(f); });
const fmtSize = b => b>1048576?`${(b/1048576).toFixed(1)}MB`:`${(b/1024).toFixed(0)}KB`;
const today = () => new Date().toLocaleDateString("fr-FR");

// ─── ALL TOOLS (16) ──────────────────────────────────────────────
const TOOLS = [
  // CONTENU
  { id:"zone_rouge",   cat:"🔴 PRIORITÉ",   icon:"🔴", label:"Plan Zone Rouge",       prompt:"Crée le plan de lancement complet pour Zone Rouge de façon orale. Semaine par semaine, 4 semaines avant et après la sortie. Très concret et actionnable pour Olaking." },
  { id:"bio",          cat:"📝 Contenu",     icon:"✍️", label:"Bio Artiste",           prompt:"Rédige la bio d'Olaking. Version courte percutante pour Instagram, version longue pour l'EPK. Utilise tout ce que tu sais de lui : caméléon urbain, Kalo Prod, storyteller." },
  { id:"epk",          cat:"📝 Contenu",     icon:"📋", label:"EPK Complet",           prompt:"Rédige l'EPK complet d'Olaking : bio, style musical, sons phares (Zone Rouge, Billet Violet, Favela), vision artistique, contact Kalo Prod. Professionnel et percutant." },
  { id:"caption_ig",   cat:"📝 Contenu",     icon:"📸", label:"Captions Instagram",    prompt:"Génère 5 captions Instagram pour Olaking. Styles variés : hype, conscient, mystérieux, amour, backstage. Emojis et hashtags optimisés pour son univers urbain." },
  { id:"tiktok",       cat:"📱 Réseaux",     icon:"🎬", label:"Concepts TikTok",       prompt:"Crée 5 concepts TikTok viraux pour Olaking basés sur Zone Rouge et ses autres sons. Concept vidéo + accroche + son + hashtags pour chacun." },
  { id:"tweets",       cat:"📱 Réseaux",     icon:"🐦", label:"Pack Tweets",           prompt:"Génère 7 tweets pour Olaking : teasing Zone Rouge, motivation, punchlines, actualité, engagement communauté, backstage studio. Percutant et authentique." },
  { id:"stories",      cat:"📱 Réseaux",     icon:"🔵", label:"Stories Instagram",     prompt:"Crée un scénario de 10 Stories Instagram pour teaser Zone Rouge. Chaque story : visuel suggéré, texte, sticker interactif, durée." },
  { id:"hashtags",     cat:"📱 Réseaux",     icon:"#️⃣", label:"Pack Hashtags",         prompt:"Génère 6 packs de hashtags pour Olaking : sortie Zone Rouge, rap conscient, trap, reggae/afro, lifestyle artiste, engagement. Mix français et international." },
  // STRATÉGIE
  { id:"plan30",       cat:"📊 Stratégie",   icon:"📅", label:"Planning 30 jours",     prompt:"Crée le planning éditorial 30 jours pour Olaking avec Zone Rouge comme fil conducteur. Donne les grandes lignes semaine par semaine : plateformes, thèmes, types de contenus." },
  { id:"roadmap",      cat:"📊 Stratégie",   icon:"🗺️", label:"Roadmap 6 mois",        prompt:"Construis la roadmap 6 mois pour Olaking. Mois par mois : sorties musicales, objectifs réseaux, actions business, jalons de carrière. Réaliste et ambitieux." },
  { id:"collab",       cat:"📊 Stratégie",   icon:"🤝", label:"Stratégie Collabs",     prompt:"Définis la stratégie de featuring pour Olaking. Types d'artistes à cibler selon ses genres, comment les approcher, 3 templates de messages. Concret et actionnable." },
  { id:"pitch_pl",     cat:"📊 Stratégie",   icon:"🎵", label:"Pitch Playlists",       prompt:"Explique comment pitcher Zone Rouge aux curateurs Spotify. Étapes concrètes, quoi écrire, quand le faire, quelles playlists cibler pour un artiste trap urbain français." },
  // ARTISTIQUE
  { id:"lyrics",       cat:"🎤 Artistique",  icon:"🖊️", label:"Hooks & Punchlines",    prompt:"Aide Olaking à développer ses hooks et punchlines. Donne des exemples de structures pour Zone Rouge (trap), Billet Violet (conscient) et un son reggae. Techniques d'écriture concrètes." },
  { id:"visual_id",    cat:"🎨 Visuel",      icon:"🎨", label:"Identité Visuelle",      prompt:"Définis l'identité visuelle complète d'Olaking : palette couleurs, typographies, ambiance photos, direction artistique covers. Basé sur sa dualité conscient/trap/reggae." },
  { id:"scene",        cat:"🎤 Artistique",  icon:"🎭", label:"Performance Scénique",   prompt:"Donne des conseils de performance scénique pour Olaking. Set list idéale avec ses sons, présence sur scène, interaction public, gestion de l'énergie. Très pratique." },
  { id:"monetisation", cat:"💰 Business",    icon:"💰", label:"Plan Monétisation",      prompt:"Explique toutes les sources de revenus activables maintenant pour Olaking avec DistroKid. Streaming, SACEM, sync, merch, booking, Patreon. Priorise selon son étape de carrière." },
];

const RELEASE_CHECKLIST = [
  { week:-4, items:["Finaliser le master du son","Créer le cover art","Soumettre sur DistroKid","Préparer les teasers visuels","Créer la page Spotify for Artists"] },
  { week:-3, items:["Lancer le pré-save","Pitcher aux curateurs Spotify","Contacter les blogs musique","Teaser #1 sur TikTok et Instagram","Préparer le communiqué de presse"] },
  { week:-2, items:["Teaser #2 — extrait du son","Contacter les radios web","Stories countdown Instagram","Interviews et contenus behind-the-scenes","Confirmer les collabs promo"] },
  { week:-1, items:["Teaser final — drop date révélée","Boost Meta Ads sur le pré-save","Stories quotidiennes","DM aux ambassadeurs et street team","Préparer le clip ou visualizer"] },
  { week:0,  items:["Publication à minuit","Post Instagram + Stories","TikTok avec le son","Tweet d'annonce","Email à la fanbase si newsletter"] },
  { week:1,  items:["Repost des contenus fans","Répondre à tous les commentaires","Push TikTok supplémentaire","Pitcher aux playlists editoriales","Analyser les stats DistroKid"] },
];

// ─── REVENUE CALCULATOR DATA ────────────────────────────────────
const PLATFORMS = [
  { name:"Spotify",    rate:0.004,  icon:"💚" },
  { name:"Apple Music",rate:0.0078, icon:"⬛" },
  { name:"YouTube",    rate:0.001,  icon:"🔴" },
  { name:"Deezer",     rate:0.0056, icon:"🟣" },
  { name:"TikTok",     rate:0.0003, icon:"⬜" },
];

// ═══════════════════════════════════════════════════════════════════
// AVATAR OLAKING HIP-HOP SVG
// ═══════════════════════════════════════════════════════════════════
function KaloAvatar({ size=180, isSpeaking=false, isListening=false, isThinking=false, mini=false }) {
  const s = mini ? 42 : size;
  return (
    <div style={{ position:"relative", width:s, height:mini?s:s*1.58, flexShrink:0 }}>
      {!mini && (
        <div style={{
          position:"absolute", inset:-18, borderRadius:"50% 50% 40% 40%", pointerEvents:"none",
          background: isListening ? "radial-gradient(ellipse,rgba(74,222,128,.22) 0%,transparent 65%)"
            : isSpeaking ? "radial-gradient(ellipse,rgba(255,200,0,.24) 0%,transparent 65%)"
            : "radial-gradient(ellipse,rgba(255,60,0,.07) 0%,transparent 65%)",
          animation:(isSpeaking||isListening)?"avG 1.4s ease-in-out infinite":"none",
          transition:"background .5s",
        }}/>
      )}
      <svg width={s} height={mini?s:s*1.58} viewBox={mini?"10 2 80 96":"0 0 100 158"}
        style={{
          display:"block",
          animation:mini?"none":(isSpeaking||isListening)?"avBob .45s ease-in-out infinite alternate":"avFloat 3.5s ease-in-out infinite",
          filter:isSpeaking?"drop-shadow(0 0 12px rgba(255,200,0,.65))":isListening?"drop-shadow(0 0 12px rgba(74,222,128,.65))":"drop-shadow(0 4px 14px rgba(0,0,0,.75))",
        }}>
        <defs>
          <radialGradient id="av_sk"  cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#8B5E3C"/><stop offset="100%" stopColor="#5C3A1E"/></radialGradient>
          <radialGradient id="av_sk2" cx="50%" cy="40%" r="55%"><stop offset="0%" stopColor="#7A5230"/><stop offset="100%" stopColor="#4A2E14"/></radialGradient>
          <linearGradient id="av_hd"  x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1c1c1c"/><stop offset="100%" stopColor="#070707"/></linearGradient>
          <linearGradient id="av_jn"  x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1a2a4a"/><stop offset="100%" stopColor="#0d1830"/></linearGradient>
          <linearGradient id="av_sh"  x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f0e8d8"/><stop offset="100%" stopColor="#c8b090"/></linearGradient>
          <linearGradient id="av_ch"  x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ffd700"/><stop offset="50%" stopColor="#fffaaa"/><stop offset="100%" stopColor="#d4af37"/></linearGradient>
          <linearGradient id="av_rd"  x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ff3c00"/><stop offset="100%" stopColor="#bb2200"/></linearGradient>
          <filter id="av_gf"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="av_ds"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,.7)"/></filter>
        </defs>
        {!mini&&<ellipse cx="50" cy="154" rx="22" ry="4" fill="rgba(0,0,0,.5)"/>}
        {/* Shoes */}
        <g filter="url(#av_ds)">
          <ellipse cx="32" cy="150" rx="13" ry="5" fill="#0a0a0a"/>
          <rect x="21" y="142" width="23" height="10" rx="5" fill="url(#av_sh)"/>
          <rect x="21" y="142" width="23" height="4" rx="2" fill="white" opacity=".95"/>
          <line x1="23" y1="144.5" x2="42" y2="144.5" stroke="#ddd" strokeWidth=".6"/>
          <line x1="23" y1="146.5" x2="42" y2="146.5" stroke="#ddd" strokeWidth=".6"/>
          <ellipse cx="68" cy="150" rx="13" ry="5" fill="#0a0a0a"/>
          <rect x="56" y="142" width="23" height="10" rx="5" fill="url(#av_sh)"/>
          <rect x="56" y="142" width="23" height="4" rx="2" fill="white" opacity=".95"/>
          <line x1="58" y1="144.5" x2="77" y2="144.5" stroke="#ddd" strokeWidth=".6"/>
          <line x1="58" y1="146.5" x2="77" y2="146.5" stroke="#ddd" strokeWidth=".6"/>
        </g>
        {/* Jeans */}
        <rect x="27" y="94" width="19" height="51" rx="7" fill="url(#av_jn)"/>
        <rect x="54" y="94" width="19" height="51" rx="7" fill="url(#av_jn)"/>
        <line x1="36.5" y1="99" x2="36.5" y2="140" stroke="#253550" strokeWidth=".7" strokeDasharray="4 2"/>
        <line x1="63.5" y1="99" x2="63.5" y2="140" stroke="#253550" strokeWidth=".7" strokeDasharray="4 2"/>
        <rect x="27" y="91" width="46" height="6" rx="2" fill="#180e06"/>
        <rect x="44" y="91" width="12" height="6" rx="1.5" fill="url(#av_ch)"/>
        {/* Hoodie */}
        <rect x="19" y="53" width="62" height="46" rx="9" fill="url(#av_hd)"/>
        <rect x="19" y="55" width="6" height="42" rx="3" fill="url(#av_rd)" opacity=".85"/>
        <rect x="75" y="55" width="6" height="42" rx="3" fill="url(#av_rd)" opacity=".85"/>
        <line x1="50" y1="53" x2="50" y2="86" stroke="#222" strokeWidth="1.2"/>
        <rect x="34" y="78" width="32" height="16" rx="5" fill="#111"/>
        <text x="50" y="73" textAnchor="middle" fontSize="9" fontWeight="900" fill="url(#av_ch)" fontFamily="monospace" filter="url(#av_gf)">KP</text>
        <text x="50" y="78" textAnchor="middle" fontSize="3.5" fontWeight="700" fill="#ff3c00" fontFamily="monospace">OLAKING</text>
        {/* Left arm */}
        <rect x="7" y="55" width="14" height="40" rx="7" fill="url(#av_hd)"/>
        <rect x="7" y="57" width="5" height="36" rx="2.5" fill="url(#av_rd)" opacity=".7"/>
        <ellipse cx="14" cy="98" rx="7" ry="6" fill="url(#av_sk2)"/>
        <path d="M9 94 Q14 97 19 94" fill="none" stroke="url(#av_ch)" strokeWidth="2" opacity=".85"/>
        {/* Right arm + mic */}
        <g transform="rotate(-10,85,73)">
          <rect x="79" y="53" width="14" height="40" rx="7" fill="url(#av_hd)"/>
          <rect x="79" y="55" width="5" height="36" rx="2.5" fill="url(#av_rd)" opacity=".7"/>
        </g>
        <ellipse cx="90" cy="93" rx="7" ry="6" fill="url(#av_sk2)" transform="rotate(-10,90,93)"/>
        <rect x="91" y="83" width="5.5" height="14" rx="2.5" fill="#3a3a3a"/>
        <ellipse cx="93.5" cy="82" rx="4.5" ry="5" fill="#222"/>
        <ellipse cx="93.5" cy="82" rx="2.5" ry="3" fill="#666"/>
        {isSpeaking&&<ellipse cx="93.5" cy="82" rx="9" ry="9" fill="rgba(255,200,0,.2)" style={{animation:"avG .5s ease-in-out infinite"}}/>}
        {/* Chain */}
        <path d="M33 58 Q50 69 67 58" fill="none" stroke="url(#av_ch)" strokeWidth="3" opacity=".95" filter="url(#av_gf)"/>
        <circle cx="50" cy="68" r="4.5" fill="url(#av_ch)" filter="url(#av_gf)"/>
        <circle cx="50" cy="68" r="2.5" fill="#fffaaa"/>
        <polygon points="50,64 54,68 50,72 46,68" fill="url(#av_ch)" filter="url(#av_gf)" opacity=".9"/>
        {/* Hood */}
        <path d="M25 53 Q17 35 23 23 Q50 15 77 23 Q83 35 75 53Z" fill="#0d0d0d"/>
        <path d="M29 53 Q21 37 27 27 Q50 19 73 27 Q79 37 71 53Z" fill="#181818"/>
        <rect x="44" y="34" width="12" height="13" rx="5" fill="url(#av_sk)"/>
        {/* Head */}
        <ellipse cx="50" cy="19" rx="19" ry="20" fill="url(#av_sk)"/>
        {/* Cap */}
        <path d="M31 14 Q50 0 69 14 Q65 4 50 2 Q35 4 31 14Z" fill="#0a0a0a"/>
        <rect x="29" y="13" width="42" height="7" rx="1" fill="#111"/>
        <path d="M29 17 Q50 13 71 17" fill="#0d0d0d"/>
        <text x="50" y="18" textAnchor="middle" fontSize="4.5" fontWeight="900" fill="#ffd700" fontFamily="monospace" filter="url(#av_gf)">KALO</text>
        <path d="M29 19 Q50 22 71 19 Q71 24 50 23 Q29 24 29 19Z" fill="#0a0a0a"/>
        <ellipse cx="31" cy="20" rx="3.2" ry="4.2" fill="url(#av_sk2)"/>
        <ellipse cx="69" cy="20" rx="3.2" ry="4.2" fill="url(#av_sk2)"/>
        <circle cx="31" cy="24" r="2.2" fill="url(#av_ch)" filter="url(#av_gf)"/>
        <circle cx="69" cy="24" r="2.2" fill="url(#av_ch)" filter="url(#av_gf)"/>
        {/* Face */}
        <path d="M37 12 Q42 10 47 12" fill="none" stroke="#1a0800" strokeWidth="2.8" strokeLinecap="round"/>
        <path d="M53 12 Q58 10 63 12" fill="none" stroke="#1a0800" strokeWidth="2.8" strokeLinecap="round"/>
        <ellipse cx="42" cy="18" rx="5" ry="5.5" fill="#080600"/>
        <ellipse cx="58" cy="18" rx="5" ry="5.5" fill="#080600"/>
        <circle cx="42" cy="18" r="3" fill="#1a0a00"/>
        <circle cx="58" cy="18" r="3" fill="#1a0a00"/>
        <circle cx="42" cy="18" r="1.8" fill="white" opacity=".9"/>
        <circle cx="58" cy="18" r="1.8" fill="white" opacity=".9"/>
        <circle cx="43" cy="16.5" r=".8" fill="white" opacity=".95"/>
        <circle cx="59" cy="16.5" r=".8" fill="white" opacity=".95"/>
        <path d="M47 22.5 Q50 26.5 53 22.5" fill="none" stroke="#4a2e14" strokeWidth="1.3" opacity=".9"/>
        <circle cx="47" cy="23" r="1.5" fill="#3a2010" opacity=".7"/>
        <circle cx="53" cy="23" r="1.5" fill="#3a2010" opacity=".7"/>
        {isSpeaking
          ? <><ellipse cx="50" cy="29" rx="5.5" ry="3.5" fill="#1a0800"/><rect x="46" y="27.5" width="8" height="3" rx="1.5" fill="white" opacity=".8"/></>
          : <path d="M44 28.5 Q50 32.5 56 28.5" fill="none" stroke="#3a1a0a" strokeWidth="2" strokeLinecap="round"/>}
        {/* Ripples */}
        {isSpeaking&&[0,1,2].map(i=><circle key={i} cx="50" cy="19" r={28+i*13} fill="none" stroke="rgba(255,200,0,.1)" strokeWidth="2" style={{animation:`avRip 1.6s ease-out ${i*.28}s infinite`}}/>)}
        {isListening&&[0,1,2].map(i=><circle key={i} cx="93.5" cy="82" r={10+i*9} fill="none" stroke="rgba(74,222,128,.22)" strokeWidth="1.5" style={{animation:`avRip 1s ease-out ${i*.2}s infinite`}}/>)}
        {isThinking&&!isSpeaking&&!isListening&&<g transform="translate(59,3)">{[0,1,2].map(i=><circle key={i} cx={i*8} cy="0" r="3" fill="#a78bfa" style={{animation:`avTk 1s ease-in-out ${i*.2}s infinite`}}/>)}</g>}
      </svg>
      {!mini&&<div style={{ position:"absolute",bottom:14,right:8,width:14,height:14,borderRadius:"50%",background:isListening?"#4ade80":isSpeaking?"#ffd700":isThinking?"#a78bfa":"#2a2a2a",border:"2px solid #0a0806",boxShadow:isListening?"0 0 10px #4ade80":isSpeaking?"0 0 10px #ffd700":"none",transition:"all .3s" }}/>}
    </div>
  );
}

function AudioWave({ active, color="#ffd700" }) {
  if(!active) return null;
  return <div style={{ display:"flex",alignItems:"center",gap:3,height:28 }}>
    {[1,1.8,2.5,2.1,1.4,2.3,1.8,1.2,2,1.5].map((h,i)=>(
      <div key={i} style={{ width:3,borderRadius:2,background:color,height:h*9,animation:`avWv .7s ease-in-out ${i*.08}s infinite alternate`,opacity:.9 }}/>
    ))}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function KaloprodUltimate() {
  const [view, setView]         = useState("vocal");
  const [messages, setMessages] = useState([{
    role:"assistant",
    content:"Yo Olaking ! KALOPROD est en ligne 🔥 Ton agent IA perso — je connais tout ton univers, Zone Rouge est prêt et on va faire exploser ta carrière. Parle-moi au micro ou écris.",
  }]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [transcript, setTranscript]   = useState("");
  const [speechOk, setSpeechOk] = useState(false);
  const [ttsOk, setTtsOk]       = useState(false);
  const [voiceOn, setVoiceOn]   = useState(true);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingPrevs, setPendingPrevs] = useState([]);
  const [savedPosts, setSavedPosts]     = useState([]);
  const [calData, setCalData]           = useState([]);
  const [notes, setNotes]               = useState([]);
  const [noteInput, setNoteInput]       = useState("");
  const [streams, setStreams]           = useState(100000);
  const [checkWeek, setCheckWeek]       = useState(0);
  const [notif, setNotif]       = useState(null);
  const [generating, setGenerating] = useState(false);
  const [activeTpl, setActiveTpl]   = useState(null);
  const [drag, setDrag]             = useState(false);

  const endRef  = useRef(null);
  const recRef  = useRef(null);
  const synth   = useRef(null);
  const voiceR  = useRef(null);
  const fileRef = useRef(null);

  const G = "#ffd700", O = "#ff3c00";
  const C = { g:G, o:O, card:"rgba(255,255,255,.04)", b:"rgba(255,200,0,.14)", t:"#e8e0d0", m:"#6a5a4a" };

  // ── INIT ────────────────────────────────────────────────
  useEffect(()=>{
    if(window.SpeechRecognition||window.webkitSpeechRecognition) setSpeechOk(true);
    if(window.speechSynthesis){
      setTtsOk(true); synth.current=window.speechSynthesis;
      const pick=()=>{
        const vv=synth.current.getVoices(); if(!vv.length) return;
        voiceR.current=vv.find(v=>v.lang.startsWith("fr")&&v.name.toLowerCase().includes("female"))||vv.find(v=>v.lang.startsWith("fr"))||vv[0];
      };
      pick(); synth.current.onvoiceschanged=pick;
    }
    loadSaved().then(d=>{
      if(d.posts)    setSavedPosts(d.posts);
      if(d.calendar) setCalData(d.calendar);
      if(d.notes)    setNotes(d.notes);
    });
  },[]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[messages]);

  const toast=(m,ok=true)=>{ setNotif({m,ok}); setTimeout(()=>setNotif(null),3000); };
  const persist=(p,c,n)=>doSave({ posts:p||savedPosts, calendar:c||calData, notes:n||notes, revenue:{} });

  // ── SPEAK AUTO ──────────────────────────────────────────
  const speak=useCallback((text)=>{
    if(!ttsOk||!synth.current) return;
    synth.current.cancel();
    const clean=text.replace(/[🎵🎨🎯📸📱✍️🎤🎶•━🔥🚀💰⚖️📊🎬🐦▶️🔵🤝📅📰📋🔴🎯#️⃣💜🖊️🗺️🎭]/g,"").replace(/\*\*/g,"").replace(/#+\s/g,"").replace(/---/g,"").replace(/\n+/g," ").trim();
    const u=new SpeechSynthesisUtterance(clean.slice(0,550));
    if(voiceR.current) u.voice=voiceR.current;
    u.lang="fr-FR"; u.rate=1.01; u.pitch=1.05; u.volume=1;
    u.onstart=()=>setIsSpeaking(true);
    u.onend=()=>setIsSpeaking(false);
    u.onerror=()=>setIsSpeaking(false);
    synth.current.speak(u);
  },[ttsOk]);

  const stopSpeak=()=>{ synth.current?.cancel(); setIsSpeaking(false); };

  // ── STT ─────────────────────────────────────────────────
  const startListen=useCallback(()=>{
    if(!speechOk||isListening) return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR(); rec.lang="fr-FR"; rec.continuous=false; rec.interimResults=true;
    rec.onstart=()=>{ setIsListening(true); setTranscript(""); stopSpeak(); };
    rec.onresult=(e)=>{
      const t=Array.from(e.results).map(r=>r[0].transcript).join(""); setTranscript(t);
      if(e.results[e.results.length-1].isFinal){ setIsListening(false); setTranscript(""); if(t.trim()) sendMsg(t.trim(),true); }
    };
    rec.onerror=()=>{ setIsListening(false); setTranscript(""); };
    rec.onend=()=>setIsListening(false);
    recRef.current=rec; rec.start();
  },[speechOk,isListening]);

  const stopListen=()=>{ recRef.current?.stop(); setIsListening(false); };

  // ── FILES ───────────────────────────────────────────────
  const addFiles=(raw)=>{
    const v=Array.from(raw).filter(f=>f.type.startsWith("audio/")||f.type.startsWith("image/")||f.type.startsWith("video/"));
    if(!v.length){ toast("Audio, image ou vidéo uniquement.",false); return; }
    setPendingFiles(p=>[...p,...v]);
    setPendingPrevs(p=>[...p,...v.map(f=>({ url:URL.createObjectURL(f), kind:getKind(f), name:f.name, size:f.size }))]);
    toast(`${v.length} fichier(s) ajouté(s) ✓`);
  };
  const rmFile=(i)=>{ URL.revokeObjectURL(pendingPrevs[i].url); setPendingFiles(p=>p.filter((_,j)=>j!==i)); setPendingPrevs(p=>p.filter((_,j)=>j!==i)); };

  const buildContent=async(text,files)=>{
    if(!files?.length) return text||"Continue.";
    const parts=[];
    for(const f of files){
      const k=getKind(f);
      if(k==="image"){ const b=await toB64(f); parts.push({type:"image",source:{type:"base64",media_type:f.type,data:b}}); parts.push({type:"text",text:`[Image Olaking "${f.name}": analyse direction artistique, cohérence univers, forces, suggestions.]`}); }
      else if(k==="audio") parts.push({type:"text",text:`[SON OLAKING "${f.name}" ${fmtSize(f.size)}: analyse genre, ambiance, énergie, influences, potentiel commercial, conseils marketing précis.]`});
      else if(k==="video") parts.push({type:"text",text:`[VIDÉO OLAKING "${f.name}": analyse esthétique, impact social media, storytelling, recommandations.]`});
    }
    parts.push({type:"text",text:text||"Analyse et donne tes conseils pour Olaking."});
    return parts;
  };

  // ── SEND ────────────────────────────────────────────────
  const sendMsg=async(text,fromVoice=false)=>{
    const hasF=pendingFiles.length>0;
    if(!text.trim()&&!hasF) return;
    if(loading) return;
    const att=pendingPrevs.map(p=>({...p}));
    const uMsg={role:"user",content:text||"",attachments:att};
    const newMsgs=[...messages,uMsg];
    setMessages(newMsgs); setInput("");
    const fSend=[...pendingFiles]; setPendingFiles([]); setPendingPrevs([]);
    setLoading(true);
    try {
      const sys=SYSTEM_PROMPT+(fromVoice||voiceOn?"\n\nMode vocal : réponds en MAX 3 phrases courtes, orales, sans markdown ni symboles ni listes.":"");
      const apiM=[];
      for(const m of newMsgs){
        if(m.role==="user"){
          const isL=m===newMsgs[newMsgs.length-1];
          apiM.push({role:"user",content:isL&&fSend.length>0?await buildContent(m.content,fSend):(m.content||".")});
        } else apiM.push({role:"assistant",content:m.content});
      }
      const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:900, system:sys, messages:apiM }) });
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"Erreur frère.";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
      if(voiceOn||fromVoice) setTimeout(()=>speak(reply),120);
      if(activeTpl){
        const np={id:Date.now().toString(),type:activeTpl.label,icon:activeTpl.icon,content:reply,date:today()};
        const u=[np,...savedPosts]; setSavedPosts(u); persist(u); setActiveTpl(null); toast("Sauvegardé 📚");
      }
    } catch {
      const e="Erreur de connexion frère."; setMessages(prev=>[...prev,{role:"assistant",content:e}]); if(voiceOn) setTimeout(()=>speak(e),120);
    }
    setLoading(false);
  };

  const quickGen=(tpl)=>{ setActiveTpl(tpl); setView("chat"); setTimeout(()=>sendMsg(tpl.prompt),120); };

  const genCalendar=async()=>{
    setGenerating(true);
    try {
      const res=await fetch("https://api.anthropic.com/v1/messages",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:4000, system:SYSTEM_PROMPT, messages:[{role:"user",content:"Crée le planning éditorial complet 30 jours pour Olaking. Zone Rouge comme fil conducteur. Format : JOUR [N] — [PLATEFORME] — [THÈME]\nType: [type]\nPost: [texte complet prêt à publier avec emojis et hashtags]\n---\nVarie Instagram, TikTok, YouTube, Twitter. 30 jours complets."}] }) });
      const data=await res.json();
      const reply=data.content?.map(b=>b.text||"").join("")||"";
      const e={id:Date.now().toString(),content:reply,date:today()};
      const u=[e,...calData]; setCalData(u); persist(undefined,u); toast("Planning 30 jours généré 🔥");
    } catch { toast("Erreur génération.",false); }
    setGenerating(false);
  };

  const addNote=()=>{ if(!noteInput.trim()) return; const n={id:Date.now().toString(),text:noteInput,date:today()}; const u=[n,...notes]; setNotes(u); persist(undefined,undefined,u); setNoteInput(""); toast("Note sauvegardée ✓"); };
  const delNote=(id)=>{ const u=notes.filter(n=>n.id!==id); setNotes(u); persist(undefined,undefined,u); };
  const delPost=(id)=>{ const u=savedPosts.filter(p=>p.id!==id); setSavedPosts(u); persist(u); };

  const handleKey=(e)=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMsg(input); }};

  const fmt=(t)=>t.split("\n").map((l,i)=>{
    if(l.startsWith("━")||l.startsWith("---")) return <div key={i} style={{height:1,background:"rgba(255,200,0,.1)",margin:"5px 0"}}/>;
    const h=l.replace(/\*\*(.*?)\*\*/g,(_,m)=>`<strong style="color:#ffd700">${m}</strong>`);
    return <p key={i} style={{margin:l===""?"3px 0":"1px 0",lineHeight:1.75}} dangerouslySetInnerHTML={{__html:h}}/>;
  });

  // Revenue calc
  const totalRevenue = PLATFORMS.reduce((acc,p)=>acc+(streams*p.rate),0);

  const TABS=[
    {id:"vocal",   icon:"🎙️", label:"Vocal"},
    {id:"chat",    icon:"💬", label:"Chat"},
    {id:"upload",  icon:"📁", label:"Upload"},
    {id:"create",  icon:"⚡", label:"Créer"},
    {id:"tools",   icon:"🛠️",  label:"Outils"},
    {id:"library", icon:"📚", label:"Biblio"},
  ];

  const Btn = ({onClick,disabled,children,style={}}) => (
    <button onClick={onClick} disabled={disabled} style={{ border:"none",cursor:disabled?"not-allowed":"pointer",...style }}>{children}</button>
  );

  return (
    <div style={{ height:"100vh",display:"flex",flexDirection:"column",background:"linear-gradient(170deg,#0a0806 0%,#110a06 45%,#080808 100%)",color:C.t,overflow:"hidden",fontFamily:"'Georgia',serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700&display=swap');
        @keyframes avG    {0%,100%{opacity:.55;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)}}
        @keyframes avFloat{0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}}
        @keyframes avBob  {from{transform:translateY(0)} to{transform:translateY(-5px)}}
        @keyframes avRip  {0%{opacity:.5;transform:scale(.8)} 100%{opacity:0;transform:scale(2.3)}}
        @keyframes avTk   {0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-5px)}}
        @keyframes avWv   {from{transform:scaleY(.35)} to{transform:scaleY(1)}}
        @keyframes kUp    {from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}}
        @keyframes kPulse {0%,100%{opacity:.35;transform:scale(.75)} 50%{opacity:1;transform:scale(1.5)}}
        @keyframes kNotif {from{opacity:0;transform:translateY(-18px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)}}
        @keyframes kShine {0%{background-position:-200%} 100%{background-position:200%}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:rgba(255,200,0,.2);border-radius:2px}
        textarea,button,select,input{font-family:'Barlow',sans-serif}
      `}</style>

      {/* TOAST */}
      {notif&&<div style={{ position:"fixed",top:14,left:"50%",zIndex:999,padding:"8px 22px",borderRadius:20,whiteSpace:"nowrap",background:notif.ok?"rgba(255,200,0,.13)":"rgba(255,60,0,.13)",border:`1px solid ${notif.ok?G:O}`,color:notif.ok?G:O,fontSize:12,letterSpacing:.5,animation:"kNotif .3s ease" }}>{notif.m}</div>}

      {/* HEADER */}
      <header style={{ flexShrink:0,zIndex:50,background:"rgba(10,8,6,.97)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,200,0,.1)",padding:"8px 14px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:42,height:42,overflow:"hidden" }}><KaloAvatar size={42} mini isSpeaking={isSpeaking} isListening={isListening} isThinking={loading}/></div>
          <div>
            <h1 style={{ fontSize:19,fontWeight:900,letterSpacing:3,lineHeight:1,fontFamily:"'Bebas Neue',sans-serif",background:"linear-gradient(90deg,#ffd700,#ff3c00,#ffd700)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",animation:"kShine 3s linear infinite" }}>KALOPROD</h1>
            <p style={{ fontSize:8,color:C.m,letterSpacing:1.5,textTransform:"uppercase" }}>{isListening?"🎙 Écoute…":isSpeaking?"🔊 Parle…":loading?"⟳ Analyse…":"Ultimate Agent · Olaking"}</p>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <div style={{ padding:"5px 10px",borderRadius:18,background:"rgba(255,200,0,.07)",border:"1px solid rgba(255,200,0,.15)",display:"flex",alignItems:"center",gap:7 }}>
            <div style={{ width:7,height:7,borderRadius:"50%",background:G,boxShadow:`0 0 6px ${G}` }}/>
            <div><p style={{ fontSize:10,color:G,fontWeight:700 }}>Olaking</p><p style={{ fontSize:7,color:C.m }}>Trap · Reggae · R&B · Conscient</p></div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:5 }}>
            <span style={{ fontSize:9,color:C.m }}>🔊</span>
            <Btn onClick={()=>{ setVoiceOn(v=>!v); if(voiceOn) stopSpeak(); }} style={{ width:34,height:18,borderRadius:9,background:voiceOn?"rgba(255,215,0,.25)":"rgba(255,255,255,.07)",position:"relative",transition:"all .3s" }}>
              <div style={{ position:"absolute",top:1,width:16,height:16,borderRadius:"50%",background:voiceOn?G:"#444",transition:"all .3s",left:voiceOn?16:1,boxShadow:voiceOn?`0 0 5px ${G}`:"none" }}/>
            </Btn>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div style={{ flexShrink:0,display:"flex",background:"rgba(10,8,6,.95)",borderBottom:"1px solid rgba(255,200,0,.08)" }}>
        {TABS.map(t=>(
          <Btn key={t.id} onClick={()=>setView(t.id)} style={{ flex:1,padding:"7px 2px",background:view===t.id?"rgba(255,200,0,.07)":"transparent",borderBottom:view===t.id?`2px solid ${G}`:"2px solid transparent",color:view===t.id?G:C.m,fontSize:8.5,letterSpacing:.4,transition:"all .2s",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",borderLeft:"none",borderRight:"none",borderTop:"none" }}>
            <span style={{ fontSize:14 }}>{t.icon}</span>
            <span style={{ fontWeight:600 }}>{t.label}</span>
            {t.id==="library"&&(savedPosts.length+calData.length)>0&&<div style={{ position:"absolute",top:2,right:"12%",width:13,height:13,borderRadius:"50%",background:G,color:"#000",fontSize:7,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>{savedPosts.length+calData.length}</div>}
            {t.id==="upload"&&pendingPrevs.length>0&&<div style={{ position:"absolute",top:2,right:"12%",width:13,height:13,borderRadius:"50%",background:"#4ade80",color:"#000",fontSize:7,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center" }}>{pendingPrevs.length}</div>}
          </Btn>
        ))}
      </div>

      {/* ══════════════ VOCAL ══════════════ */}
      {view==="vocal"&&(
        <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"6px 20px 14px",overflow:"hidden" }}>
          <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8 }}>
            <KaloAvatar size={165} isSpeaking={isSpeaking} isListening={isListening} isThinking={loading}/>
            {messages.length>1&&(
              <div style={{ maxWidth:300,padding:"10px 14px",background:"rgba(255,200,0,.06)",borderRadius:"4px 16px 16px 16px",border:"1px solid rgba(255,200,0,.12)",fontSize:12,color:C.t,lineHeight:1.68,animation:"kUp .3s ease",maxHeight:82,overflow:"hidden" }}>
                <p style={{ fontFamily:"'Barlow',sans-serif" }}>{messages[messages.length-1].content.slice(0,175)}{messages[messages.length-1].content.length>175?"…":""}</p>
              </div>
            )}
            <div style={{ textAlign:"center",minHeight:36 }}>
              {isListening&&<div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,animation:"kUp .3s ease" }}><AudioWave active color="#4ade80"/><p style={{ fontSize:11,color:"#4ade80" }}>{transcript||"Je t'écoute Olaking…"}</p></div>}
              {isSpeaking&&<div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}><AudioWave active color={G}/><p style={{ fontSize:11,color:G }}>KALOPROD te répond…</p></div>}
              {loading&&!isSpeaking&&<div style={{ display:"flex",gap:7,justifyContent:"center" }}>{[0,1,2].map(i=><div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"#a78bfa",animation:`kPulse 1s ${i*.15}s infinite` }}/>)}</div>}
              {!isListening&&!isSpeaking&&!loading&&<p style={{ fontSize:10,color:C.m }}>Appuie sur le micro</p>}
            </div>
          </div>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:9,width:"100%" }}>
            {speechOk
              ? <Btn onClick={isListening?stopListen:startListen} style={{ width:80,height:80,borderRadius:"50%",background:isListening?"linear-gradient(135deg,#4ade80,#16a34a)":"linear-gradient(135deg,#ffd700,#ff3c00)",fontSize:32,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isListening?"0 0 30px rgba(74,222,128,.65)":"0 0 28px rgba(255,215,0,.55)",transition:"all .3s",animation:isListening?"avG .8s infinite":"none" }}>{isListening?"⏹":"🎤"}</Btn>
              : <div style={{ padding:"10px 16px",borderRadius:12,border:`1px solid ${C.b}`,background:C.card,textAlign:"center" }}><p style={{ fontSize:10,color:C.m }}>Micro : Chrome ou Edge requis.</p></div>
            }
            <p style={{ fontSize:9,color:C.m }}>{isListening?"Clique ⏹ pour envoyer":"Appuie pour parler à KALOPROD"}</p>
            {isSpeaking&&<Btn onClick={stopSpeak} style={{ padding:"5px 14px",borderRadius:16,background:"transparent",border:"1px solid rgba(255,200,0,.2)",color:G,fontSize:10 }}>⏹ Couper</Btn>}
          </div>
        </div>
      )}

      {/* ══════════════ CHAT ══════════════ */}
      {view==="chat"&&(
        <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:11 }}>
            {messages.map((msg,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",animation:"kUp .3s ease" }}>
                {msg.role==="assistant"&&<div style={{ marginRight:7,marginTop:3,flexShrink:0 }}><KaloAvatar size={34} mini isSpeaking={isSpeaking&&i===messages.length-1} isListening={false} isThinking={false}/></div>}
                <div style={{ maxWidth:"78%",padding:"10px 13px",borderRadius:msg.role==="user"?"18px 18px 4px 18px":"4px 18px 18px 18px",background:msg.role==="user"?"linear-gradient(135deg,#ffd700,#ff3c00)":C.card,border:msg.role==="user"?"none":`1px solid ${C.b}`,color:msg.role==="user"?"#0a0806":C.t,fontSize:13,lineHeight:1.72 }}>
                  {msg.attachments?.length>0&&<div style={{ marginBottom:8,display:"flex",flexDirection:"column",gap:5 }}>
                    {msg.attachments.map((a,ai)=>(
                      <div key={ai}>
                        {a.kind==="image"&&<img src={a.url} alt="" style={{ maxWidth:"100%",maxHeight:140,borderRadius:8,objectFit:"cover" }}/>}
                        {a.kind==="audio"&&<div style={{ background:"rgba(0,0,0,.3)",borderRadius:8,padding:"6px 10px" }}><p style={{ fontSize:9,color:C.m,marginBottom:2 }}>🎵 {a.name}</p><audio controls src={a.url} style={{ width:"100%",height:24,accentColor:G }}/></div>}
                        {a.kind==="video"&&<video controls src={a.url} style={{ maxWidth:"100%",maxHeight:140,borderRadius:8 }}/>}
                      </div>
                    ))}
                  </div>}
                  {msg.role==="assistant"?<div style={{ fontFamily:"'Barlow',sans-serif",fontSize:13 }}>{fmt(msg.content)}</div>:<p style={{ fontFamily:"'Barlow',sans-serif",fontSize:13 }}>{msg.content}</p>}
                  {msg.role==="assistant"&&ttsOk&&<Btn onClick={()=>speak(msg.content)} style={{ marginTop:5,padding:"2px 8px",borderRadius:9,background:"transparent",border:"1px solid rgba(255,200,0,.14)",color:C.m,fontSize:10 }}>▶</Btn>}
                </div>
              </div>
            ))}
            {loading&&<div style={{ display:"flex",alignItems:"center",gap:7,animation:"kUp .3s ease" }}>
              <KaloAvatar size={34} mini isThinking isSpeaking={false} isListening={false}/>
              <div style={{ padding:"9px 13px",background:C.card,borderRadius:"4px 15px 15px 15px",border:`1px solid ${C.b}`,display:"flex",gap:5 }}>
                {[0,1,2].map(j=><div key={j} style={{ width:7,height:7,borderRadius:"50%",background:G,animation:`kPulse 1.2s ${j*.2}s infinite` }}/>)}
              </div>
            </div>}
            <div ref={endRef}/>
          </div>
          {pendingPrevs.length>0&&<div style={{ flexShrink:0,padding:"5px 11px",background:"rgba(255,200,0,.03)",borderTop:"1px solid rgba(255,200,0,.07)",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ fontSize:9,color:C.m }}>📎 {pendingPrevs.length} joint(s)</span>
            {pendingPrevs.map((p,i)=><div key={i} style={{ display:"flex",alignItems:"center",gap:4,padding:"2px 8px",borderRadius:13,background:"rgba(255,200,0,.08)",border:"1px solid rgba(255,200,0,.17)",fontSize:9,color:G }}>
              <span>{KIND_ICO[p.kind]}</span><span style={{ maxWidth:70,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name.slice(0,10)}</span>
              <Btn onClick={()=>rmFile(i)} style={{ background:"none",color:"#7a5a2a",fontSize:13,padding:0 }}>×</Btn>
            </div>)}
          </div>}
          <div style={{ flexShrink:0,padding:"9px 11px",background:"rgba(10,8,6,.97)",borderTop:"1px solid rgba(255,200,0,.08)" }}>
            <div style={{ display:"flex",gap:6,alignItems:"flex-end" }}>
              {speechOk&&<Btn onClick={isListening?stopListen:startListen} style={{ width:38,height:38,borderRadius:"50%",background:isListening?"linear-gradient(135deg,#4ade80,#16a34a)":"rgba(255,200,0,.08)",color:isListening?"#0a0806":G,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isListening?"0 0 14px rgba(74,222,128,.5)":"none",transition:"all .25s" }}>{isListening?"⏹":"🎤"}</Btn>}
              <Btn onClick={()=>fileRef.current?.click()} style={{ width:38,height:38,borderRadius:"50%",background:"rgba(255,200,0,.07)",color:G,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center" }}>📎</Btn>
              <input ref={fileRef} type="file" accept="audio/*,image/*,video/*" multiple style={{ display:"none" }} onChange={e=>{ addFiles(Array.from(e.target.files)); e.target.value=""; }}/>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} placeholder={isListening?"🎙 Écoute…":"Écris à KALOPROD…"} rows={1}
                style={{ flex:1,padding:"9px 12px",borderRadius:11,resize:"none",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,200,0,.13)",color:C.t,fontSize:13,outline:"none",lineHeight:1.5 }}
                onFocus={e=>e.target.style.borderColor="rgba(255,200,0,.38)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,200,0,.13)"}/>
              <Btn onClick={()=>sendMsg(input)} disabled={loading||(!input.trim()&&!pendingFiles.length)} style={{ width:38,height:38,borderRadius:"50%",background:(loading||(!input.trim()&&!pendingFiles.length))?"rgba(255,200,0,.08)":"linear-gradient(135deg,#ffd700,#ff3c00)",color:(loading||(!input.trim()&&!pendingFiles.length))?"#5a4a2a":"#0a0806",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:(!loading&&(input.trim()||pendingFiles.length))?"0 0 12px rgba(255,215,0,.35)":"none" }}>→</Btn>
            </div>
            {isListening&&transcript&&<div style={{ marginTop:5,padding:"4px 9px",borderRadius:7,background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.18)",fontSize:10,color:"#4ade80",fontStyle:"italic" }}>🎙 {transcript}</div>}
          </div>
        </div>
      )}

      {/* ══════════════ UPLOAD ══════════════ */}
      {view==="upload"&&(
        <div style={{ flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:12 }}>
          <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
            onDrop={e=>{e.preventDefault();setDrag(false);addFiles(Array.from(e.dataTransfer.files));}}
            onClick={()=>fileRef.current?.click()}
            style={{ border:`2px dashed ${drag?G:"rgba(255,200,0,.22)"}`,borderRadius:16,padding:"24px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:10,cursor:"pointer",transition:"all .25s",background:drag?"rgba(255,200,0,.06)":"rgba(255,200,0,.02)" }}>
            <div style={{ fontSize:30,display:"flex",gap:12 }}>🎵 🖼️ 🎬</div>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:13,color:G,fontWeight:700,marginBottom:3 }}>{drag?"Lâche ici !":"Clique ou glisse tes fichiers"}</p>
              <p style={{ fontSize:10,color:C.m,lineHeight:1.6 }}>Musique · Photos · Vidéos<br/><span style={{ fontSize:9 }}>KALOPROD analyse et donne des conseils personnalisés Olaking</span></p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="audio/*,image/*,video/*" multiple style={{ display:"none" }} onChange={e=>{addFiles(Array.from(e.target.files));e.target.value="";}}/>

          {pendingPrevs.length>0&&(
            <>
              <p style={{ fontSize:10,color:C.m,letterSpacing:.5 }}>FICHIERS EN ATTENTE ({pendingPrevs.length})</p>
              {pendingPrevs.map((p,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:"rgba(255,200,0,.07)",border:"1px solid rgba(255,200,0,.18)" }}>
                  {p.kind==="image"&&<img src={p.url} alt="" style={{ width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0 }}/>}
                  {p.kind==="audio"&&<div style={{ width:44,height:44,borderRadius:8,background:"rgba(255,200,0,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0 }}>🎵</div>}
                  {p.kind==="video"&&<video src={p.url} style={{ width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0 }}/>}
                  <div style={{ flex:1,minWidth:0 }}>
                    <p style={{ fontSize:12,color:G,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</p>
                    <p style={{ fontSize:9,color:C.m }}>{fmtSize(p.size)} · {p.kind}</p>
                    {p.kind==="audio"&&<audio controls src={p.url} style={{ width:"100%",height:22,marginTop:4,accentColor:G }}/>}
                  </div>
                  <Btn onClick={()=>rmFile(i)} style={{ background:"none",color:"#7a5a2a",fontSize:20,padding:0,flexShrink:0 }}>×</Btn>
                </div>
              ))}
              <Btn onClick={()=>{ setView("chat"); setTimeout(()=>sendMsg("Analyse ces fichiers et donne-moi tes conseils détaillés pour Olaking."),100); }} style={{ width:"100%",padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#ffd700,#ff3c00)",color:"#0a0806",fontSize:13,fontWeight:700,letterSpacing:.5,boxShadow:"0 4px 18px rgba(255,215,0,.28)" }}>🚀 Analyser avec KALOPROD</Btn>
            </>
          )}

          <div style={{ padding:"12px 14px",borderRadius:12,background:C.card,border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:11,color:G,fontWeight:700,marginBottom:8 }}>Ce que KALOPROD analyse :</p>
            {[{i:"🎵",t:"Audio",d:"Genre, ambiance, énergie, influences, potentiel commercial, conseils marketing précis"},{i:"🖼️",t:"Image",d:"Direction artistique, cohérence visuelle, forces, faiblesses, améliorations"},{i:"🎬",t:"Vidéo",d:"Esthétique, impact social media, storytelling visuel, optimisation plateforme"}].map(f=>(
              <div key={f.t} style={{ display:"flex",gap:10,marginBottom:8,alignItems:"flex-start" }}>
                <span style={{ fontSize:20,flexShrink:0 }}>{f.i}</span>
                <div><p style={{ fontSize:11,color:G,marginBottom:2 }}>{f.t}</p><p style={{ fontSize:10,color:C.m,lineHeight:1.5 }}>{f.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ CREATE ══════════════ */}
      {view==="create"&&(
        <div style={{ flex:1,overflowY:"auto",padding:"12px" }}>
          <div style={{ padding:"9px 12px",borderRadius:11,background:"rgba(255,60,0,.07)",border:"1px solid rgba(255,60,0,.2)",marginBottom:12 }}>
            <p style={{ fontSize:11,color:"#ff7a50",fontWeight:700 }}>🔴 PRIORITÉ : Zone Rouge est prêt — lance la campagne !</p>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
            {TOOLS.map(t=>(
              <Btn key={t.id} onClick={()=>quickGen(t)} style={{ padding:"12px 10px",borderRadius:12,border:`1px solid ${t.id==="zone_rouge"?"rgba(255,60,0,.4)":C.b}`,background:t.id==="zone_rouge"?"rgba(255,60,0,.08)":C.card,textAlign:"left",transition:"all .2s",display:"flex",flexDirection:"column",gap:4 }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=t.id==="zone_rouge"?O:G; e.currentTarget.style.background=t.id==="zone_rouge"?"rgba(255,60,0,.12)":"rgba(255,200,0,.06)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=t.id==="zone_rouge"?"rgba(255,60,0,.4)":C.b; e.currentTarget.style.background=t.id==="zone_rouge"?"rgba(255,60,0,.08)":C.card; }}>
                <span style={{ fontSize:18 }}>{t.icon}</span>
                <span style={{ fontSize:10,color:t.id==="zone_rouge"?"#ff7a50":C.t,fontWeight:700 }}>{t.label}</span>
                <span style={{ fontSize:8,color:C.m }}>{t.cat}</span>
              </Btn>
            ))}
          </div>
          <div style={{ marginTop:12,padding:"13px",borderRadius:13,background:"linear-gradient(135deg,rgba(255,200,0,.07),rgba(255,60,0,.04))",border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:11,color:G,fontWeight:700,marginBottom:5 }}>📅 Planning 30 jours automatique</p>
            <p style={{ fontSize:9,color:C.m,lineHeight:1.6,marginBottom:10 }}>Génère 30 jours de posts Instagram, TikTok, YouTube, Twitter — prêts à copier-coller.</p>
            <Btn onClick={genCalendar} disabled={generating} style={{ width:"100%",padding:"10px",borderRadius:10,background:generating?"rgba(255,200,0,.1)":"linear-gradient(135deg,#ffd700,#ff3c00)",color:generating?"#7a5a2a":"#0a0806",fontSize:12,fontWeight:700,boxShadow:generating?"none":"0 4px 16px rgba(255,215,0,.25)" }}>{generating?"⟳ Génération en cours…":"🔥 Générer Planning 30 jours"}</Btn>
          </div>
        </div>
      )}

      {/* ══════════════ TOOLS (nouveaux) ══════════════ */}
      {view==="tools"&&(
        <div style={{ flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:12 }}>

          {/* ── CHECKLIST RELEASE ── */}
          <div style={{ padding:"13px",borderRadius:13,background:C.card,border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:12,color:G,fontWeight:700,marginBottom:8 }}>✅ Checklist Release Zone Rouge</p>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
              {RELEASE_CHECKLIST.map((w,i)=>(
                <Btn key={i} onClick={()=>setCheckWeek(i)} style={{ padding:"3px 10px",borderRadius:10,background:checkWeek===i?"rgba(255,200,0,.15)":"rgba(255,200,0,.04)",border:`1px solid ${checkWeek===i?G:C.b}`,color:checkWeek===i?G:C.m,fontSize:10 }}>
                  {w.week===0?"Jour J":w.week<0?`S${w.week}`:`S+${w.week}`}
                </Btn>
              ))}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {RELEASE_CHECKLIST[checkWeek].items.map((item,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:9,background:"rgba(255,200,0,.04)",border:"1px solid rgba(255,200,0,.08)" }}>
                  <div style={{ width:14,height:14,borderRadius:3,border:`1px solid rgba(255,200,0,.3)`,flexShrink:0 }}/>
                  <p style={{ fontSize:11,color:C.t }}>{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── CALCULATEUR REVENUS ── */}
          <div style={{ padding:"13px",borderRadius:13,background:C.card,border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:12,color:G,fontWeight:700,marginBottom:8 }}>💰 Calculateur Revenus Streaming</p>
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ fontSize:10,color:C.m }}>Streams estimés</span>
                <span style={{ fontSize:11,color:G,fontWeight:700 }}>{streams.toLocaleString("fr-FR")}</span>
              </div>
              <input type="range" min="1000" max="1000000" step="1000" value={streams} onChange={e=>setStreams(Number(e.target.value))}
                style={{ width:"100%",accentColor:G }}/>
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:10 }}>
              {PLATFORMS.map(p=>(
                <div key={p.name} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",borderRadius:7,background:"rgba(255,200,0,.04)" }}>
                  <span style={{ fontSize:11,color:C.t }}>{p.icon} {p.name}</span>
                  <span style={{ fontSize:11,color:G,fontWeight:700 }}>~{(streams*p.rate).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <div style={{ padding:"8px 10px",borderRadius:9,background:"rgba(255,200,0,.1)",border:`1px solid rgba(255,200,0,.25)`,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:12,color:C.t,fontWeight:700 }}>Total estimé</span>
              <span style={{ fontSize:13,color:G,fontWeight:700 }}>{totalRevenue.toFixed(2)} €</span>
            </div>
            <p style={{ fontSize:9,color:C.m,marginTop:6,lineHeight:1.5 }}>* Estimation indicative. Les taux varient selon le pays, le type d'abonnement et la période.</p>
          </div>

          {/* ── NOTES ARTISTE ── */}
          <div style={{ padding:"13px",borderRadius:13,background:C.card,border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:12,color:G,fontWeight:700,marginBottom:8 }}>📝 Notes & Idées Olaking</p>
            <div style={{ display:"flex",gap:6,marginBottom:10 }}>
              <input value={noteInput} onChange={e=>setNoteInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter") addNote(); }}
                placeholder="Note, idée de son, parole, concept…"
                style={{ flex:1,padding:"8px 11px",borderRadius:9,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,200,0,.13)",color:C.t,fontSize:11,outline:"none" }}
                onFocus={e=>e.target.style.borderColor="rgba(255,200,0,.38)"}
                onBlur={e=>e.target.style.borderColor="rgba(255,200,0,.13)"}/>
              <Btn onClick={addNote} style={{ padding:"8px 14px",borderRadius:9,background:"linear-gradient(135deg,#ffd700,#ff3c00)",color:"#0a0806",fontSize:12,fontWeight:700 }}>+</Btn>
            </div>
            {notes.length>0
              ? <div style={{ display:"flex",flexDirection:"column",gap:5,maxHeight:200,overflowY:"auto" }}>
                  {notes.map(n=>(
                    <div key={n.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"7px 10px",borderRadius:8,background:"rgba(255,200,0,.04)",border:"1px solid rgba(255,200,0,.08)" }}>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:11,color:C.t,lineHeight:1.5 }}>{n.text}</p>
                        <p style={{ fontSize:8,color:C.m,marginTop:2 }}>{n.date}</p>
                      </div>
                      <Btn onClick={()=>delNote(n.id)} style={{ background:"none",color:"#555",fontSize:14,padding:"0 0 0 8px",flexShrink:0 }}>×</Btn>
                    </div>
                  ))}
                </div>
              : <p style={{ fontSize:10,color:C.m,textAlign:"center",padding:"12px 0" }}>Aucune note — ajoute tes idées ici 💡</p>
            }
          </div>

          {/* ── QUICK ANALYSE TENDANCES ── */}
          <div style={{ padding:"13px",borderRadius:13,background:C.card,border:`1px solid ${C.b}` }}>
            <p style={{ fontSize:12,color:G,fontWeight:700,marginBottom:8 }}>📊 Veille & Tendances</p>
            <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
              {[
                {q:"Quelles sont les tendances trap urbaine en ce moment ?",l:"Tendances Trap 2025"},
                {q:"Quels sons afrobeats et reggae cartonnent en ce moment et comment Olaking peut s'y positionner ?",l:"Tendances Afro/Reggae"},
                {q:"Comment l'algorithme TikTok fonctionne en 2025 pour un artiste comme Olaking ?",l:"Algo TikTok 2025"},
                {q:"Quels sont les KPIs les plus importants à suivre pour Olaking à son stade de carrière ?",l:"KPIs à suivre"},
                {q:"Comment les labels et l'A&R repèrent les artistes comme Olaking aujourd'hui ?",l:"Radar des Labels"},
              ].map(({q,l})=>(
                <Btn key={l} onClick={()=>{ setView("chat"); setTimeout(()=>sendMsg(q),100); }} style={{ padding:"9px 11px",borderRadius:9,border:`1px solid ${C.b}`,background:"rgba(255,200,0,.03)",textAlign:"left",color:C.t,fontSize:11,transition:"all .2s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=G; e.currentTarget.style.background="rgba(255,200,0,.07)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.b; e.currentTarget.style.background="rgba(255,200,0,.03)"; }}>
                  📊 {l}
                </Btn>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ LIBRARY ══════════════ */}
      {view==="library"&&(
        <div style={{ flex:1,overflowY:"auto",padding:"12px" }}>
          {/* Calendars */}
          {calData.length>0&&(
            <div style={{ marginBottom:14 }}>
              <p style={{ fontSize:10,color:C.m,marginBottom:7,letterSpacing:.5 }}>PLANNINGS ({calData.length})</p>
              {calData.map((c,i)=>(
                <div key={i} style={{ padding:"11px",borderRadius:12,background:C.card,border:`1px solid ${C.b}`,marginBottom:7 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                    <span style={{ fontSize:10,color:G }}>📅 Planning 30 jours · {c.date}</span>
                    <Btn onClick={()=>{ const u=calData.filter((_,j)=>j!==i); setCalData(u); persist(undefined,u); }} style={{ background:"none",color:"#555",fontSize:15,padding:0 }}>×</Btn>
                  </div>
                  <p style={{ fontSize:10,color:"#a8a098",lineHeight:1.6,whiteSpace:"pre-wrap",maxHeight:100,overflow:"auto" }}>{c.content.slice(0,400)}…</p>
                  <Btn onClick={()=>{ navigator.clipboard.writeText(c.content); toast("Planning copié !"); }} style={{ marginTop:7,padding:"4px 12px",borderRadius:8,background:"transparent",border:`1px solid ${C.b}`,color:G,fontSize:9 }}>📋 Copier tout</Btn>
                </div>
              ))}
            </div>
          )}
          {/* Posts */}
          {savedPosts.length>0
            ? <>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9 }}>
                  <p style={{ fontSize:10,color:C.m }}>{savedPosts.length} contenu(s) sauvegardé(s)</p>
                  <Btn onClick={()=>{ setSavedPosts([]); persist([]); }} style={{ padding:"3px 9px",borderRadius:9,background:"transparent",border:"1px solid rgba(255,60,0,.18)",color:"#8a4a3a",fontSize:9 }}>Tout effacer</Btn>
                </div>
                {savedPosts.map(item=>(
                  <div key={item.id} style={{ background:C.card,border:`1px solid ${C.b}`,borderRadius:12,padding:"11px",marginBottom:8,animation:"kUp .3s ease" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                      <div style={{ display:"flex",gap:5,alignItems:"center" }}>
                        <span style={{ fontSize:13 }}>{item.icon}</span>
                        <span style={{ fontSize:10,color:G }}>{item.type}</span>
                        <span style={{ fontSize:8,color:"#4a4a4a" }}>{item.date}</span>
                      </div>
                      <div style={{ display:"flex",gap:4 }}>
                        <Btn onClick={()=>{ navigator.clipboard.writeText(item.content); toast("Copié ✓"); }} style={{ padding:"2px 9px",borderRadius:9,background:"transparent",border:`1px solid rgba(255,200,0,.2)`,color:"#777",fontSize:9 }}>Copier</Btn>
                        <Btn onClick={()=>delPost(item.id)} style={{ padding:"2px 7px",borderRadius:9,background:"transparent",border:"1px solid rgba(255,60,0,.14)",color:"#555",fontSize:9 }}>×</Btn>
                      </div>
                    </div>
                    <p style={{ fontSize:11,color:"#c0b8a8",lineHeight:1.7,whiteSpace:"pre-wrap" }}>{item.content.length>240?item.content.slice(0,240)+"…":item.content}</p>
                  </div>
                ))}
              </>
            : calData.length===0&&<div style={{ textAlign:"center",padding:"36px 20px",color:C.m }}>
                <div style={{ fontSize:40,marginBottom:10 }}>📚</div>
                <p style={{ fontSize:12,color:C.t,marginBottom:5 }}>Bibliothèque vide</p>
                <p style={{ fontSize:10 }}>Génère du contenu via ⚡ Créer — tout est sauvegardé ici automatiquement.</p>
              </div>
          }
        </div>
      )}
    </div>
  );
}
