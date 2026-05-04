import { useState, useEffect, useRef, useCallback } from "react";

const OMDB_KEY = "6931bb70";
const OMDB = "https://www.omdbapi.com/";

// Netlify server-side proxy — fetches image from server, not browser
const P = (url) =>
  url && url !== "N/A"
    ? `/.netlify/functions/proxy?url=${encodeURIComponent(url)}`
    : null;

// Open YouTube trailer in new tab
const trailer = (title) =>
  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(title + " official trailer")}`, "_blank");

const T = {
  bn: {
    search:"Movie, Series, Anime খুঁজুন...", btn:"খুঁজুন",
    loading:"লোড হচ্ছে...", notFound:"কোনো ফলাফল পাওয়া যায়নি",
    tryOther:"অন্য কিছু search করুন", found:"টি পাওয়া গেছে",
    back:"← ফিরে যাও", seeMore:"আরো দেখুন →",
    showing:"দেখানো হচ্ছে", of:"এর মধ্যে",
    watchTrailer:"🎬 Trailer", watchYT:"▶ YouTube",
    addWL:"+ Watchlist", removeWL:"✓ Saved",
    myWL:"📌 Watchlist", wlEmpty:"Watchlist খালি",
    savedMsg:"Watchlist এ যোগ হয়েছে ✓", removedMsg:"Watchlist থেকে সরানো হয়েছে",
    resultsFor:"এর ফলাফল",
    year:"📅 সাল", runtime:"⏱ সময়", country:"🌍 দেশ",
    language:"🗣 ভাষা", director:"🎬 পরিচালক", writer:"✍️ লেখক",
    actors:"👥 অভিনেতা", awards:"🏆 পুরস্কার",
    boxOffice:"💰 Box Office", production:"🏢 Production",
    imdb:"⭐ IMDB", votes:"ভোট",
    h1:"পর্দায় তৈরি সর্বকালের সেরা সুপারহিরো যুদ্ধ।",
    h2:"মানবজাতির সবচেয়ে নিষ্ঠুর যুদ্ধের শেষ অধ্যায়।",
    h3:"৪৫৬ জন খেলোয়াড়। একটি মারাত্মক খেলা।",
    h4:"ভারতের সবচেয়ে বড় অ্যাকশন ব্লকবাস্টার।",
  },
  en: {
    search:"Search movies, series, anime...", btn:"Search",
    loading:"Loading...", notFound:"No results found",
    tryOther:"Try a different search", found:"found",
    back:"← Go back", seeMore:"See More →",
    showing:"Showing", of:"of",
    watchTrailer:"🎬 Trailer", watchYT:"▶ YouTube",
    addWL:"+ Watchlist", removeWL:"✓ Saved",
    myWL:"📌 Watchlist", wlEmpty:"Watchlist is empty",
    savedMsg:"Added to Watchlist ✓", removedMsg:"Removed from Watchlist",
    resultsFor:"Results for",
    year:"📅 Year", runtime:"⏱ Runtime", country:"🌍 Country",
    language:"🗣 Language", director:"🎬 Director", writer:"✍️ Writer",
    actors:"👥 Actors", awards:"🏆 Awards",
    boxOffice:"💰 Box Office", production:"🏢 Production",
    imdb:"⭐ IMDB", votes:"Votes",
    h1:"The greatest superhero battle ever assembled on screen.",
    h2:"The final chapter of humanity's most brutal war.",
    h3:"456 players. One deadly game. Zero mercy.",
    h4:"India's biggest action blockbuster returns.",
  },
};

const CATS = [
  {id:"latest",   label:{bn:"🆕 সর্বশেষ",   en:"🆕 Latest"},      q:"love",            type:"movie"},
  {id:"trending", label:{bn:"🔥 ট্রেন্ডিং",  en:"🔥 Trending"},    q:"mission impossible",type:"movie"},
  {id:"anime",    label:{bn:"🎌 অ্যানিমে",   en:"🎌 Anime"},       q:"anime",           type:"series"},
  {id:"hollywood",label:{bn:"🎬 হলিউড",      en:"🎬 Hollywood"},   q:"marvel",          type:"movie"},
  {id:"hindi",    label:{bn:"🇮🇳 হিন্দি",     en:"🇮🇳 Hindi"},      q:"salman khan",     type:"movie"},
  {id:"bangla",   label:{bn:"🇧🇩 বাংলা",      en:"🇧🇩 Bangla"},     q:"dhallywood",      type:"movie"},
  {id:"series",   label:{bn:"📺 ওয়েব সিরিজ", en:"📺 Web Series"},  q:"breaking bad",    type:"series"},
  {id:"korean",   label:{bn:"🌍 কোরিয়ান",    en:"🌍 Korean"},      q:"squid game",      type:"series"},
  {id:"turkish",  label:{bn:"🎭 তুর্কি",      en:"🎭 Turkish"},     q:"ertugrul",        type:"series"},
  {id:"marvel",   label:{bn:"⚡ মার্ভেল",     en:"⚡ Marvel"},      q:"marvel avengers", type:"movie"},
  {id:"dc",       label:{bn:"🦇 ডিসি",        en:"🦇 DC"},          q:"batman superman", type:"movie"},
  {id:"scifi",    label:{bn:"🚀 সাই-ফাই",     en:"🚀 Sci-Fi"},      q:"interstellar",    type:"movie"},
  {id:"horror",   label:{bn:"👻 হরর",          en:"👻 Horror"},      q:"conjuring",       type:"movie"},
  {id:"romance",  label:{bn:"💕 রোমান্স",     en:"💕 Romance"},     q:"titanic romance", type:"movie"},
  {id:"comedy",   label:{bn:"😂 কমেডি",       en:"😂 Comedy"},      q:"comedy funny",    type:"movie"},
  {id:"crime",    label:{bn:"🔫 ক্রাইম",      en:"🔫 Crime"},       q:"godfather crime", type:"movie"},
  {id:"drama",    label:{bn:"🎭 ড্রামা",       en:"🎭 Drama"},       q:"drama oscar",     type:"movie"},
  {id:"disney",   label:{bn:"🏰 ডিজনি",       en:"🏰 Disney"},      q:"disney pixar",    type:"movie"},
  {id:"doc",      label:{bn:"🎙 ডকু",          en:"🎙 Documentary"}, q:"national geographic",type:"movie"},
];

const HEROES = [
  {title:"Avengers: Endgame",year:"2019",genre:"Action · Sci-Fi",  dk:"h1",accent:"#6d28d9"},
  {title:"Attack on Titan",  year:"2023",genre:"Anime · Action",   dk:"h2",accent:"#15803d"},
  {title:"Squid Game",       year:"2021",genre:"Korean · Thriller",dk:"h3",accent:"#be123c"},
  {title:"Pathaan",          year:"2023",genre:"Hindi · Action",   dk:"h4",accent:"#c2410c"},
];

const GCOLS = {
  Action:["#3b0000","#dc2626"],Animation:["#00143b","#3b82f6"],
  Comedy:["#2d1500","#f59e0b"],Crime:["#1a1000","#d97706"],
  Drama:["#001520","#0ea5e9"],Horror:["#0a0010","#9333ea"],
  Romance:["#2d0020","#ec4899"],"Sci-Fi":["#001020","#06b6d4"],
  Thriller:["#0d0d0d","#6b7280"],default:["#0f172a","#e11d48"],
};
const gCol = (genre) => {
  const k = Object.keys(GCOLS).find(k => genre?.includes(k)) || "default";
  return GCOLS[k];
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
:root{--r:#e11d48;--r2:#be123c;--bg:#07070d;--s1:#0d0d1a;--s2:#131325;--s3:#1a1a2e;--bd:#22223a;--tx:#f0f0f8;--mt:#5a5a78}
body{background:var(--bg);font-family:'Inter',sans-serif;color:var(--tx);min-height:100vh}
::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg)}::-webkit-scrollbar-thumb{background:var(--r);border-radius:2px}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes sk{0%{background-position:-600px 0}100%{background-position:600px 0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes hIn{from{opacity:0;transform:translateX(-30px)}to{opacity:1;transform:none}}
@keyframes mIn{from{opacity:0;transform:scale(.88) translateY(20px)}to{opacity:1;transform:none}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes toast{0%{opacity:0;transform:translateX(-50%) translateY(18px)}15%,78%{opacity:1;transform:translateX(-50%) translateY(0)}100%{opacity:0;transform:translateX(-50%) translateY(-10px)}}
.app{min-height:100vh;background:var(--bg)}
.hdr{position:sticky;top:0;z-index:200;background:rgba(7,7,13,.97);backdrop-filter:blur(24px);border-bottom:1px solid var(--bd);height:64px;display:flex;align-items:center;padding:0 28px;gap:16px}
.logo{font-size:21px;font-weight:900;background:linear-gradient(135deg,#fff 0%,var(--r) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;cursor:pointer;user-select:none;white-space:nowrap;flex-shrink:0;transition:opacity .2s}
.logo:hover{opacity:.75}
.sform{flex:1;max-width:480px;display:flex}
.sinp{flex:1;background:var(--s2);border:1.5px solid var(--bd);border-radius:12px 0 0 12px;padding:10px 18px;color:var(--tx);font-size:13px;outline:none;font-family:'Inter',sans-serif;transition:border .2s,box-shadow .2s;min-width:0}
.sinp:focus{border-color:var(--r);box-shadow:0 0 0 3px rgba(225,29,72,.1)}
.sinp::placeholder{color:var(--mt)}
.sbtn{background:var(--r);border:none;border-radius:0 12px 12px 0;padding:10px 22px;color:#fff;font-weight:700;font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:background .2s}
.sbtn:hover{background:var(--r2)}
.hright{margin-left:auto;display:flex;align-items:center;gap:10px;flex-shrink:0}
.lang{display:flex;background:var(--s2);border:1px solid var(--bd);border-radius:10px;overflow:hidden}
.lb{padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;border:none;background:transparent;color:var(--mt);font-family:'Inter',sans-serif;transition:all .18s}
.lb.on{background:var(--r);color:#fff}
.wlbtn{background:var(--s2);border:1px solid var(--bd);border-radius:10px;padding:7px 14px;font-size:12px;font-weight:600;color:var(--mt);cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;transition:all .2s}
.wlbtn:hover,.wlbtn.on{border-color:var(--r);color:var(--r)}
.hero{position:relative;height:500px;overflow:hidden;display:flex;align-items:flex-end}
.hbg{position:absolute;inset:0;transition:background 1.5s ease}
.hov{position:absolute;inset:0;background:linear-gradient(to top,var(--bg) 0%,rgba(7,7,13,.38) 50%,transparent 100%)}
.hsv{position:absolute;inset:0;background:linear-gradient(to right,var(--bg) 0%,transparent 62%)}
.hc{position:relative;z-index:2;padding:0 36px 52px;max-width:640px;animation:hIn .65s ease}
.htag{display:inline-flex;gap:5px;align-items:center;background:rgba(225,29,72,.12);border:1px solid rgba(225,29,72,.25);color:var(--r);font-size:10px;font-weight:700;letter-spacing:2px;padding:5px 14px;border-radius:20px;margin-bottom:16px;text-transform:uppercase}
.htitle{font-size:50px;font-weight:900;line-height:1.06;margin-bottom:12px;letter-spacing:-1.2px}
.hmeta{display:flex;gap:18px;margin-bottom:14px;flex-wrap:wrap}
.hmeta span{font-size:13px;color:#b0b0c8;display:flex;align-items:center;gap:4px}
.hdesc{color:#8888aa;font-size:14px;line-height:1.82;margin-bottom:24px;max-width:460px}
.hbtns{display:flex;gap:12px;flex-wrap:wrap}
.btnr{background:linear-gradient(135deg,var(--r),var(--r2));color:#fff;border:none;border-radius:12px;padding:12px 26px;font-weight:700;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:7px;transition:transform .2s,box-shadow .2s;font-family:'Inter',sans-serif}
.btnr:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(225,29,72,.4)}
.btng{background:rgba(255,255,255,.07);color:#ddd;border:1.5px solid rgba(255,255,255,.14);border-radius:12px;padding:12px 22px;font-weight:600;cursor:pointer;font-size:14px;transition:all .2s;font-family:'Inter',sans-serif}
.btng:hover{background:rgba(255,255,255,.14)}
.hdots{position:absolute;bottom:18px;right:32px;z-index:3;display:flex;gap:7px;align-items:center}
.dot{width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,.2);cursor:pointer;transition:all .3s}
.dot.on{width:28px;background:var(--r)}
.cats{padding:20px 28px 4px;display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}
.cats::-webkit-scrollbar{display:none}
.cp{flex-shrink:0;padding:8px 18px;border-radius:10px;border:1.5px solid var(--bd);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap;background:transparent;color:var(--mt)}
.cp.on{background:var(--r);border-color:var(--r);color:#fff;box-shadow:0 4px 18px rgba(225,29,72,.28)}
.cp:not(.on):hover{border-color:rgba(225,29,72,.4);color:var(--r)}
.sec{padding:18px 28px 8px}
.shdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:8px}
.stitle{font-size:18px;font-weight:800;letter-spacing:-.3px}
.ssub{font-size:12px;color:var(--mt);background:var(--s2);border:1px solid var(--bd);padding:4px 10px;border-radius:6px}
.backbtn{background:none;border:none;color:var(--mt);font-size:13px;cursor:pointer;font-family:'Inter',sans-serif;transition:color .2s;padding:0;font-weight:600}
.backbtn:hover{color:var(--r)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:16px}
.card{background:var(--s1);border-radius:14px;overflow:hidden;cursor:pointer;border:1px solid var(--bd);transition:transform .22s,box-shadow .22s,border-color .22s;animation:fadeUp .4s ease both}
.card:hover{transform:translateY(-8px) scale(1.018);box-shadow:0 20px 52px rgba(0,0,0,.7);border-color:var(--r)}
.pw{position:relative;overflow:hidden;background:var(--s3)}
.pimg{width:100%;height:250px;object-fit:cover;display:block;transition:transform .4s}
.card:hover .pimg{transform:scale(1.07)}
.sk{width:100%;height:250px;background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:600px 100%;animation:sk 1.8s ease-in-out infinite}
.ph{width:100%;height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden}
.ph-glow{position:absolute;inset:0}
.ph-l{font-size:68px;font-weight:900;opacity:.15;line-height:1}
.ph-n{font-size:12px;font-weight:700;opacity:.45;text-align:center;padding:0 14px;line-height:1.5}
.ph-y{font-size:11px;opacity:.3;margin-top:2px}
.rtag{position:absolute;top:9px;right:9px;background:rgba(0,0,0,.9);backdrop-filter:blur(6px);color:#fbbf24;font-size:11px;font-weight:700;padding:3px 8px;border-radius:7px;border:1px solid rgba(251,191,36,.2)}
.ttag{position:absolute;top:9px;left:9px;background:rgba(225,29,72,.92);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:7px}
.cb{padding:12px}
.ct{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.cm{font-size:11px;color:var(--mt);display:flex;justify-content:space-between;align-items:center}
.smwrap{padding:28px 28px 8px;display:flex;flex-direction:column;align-items:center;gap:8px}
.smbtn{background:transparent;border:1.5px solid var(--bd);color:var(--mt);border-radius:12px;padding:12px 44px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;transition:all .22s;display:flex;align-items:center;gap:8px}
.smbtn:hover:not(:disabled){border-color:var(--r);color:var(--r);background:rgba(225,29,72,.05)}
.smbtn:disabled{opacity:.35;cursor:not-allowed}
.sminfo{font-size:11px;color:var(--mt)}
.lw{display:flex;flex-direction:column;align-items:center;padding:80px 20px;gap:14px}
.sp{width:42px;height:42px;border:3px solid var(--s3);border-top-color:var(--r);border-radius:50%;animation:spin .7s linear infinite}
.lt{color:var(--mt);font-size:13px;animation:pulse 1.6s infinite}
.empty{text-align:center;padding:80px 20px}
.ei{font-size:50px;margin-bottom:16px;animation:float 3s ease-in-out infinite;display:block}
.empty h3{font-size:18px;font-weight:700;margin-bottom:7px}
.empty p{font-size:13px;color:var(--mt)}
.mover{position:fixed;inset:0;background:rgba(0,0,0,.94);z-index:500;display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(18px);animation:fadeIn .2s}
.mod{background:var(--s1);border-radius:20px;max-width:600px;width:100%;border:1px solid var(--bd);overflow:hidden;animation:mIn .28s ease;position:relative;max-height:94vh;overflow-y:auto}
.mhero{position:relative;height:240px;overflow:hidden;flex-shrink:0}
.mhbg{width:100%;height:100%;object-fit:cover;filter:blur(20px) brightness(.25);transform:scale(1.15)}
.mhph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;opacity:.08}
.mhov{position:absolute;inset:0;background:linear-gradient(to top,var(--s1) 0%,transparent 100%)}
.mposter{position:absolute;bottom:-50px;left:24px;width:112px;height:168px;object-fit:cover;border-radius:12px;border:3px solid var(--s1);box-shadow:0 10px 36px rgba(0,0,0,.7);animation:float 4s ease-in-out infinite}
.mph{position:absolute;bottom:-50px;left:24px;width:112px;height:168px;border-radius:12px;border:3px solid var(--s1);display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:900;box-shadow:0 10px 36px rgba(0,0,0,.7);animation:float 4s ease-in-out infinite}
.mcl{position:absolute;top:12px;right:12px;background:rgba(0,0,0,.7);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.1);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;transition:background .2s;z-index:3}
.mcl:hover{background:var(--r)}
.mbody{padding:64px 24px 24px}
.mtype{display:inline-block;background:rgba(225,29,72,.13);border:1px solid rgba(225,29,72,.26);color:var(--r);font-size:10px;font-weight:700;padding:3px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
.mtitle{font-size:22px;font-weight:900;letter-spacing:-.4px;margin-bottom:6px;line-height:1.2}
.msub{font-size:13px;color:var(--mt);margin-bottom:12px}
.mrat{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;background:var(--s3);padding:12px 14px;border-radius:10px;border:1px solid var(--bd)}
.stars{color:#fbbf24;font-size:15px;letter-spacing:1px}
.rn{font-size:18px;font-weight:900;color:#fbbf24}
.rt{color:var(--mt);font-size:12px}
.rv{color:var(--mt);font-size:11px;margin-left:auto}
.mtags{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:14px}
.mtag{background:var(--s3);border:1px solid var(--bd);color:#ccc;font-size:11px;font-weight:600;padding:5px 12px;border-radius:8px}
.mplot-label{font-size:11px;color:var(--mt);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;font-weight:700}
.mplot{color:#9999bb;font-size:13px;line-height:1.85;margin-bottom:18px;padding:16px;background:var(--s3);border-radius:12px;border-left:3px solid var(--r)}
.mdet{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px}
.md{background:var(--s3);border-radius:10px;padding:12px 14px;border:1px solid var(--bd)}
.dl{font-size:10px;color:var(--mt);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px;font-weight:600}
.dv{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tx)}
.macts{display:flex;gap:9px;flex-wrap:wrap}
.macts .btnr{flex:1;justify-content:center;min-width:120px}
.btn2{border-radius:12px;padding:12px 16px;font-weight:600;cursor:pointer;font-size:13px;transition:all .2s;font-family:'Inter',sans-serif;white-space:nowrap;border:1.5px solid}
.btn-yt{background:rgba(255,0,0,.1);border-color:rgba(255,0,0,.3);color:#ff6b6b}
.btn-yt:hover{background:rgba(255,0,0,.2)}
.btn-wl{background:var(--s3);border-color:var(--bd);color:#ccc}
.btn-wl:hover,.btn-wl.saved{border-color:var(--r);color:var(--r);background:rgba(225,29,72,.1)}
.wlpanel{position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:500;display:flex;align-items:center;justify-content:center;padding:14px;backdrop-filter:blur(18px);animation:fadeIn .2s}
.wlbox{background:var(--s1);border-radius:20px;max-width:480px;width:100%;border:1px solid var(--bd);overflow:hidden;animation:mIn .28s ease;max-height:90vh;display:flex;flex-direction:column}
.wlhdr{padding:18px 20px 14px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.wlhdr h3{font-size:16px;font-weight:800}
.wlbody{overflow-y:auto;padding:12px;flex:1}
.wlitem{display:flex;gap:12px;align-items:center;padding:10px;background:var(--s3);border-radius:10px;margin-bottom:8px;cursor:pointer;transition:all .2s;border:1px solid transparent}
.wlitem:hover{border-color:var(--r);background:var(--s2)}
.wlpimg{width:46px;height:68px;object-fit:cover;border-radius:8px;flex-shrink:0;background:var(--s2)}
.wlph{width:46px;height:68px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900}
.wlinfo{flex:1;min-width:0}
.wltitle{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px}
.wlyear{font-size:11px;color:var(--mt)}
.wlrm{background:none;border:none;color:var(--mt);cursor:pointer;font-size:16px;padding:4px;border-radius:6px;transition:color .2s;flex-shrink:0}
.wlrm:hover{color:var(--r)}
.wlempty{text-align:center;padding:44px 20px;color:var(--mt)}
.wlempty span{font-size:40px;display:block;margin-bottom:12px}
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:var(--s2);border:1px solid var(--bd);color:var(--tx);padding:12px 24px;border-radius:12px;font-size:13px;font-weight:600;z-index:999;animation:toast 3.2s ease forwards;pointer-events:none;white-space:nowrap;box-shadow:0 10px 36px rgba(0,0,0,.6)}
.foot{text-align:center;padding:30px 20px;color:var(--mt);font-size:12px;border-top:1px solid var(--bd);margin-top:20px;line-height:2.2}
@media(max-width:700px){
  .hdr{padding:0 12px;gap:10px;height:58px}.wlbtn{display:none}
  .sbtn{padding:10px 14px;font-size:12px}
  .hero{height:auto;min-height:360px}.hc{padding:0 16px 44px}.htitle{font-size:30px}
  .cats,.sec,.smwrap{padding-left:12px;padding-right:12px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px}
  .mdet{grid-template-columns:1fr}.mod{border-radius:16px}.lb{padding:6px 10px}
}
`;

