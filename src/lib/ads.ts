import A1 from './assets/ads/_Cannon__Wilkins_Coffee_commercial_(1957).webm.480p.vp9-DJ6ntx1g.webm';
import A2 from './assets/ads/Outdoor_Stone_Options_For_Residential_&_Commercial_Properties_by_Josh_Bois_(Clip_in_WebM_Format).webm';
import A3 from "./assets/ads/Jim_Henson_-_McGarry's_Sausages_featuring_Kermit_and_Mack_(1964).webm"
import A4 from "./assets/ads/Great_Shakes_commercial_(c._1966).webm"
// import A5 from "./assets/ads/1962_Seattle_World's_Fair_commercial.ogg"
import A6 from "./assets/ads/5_nanometer_transistor_--_how_they_did_it.webm"
// import A7 from "./assets/ads/1970s_Seattle_Fire_Department_recruiting_commercial.ogg"
// import A8 from "./assets/ads/E-Z_Pop_Commercial.ogg"
// import A9 from "./assets/ads/Folgers_commercial.ogg"
import A10 from "./assets/ads/First_Count_Chocula_and_Franken_Berry_commercial_(1971).webm"

type Ad = { src: string, author?: string, date?: number, link?: string, attributionHtml?: string }

export const ads: Ad[] = [
    { src: A1, author: 'Jim Henson', date: 1964, link: 'https://commons.wikimedia.org/wiki/File:%22Cannon%22_Wilkins_Coffee_commercial_(1957).webm' },
    { src: A2, author: 'Joshbois', date: 2014, link: 'https://commons.wikimedia.org/wiki/File:Outdoor_Stone_Options_For_Residential_%26_Commercial_Properties_by_Josh_Bois_(Clip_in_WebM_Format).webm' },
    { src: A3, author: 'Jim Henson', date: 1957, link: "https://commons.wikimedia.org/wiki/File:Jim_Henson_-_McGarry's_Sausages_featuring_Kermit_and_Mack_(1964).webm" },
    { src: A4, author: 'unkown', date: 1966, link: "https://commons.wikimedia.org/wiki/File:Great_Shakes_commercial_(c._1966).webm"},
    // { src: A5, date: 1962, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:1962_Seattle_World%27s_Fair_commercial.ogv">Seattle Municipal Archives</a>, Public domain, via Wikimedia Commons'},
    { src: A6, date: 2017, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:5_nanometer_transistor_--_how_they_did_it.webm">IBM Research</a>, <a href="https://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>, via Wikimedia Commons'},
    // { src: A7, date: 1975, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:1970s_Seattle_Fire_Department_recruiting_commercial.ogv">Seattle Municipal Archives</a>, <a href="https://creativecommons.org/licenses/by/2.0">CC BY 2.0</a>, via Wikimedia Commons'},
    // { src: A8, date: 1950, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:E-Z_Pop_Commercial.ogv">Taylor-Reed Corporation</a>, Public domain, via Wikimedia Commons'},
    // { src: A9, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:Folgers_commercial.ogv">User:Sam916</a>, Public domain, via Wikimedia Commons'},
    { src: A10, date: 1971, attributionHtml: '<a href="https://commons.wikimedia.org/wiki/File:First_Count_Chocula_and_Franken_Berry_commercial_(1971).webm">General Mills</a>, Public domain, via Wikimedia Commons'}
];