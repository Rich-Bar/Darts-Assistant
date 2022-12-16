var rndPlayerUserId = ""+ Math.random() * 0xFFFFFFFFFFFFFF;
var rndGameId= ""+ Math.random() * 0xFFFFFFFFFFFFFF;

window.database = {
    currentGame: null,
    games: {
        [rndGameId]: {
            id: rndGameId,
            mode: "501",
            started: new Date(),
            turns: {rndPlayerUserId: [{
                throw1:{
                    score: 180,
                    position: {x:0, y:0}
                },
                throw2:{
                    score: 80,
                    position: {x:30, y:0}
                },
                throw3:{
                    score: 18,
                    position: {x:0, y:70}
                },
                score: ()=>{return throw1.score + throw2.score + throw3.score;},
                average: ()=>{return score()/3;}
            }]}
        },
        winners: []
    },
    players: {
        [rndPlayerUserId]: {
            username: "Gustav",
            id: rndGameId,
            started: new Date(),
            image: "",
            gameIds:[rndGameId]
        }
    },
    modes: {
        ["501"]: {
            name: "501",
            doubeOut: true,
            start: 501,
            maxLegs: 1,
            maxSets: 0
        }
    },
    
}

const fields = [6,10,15,2,17,3,19,7,16,8,11,14,9,12,5,20,1,18,4,13];
$(function(){
    //Load previous Games
    //window.database = JSON.parse(localStorage.get("dartAssistantDB"));

    //Show Create Game Screen
    if(database.currentGame == null){

    }
    //Calculate Throw 
    $("#board").click(function(e){
        let boardSize = $("#board img").innerWidth();
        let center = {x: $('#board').innerWidth()/2 ,y:$('#board').innerHeight()/2};
        let angle = (Math.atan2(center.y - e.offsetY, center.x - e.offsetX)* 180 / Math.PI + 189)%360;
        let distance = Math.sqrt(Math.pow(center.y - e.offsetY, 2) + Math.pow(center.x - e.offsetX, 2));
        
        let scored = 0;
        if(distance/(boardSize/2) < 0.032){
            scored = 50;
        }else if(distance/(boardSize/2) < 0.072){
            scored = 25;
        }else if(distance/(boardSize/2) > 0.433 && distance/(boardSize/2) < 0.473){
            scored = fields[Math.floor(angle/18)] * 3;
        }else if(distance/(boardSize/2) > 0.709 && distance/(boardSize/2) < 0.753){
            scored = fields[Math.floor(angle/18)] * 2;
        }else if(distance/(boardSize/2) > 0.753){
        }else{
            scored = fields[Math.floor(angle/18)];
        }
        //console.log(angle, distance,distance/(boardSize/2), fields[Math.floor(angle/18)]);
        console.log(scored);
    });
});