/* ── POSTER — Netlify proxy ── */
function Poster({ poster, title, year, genre }) {
  const cols = gCol(genre);
  const [err, setErr] = useState(false);
  const src = poster && poster !== "N/A"
    ? `/.netlify/functions/proxy?url=${encodeURIComponent(poster)}`
    : null;

  if (!src || err) return (
    <div className="ph" style={{background:`linear-gradient(150deg,${cols[0]},${cols[1]}35)`}}>
      <div className="ph-glow" style={{background:`radial-gradient(ellipse at 50% 30%,${cols[1]}60,transparent 65%)`}}/>
      <div className="ph-l" style={{color:cols[1]}}>{title?.[0]?.toUpperCase()||"?"}</div>
      <div className="ph-n" style={{color:"#e0e0e0"}}>{title?.slice(0,20)}</div>
      {year&&<div className="ph-y" style={{color:cols[1]}}>{year}</div>}
    </div>
  );

  return (
    <img
      className="pimg"
      src={src}
      alt={title}
      style={{width:"100%",height:"250px",objectFit:"cover",display:"block"}}
      onError={()=>setErr(true)}
    />
  );
}

const sortByYear = (arr) => [...arr].sort((a,b) => (parseInt(b.Year)||0)-(parseInt(a.Year)||0));

