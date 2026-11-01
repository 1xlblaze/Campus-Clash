export type Question={id:string;prompt:string;options:string[];answer:string;explanation?:string};
export type Game={id:"bollywood"|"trivia";title:string;subtitle:string;icon:string;duration:string;questions:Question[]};
export const games:Game[]=[
{id:"bollywood",title:"Bollywood Emoji Guess",subtitle:"Decode the emojis. Name the movie.",icon:"🎬",duration:"2 min",questions:[
{id:"b1",prompt:"👨‍🎓 ❤️ 👩‍🎓 🚂",options:["DDLJ","3 Idiots","Kuch Kuch Hota Hai","Mohabbatein"],answer:"DDLJ",explanation:"A classic cross-country love story."},
{id:"b2",prompt:"🏏 👨‍👦 🇮🇳",options:["Lagaan","Kai Po Che!","MS Dhoni","Jersey"],answer:"Lagaan"},
{id:"b3",prompt:"👨‍🚀 🌌 📻 ❤️",options:["PK","Swades","Rocket Singh","Mission Mangal"],answer:"Swades"},
{id:"b4",prompt:"👬 🏍️ 🏜️ 🤝",options:["Sholay","Zindagi Na Milegi Dobara","Dhoom","Dil Chahta Hai"],answer:"Sholay"},
{id:"b5",prompt:"👨‍🍳 🍝 🇮🇹 ❤️",options:["Queen","English Vinglish","The Lunchbox","Chef"],answer:"The Lunchbox"},
{id:"b6",prompt:"🎤 🎸 👨‍🎤 🌟",options:["Rockstar","Aashiqui 2","Gully Boy","Secret Superstar"],answer:"Rockstar"},
{id:"b7",prompt:"👰 🚗 🗺️ 👭",options:["Veere Di Wedding","Queen","Jab We Met","Piku"],answer:"Queen"},
{id:"b8",prompt:"🧑‍🤝‍🧑 🎓 🧠 📚",options:["Chhichhore","3 Idiots","Student of the Year","F.A.L.T.U."],answer:"3 Idiots"},
{id:"b9",prompt:"🚕 🌃 💬 ❤️",options:["Wake Up Sid","Tamasha","Taxi No. 9211","Raat Akeli Hai"],answer:"Wake Up Sid"},
{id:"b10",prompt:"🕵️‍♂️ 🎭 🇮🇳 🔫",options:["Baby","War","Pathaan","Raazi"],answer:"Raazi"}]},
{id:"trivia",title:"Rapid-Fire Trivia",subtitle:"Ten questions. No time to overthink.",icon:"⚡",duration:"2 min",questions:[
{id:"t1",prompt:"Which planet is known as the Red Planet?",options:["Venus","Mars","Jupiter","Mercury"],answer:"Mars"},
{id:"t2",prompt:"What is the capital of Australia?",options:["Sydney","Melbourne","Canberra","Perth"],answer:"Canberra"},
{id:"t3",prompt:"How many players are on a football team on the field?",options:["9","10","11","12"],answer:"11"},
{id:"t4",prompt:"Which is the largest ocean on Earth?",options:["Atlantic","Indian","Arctic","Pacific"],answer:"Pacific"},
{id:"t5",prompt:"Who wrote Romeo and Juliet?",options:["Charles Dickens","William Shakespeare","Jane Austen","Oscar Wilde"],answer:"William Shakespeare"},
{id:"t6",prompt:"What does CPU stand for?",options:["Central Processing Unit","Computer Personal Unit","Core Power Utility","Central Program Utility"],answer:"Central Processing Unit"},
{id:"t7",prompt:"Which element has the chemical symbol O?",options:["Gold","Oxygen","Osmium","Iron"],answer:"Oxygen"},
{id:"t8",prompt:"How many sides does a hexagon have?",options:["5","6","7","8"],answer:"6"},
{id:"t9",prompt:"Which Indian city is nicknamed the Pink City?",options:["Udaipur","Jodhpur","Jaipur","Bikaner"],answer:"Jaipur"},
{id:"t10",prompt:"Which language runs natively in the browser?",options:["Go","Java","C","JavaScript"],answer:"JavaScript"}]}
];
export function getGame(id:string){return games.find(g=>g.id===id)}