export default function App() {
  const [lang, setLang] = useState("bn");
  const t = T[lang];
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cat, setCat] = useState(CATS[0]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [page, setPage] = useState(1);
  const [totalRes, setTotalRes] = useState(0);
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cz_wl")||"[]"); } catch { return []; }
  });
  const [showWL, setShowWL] = useState(false);
  const [toast, setToast] = useState(null);
  const heroTimer = useRef(null);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(null);
    setTimeout(() => setToast(msg), 10);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const toggleWL = (m) => {
    setWatchlist(prev => {
      const exists = prev.find(x => x.imdbID === m.imdbID);
      const next = exists ? prev.filter(x => x.imdbID !== m.imdbID) : [m, ...prev];
      try { localStorage.setItem("cz_wl", JSON.stringify(next)); } catch {}
      showToast(exists ? t.removedMsg : t.savedMsg);
      return next;
    });
  };
  const isInWL = (id) => watchlist.some(m => m.imdbID === id);

  const fetchMovies = useCallback(async (q, type, pg, append) => {
    if (pg===1) { setLoading(true); if (!append) setMovies([]); }
    else setLoadingMore(true);
    try {
      const r = await fetch(`${OMDB}?s=${encodeURIComponent(q)}&apikey=${OMDB_KEY}&type=${type}&page=${pg}`);
      const d = await r.json();
      if (d.Search) {
        setTotalRes(parseInt(d.totalResults)||0);
        const details = await Promise.allSettled(
          d.Search.map(m => fetch(`${OMDB}?i=${m.imdbID}&apikey=${OMDB_KEY}&plot=full`).then(x=>x.json()))
        );
        const valid = details.filter(r=>r.status==="fulfilled"&&r.value.Response!=="False").map(r=>r.value);
        setMovies(prev => append ? [...prev, ...sortByYear(valid)] : sortByYear(valid));
      } else { setTotalRes(0); if (!append) setMovies([]); }
    } catch { if (!append) setMovies([]); }
    setLoading(false); setLoadingMore(false);
  }, []);

  useEffect(() => { setPage(1); fetchMovies(cat.q, cat.type, 1, false); }, [cat]);

  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIdx(i=>(i+1)%HEROES.length), 6000);
    return () => clearInterval(heroTimer.current);
  }, []);

  const doSearch = (e) => {
    e?.preventDefault();
    const q = input.trim(); if (!q) return;
    setQuery(q); setSearchMode(true); setPage(1);
    fetchMovies(q, "", 1, false);
  };

  const goHome = () => {
    setSearchMode(false); setInput(""); setQuery(""); setPage(1);
    fetchMovies(cat.q, cat.type, 1, false);
  };

  const hero = HEROES[heroIdx];
  const hasMore = movies.length < totalRes && totalRes > 0;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="logo" onClick={goHome}>🎬 CineZone</div>
          <form className="sform" onSubmit={doSearch}>
            <input className="sinp" placeholder={t.search} value={input} onChange={e=>setInput(e.target.value)}/>
            <button className="sbtn" type="submit">{t.btn}</button>
          </form>
          <div className="hright">
            <div className="lang">
              <button className={`lb ${lang==="bn"?"on":""}`} onClick={()=>setLang("bn")}>বাং</button>
              <button className={`lb ${lang==="en"?"on":""}`} onClick={()=>setLang("en")}>EN</button>
            </div>
            <button className={`wlbtn ${showWL?"on":""}`} onClick={()=>setShowWL(true)}>
              {t.myWL}{watchlist.length>0?` (${watchlist.length})`:""}
            </button>
          </div>
        </header>

        {!searchMode && (
          <div className="hero">
            <div className="hbg" style={{background:`radial-gradient(ellipse at 18% 58%,${hero.accent}60 0%,${hero.accent}22 42%,var(--bg) 78%)`}}/>
            <div className="hov"/><div className="hsv"/>
            <div className="hc" key={heroIdx}>
              <div className="htag">✦ {hero.genre}</div>
              <h1 className="htitle">{hero.title}</h1>
              <div className="hmeta">
                <span>📅 {hero.year}</span><span>⭐ IMDB Top</span><span>🔥 Popular</span>
              </div>
              <p className="hdesc">{t[hero.dk]}</p>
              <div className="hbtns">
                <button className="btnr" onClick={()=>trailer(hero.title)}>{t.watchTrailer}</button>
                <button className="btng" onClick={()=>{setInput(hero.title);setQuery(hero.title);setSearchMode(true);fetchMovies(hero.title,"",1,false);}}>🔍 Details</button>
              </div>
            </div>
            <div className="hdots">
              {HEROES.map((_,i)=><div key={i} className={`dot ${i===heroIdx?"on":""}`} onClick={()=>setHeroIdx(i)}/>)}
            </div>
          </div>
        )}

        {!searchMode && (
          <div className="cats">
            {CATS.map(c=>(
              <button key={c.id} className={`cp ${cat.id===c.id?"on":""}`}
                onClick={()=>{setCat(c);setSearchMode(false);setInput("");setQuery("");}}>
                {c.label[lang]}
              </button>
            ))}
          </div>
        )}

        <div className="sec">
          <div className="shdr">
            <div className="stitle">{searchMode?`🔍 "${query}" ${t.resultsFor}`:cat.label[lang]}</div>
            {searchMode
              ? <button className="backbtn" onClick={goHome}>{t.back}</button>
              : totalRes>0 && <span className="ssub">{totalRes}+ {t.found}</span>
            }
          </div>
          {loading ? (
            <div className="lw"><div className="sp"/><p className="lt">{t.loading}</p></div>
          ) : movies.length===0 ? (
            <div className="empty"><span className="ei">🎬</span><h3>{t.notFound}</h3><p>{t.tryOther}</p></div>
          ) : (
            <>
              <div className="grid">
                {movies.map((m,i)=>(
                  <div key={m.imdbID+i} className="card" style={{animationDelay:`${(i%10)*.03}s`}} onClick={()=>setSelected(m)}>
                    <div className="pw">
                      <img
  src={`/.netlify/functions/proxy?url=${encodeURIComponent(m.Poster)}`}
  alt={m.Title}
  style={{width:"100%",height:"250px",objectFit:"cover",display:"block"}}
  onError={(e)=>{e.target.style.display="none";}}
/>
                      {m.imdbRating&&m.imdbRating!=="N/A"&&<div className="rtag">⭐ {m.imdbRating}</div>}
                      <div className="ttag">{m.Type==="series"?"📺":"🎬"} {m.Year}</div>
                    </div>
                    <div className="cb">
                      <div className="ct">{m.Title}</div>
                      <div className="cm">
                        <span>{m.Year}</span>
                        <span style={{color:m.imdbRating!=="N/A"?"#fbbf24":"var(--mt)"}}>
                          {m.imdbRating!=="N/A"?`⭐${m.imdbRating}`:m.Genre?.split(",")[0]||"—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="smwrap">
                  <button className="smbtn" onClick={()=>{const np=page+1;setPage(np);fetchMovies(searchMode?query:cat.q,searchMode?"":cat.type,np,true);}} disabled={loadingMore}>
                    {loadingMore?<><div className="sp" style={{width:16,height:16,borderWidth:2}}/> {t.loading}</>:t.seeMore}
                  </button>
                  <p className="sminfo">{t.showing} {movies.length} {t.of} {totalRes}</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="foot">
          🎬 <strong style={{color:"var(--tx)"}}>CineZone</strong> — Made with ❤️ in Bangladesh<br/>
          <span style={{opacity:.4,fontSize:"11px"}}>© 2025 CineZone · Powered by OMDB API</span>
        </div>
      </div>

      {/* MODAL */}
      {selected&&(()=>{
        const cols=gCol(selected.Genre);
        const stars=Math.min(5,Math.round((parseFloat(selected.imdbRating)||0)/2));
        const inWL=isInWL(selected.imdbID);
        const pSrc=P(selected.Poster);
        return (
          <div className="mover" onClick={()=>setSelected(null)}>
            <div className="mod" onClick={e=>e.stopPropagation()}>
              <div className="mhero" style={{background:`linear-gradient(135deg,${cols[0]},${cols[1]}30)`}}>
                {pSrc?<img className="mhbg" src={pSrc} alt="" onError={e=>e.target.style.display="none"}/>:<div className="mhph">🎬</div>}
                <div className="mhov"/>
                {pSrc
                  ?<img className="mposter" src={pSrc} alt={selected.Title} onError={e=>e.target.style.display="none"}/>
                  :<div className="mph" style={{background:`linear-gradient(135deg,${cols[0]},${cols[1]}40)`,color:cols[1]}}>{selected.Title?.[0]}</div>
                }
              </div>
              <button className="mcl" onClick={()=>setSelected(null)}>✕</button>
              <div className="mbody">
                <div className="mtype">{selected.Type?.toUpperCase()}</div>
                <h2 className="mtitle">{selected.Title}</h2>
                <div className="msub">{selected.Year}{selected.Rated!=="N/A"?` · ${selected.Rated}`:""}{selected.Runtime!=="N/A"?` · ${selected.Runtime}`:""}</div>
                {selected.imdbRating&&selected.imdbRating!=="N/A"&&(
                  <div className="mrat">
                    <span className="stars">{"★".repeat(stars)}{"☆".repeat(5-stars)}</span>
                    <span className="rn">{selected.imdbRating}</span>
                    <span className="rt">/ 10 {t.imdb}</span>
                    {selected.imdbVotes&&<span className="rv">({selected.imdbVotes} {t.votes})</span>}
                    {selected.Metascore&&selected.Metascore!=="N/A"&&(
                      <span style={{background:"#16a34a",color:"#fff",fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6}}>Meta {selected.Metascore}</span>
                    )}
                  </div>
                )}
                {selected.Genre&&selected.Genre!=="N/A"&&(
                  <div className="mtags">{selected.Genre.split(",").map(g=><span key={g} className="mtag">{g.trim()}</span>)}</div>
                )}
                {selected.Plot&&selected.Plot!=="N/A"&&(
                  <><div className="mplot-label">📖 PLOT</div><div className="mplot">{selected.Plot}</div></>
                )}
                <div className="mdet">
                  {[[t.director,selected.Director],[t.actors,selected.Actors],[t.writer,selected.Writer],[t.country,selected.Country],[t.language,selected.Language],[t.awards,selected.Awards],[t.boxOffice,selected.BoxOffice],[t.production,selected.Production]].map(([l,v])=>v&&v!=="N/A"&&(
                    <div key={l} className="md"><div className="dl">{l}</div><div className="dv" title={v}>{v}</div></div>
                  ))}
                </div>
                <div className="macts">
                  <button className="btnr" onClick={()=>trailer(selected.Title)}>{t.watchTrailer}</button>
                  <button className="btn2 btn-yt" onClick={()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.Title+" full movie")}`,"_blank")}>{t.watchYT}</button>
                  <button className={`btn2 btn-wl ${inWL?"saved":""}`} onClick={()=>toggleWL(selected)}>{inWL?t.removeWL:t.addWL}</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* WATCHLIST */}
      {showWL&&(
        <div className="wlpanel" onClick={()=>setShowWL(false)}>
          <div className="wlbox" onClick={e=>e.stopPropagation()}>
            <div className="wlhdr">
              <h3>{t.myWL}{watchlist.length>0?` (${watchlist.length})`:""}</h3>
              <button className="mcl" style={{position:"static",width:30,height:30,fontSize:14}} onClick={()=>setShowWL(false)}>✕</button>
            </div>
            <div className="wlbody">
              {watchlist.length===0?(
                <div className="wlempty"><span>📌</span><p>{t.wlEmpty}</p></div>
              ):watchlist.map(m=>{
                const c=gCol(m.Genre);const ps=P(m.Poster);
                return (
                  <div key={m.imdbID} className="wlitem" onClick={()=>{setSelected(m);setShowWL(false);}}>
                    {ps?<img className="wlpimg" src={ps} alt={m.Title} onError={e=>e.target.style.display="none"}/>
                      :<div className="wlph" style={{background:`linear-gradient(135deg,${c[0]},${c[1]}40)`,color:c[1]}}>{m.Title?.[0]}</div>}
                    <div className="wlinfo">
                      <div className="wltitle">{m.Title}</div>
                      <div className="wlyear">{m.Year} · {m.Genre?.split(",")[0]}{m.imdbRating!=="N/A"?` · ⭐${m.imdbRating}`:""}</div>
                    </div>
                    <button className="wlrm" onClick={e=>{e.stopPropagation();toggleWL(m);}}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {toast&&<div className="toast">{toast}</div>}
    </>
  );
}