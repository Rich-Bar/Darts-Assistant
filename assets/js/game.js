var rndPlayerUserId = generateUUID();
var rndGameId= generateUUID();

window.database = {
    currentGame: null,
    games: {
        [rndGameId]: {
            id: rndGameId,
            mode: "501",
            started: new Date(),
            winners: [],
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
    $.fn.pressEnter = function(fn) {  
        return this.each(function() {  
            $(this).bind('enterPress', fn);
            $(this).keyup(function(e){
                if(e.keyCode == 13){$(this).trigger("enterPress", e);}
            })
        });  
     }; 
    //Load previous Games
    //window.database = JSON.parse(localStorage.get("dartAssistantDB"));
    
    //First Start of Assistant
    if(database == null){
        
    //Show Game Screen
    }else if(database.currentGame != null){

        
    }
    //Section-Home Buttons
    $('section.home .new-game').click(()=>{
        $('section.game-creator').removeClass('visually-hidden');
        $('section.user-selector').removeClass('visually-hidden');
    });
    $('section.home .view-stats').click(()=>$('section.stats').removeClass('visually-hidden'));
    $('section.home .save-db').click(()=>{});
    $('section.home .load-db').click(()=>{});
    //Section-Game-creator Buttons
    $('section.game-creator i.edit-mode').click(()=>{
        $("section.mode-details > h1 > span").text("Edit");
        $('section.mode-details').removeClass('visually-hidden');
    });
    $('section.game-creator i.create-mode').click(()=>{
        $("section.mode-details > h1 > span").text("Create new");
        $('section.mode-details').removeClass('visually-hidden');
    });
    $('section.game-creator button').click(()=>{
        $('section:not(.home)').addClass('visually-hidden');
        $('section.game').removeClass('visually-hidden');
        e.preventDefault();
    });
    //Section-User-selector Buttons
    $('section.user-selector div.player-selection > span').click((e)=>{
        $(e.target).toggleClass('selected');
        var playerListPreview = $('section.game-creator .player-list-preview');
        playerListPreview.html('');
        $('section.user-selector div.player-selection > span').each((i, v) => {
            if($(v).hasClass('selected'))playerListPreview.append("<li data-uuid='"+$(v).find('span').data('uuid')+"'>"+ $(v).find('span').text() +"</li>");
        });
    });
    //Show Screen create User
    $('.create-user-icon').click(()=>{
        $("section.user-details > h1 > span").text("Create new");
        $("section.user-details").removeClass('visually-hidden');
    });
    //Continue on Enter in Button-Input
    $("section.game .accordion-collapse .input-group > input").pressEnter((e)=>{
        $(e.target).attr('value', $(e.target).val());
        let inputsLeft = $(e.target).parent().find('input[type=number]:not([value])');
        if(inputsLeft.length)inputsLeft.first().focus();
        else $(e.target).parent().find(">button >input").focus();
    });
    $("section.game .accordion-collapse .input-group > button > input").pressEnter((e)=>{
        $(e.target).parent().click();
    });
    //Calculate Throw 
    //via inputs
    $("section.game .accordion-collapse .input-group > input").on('change', (e)=>{
        let totalPoints = 0;
        $(e.target).parent().find("> input").each(function(){
                totalPoints = parseInt($(this).val()||"0") + totalPoints;
        });
        $(e.target).parent().find("> button > input").val(totalPoints).attr('value', totalPoints).trigger("change")
    });
    //via board
    $("section.game > .board img").click(function(e){
        //Check if already thrown
        if($("section.game > .board > span").length == 3){
            $("section.game > .board > span").remove();
            return;
        }
        let boardSize = $("section.game > .board img").innerWidth();
        let center = {
            x: $('section.game > .board img').innerWidth()/2 ,
            y:$('section.game > .board img').innerHeight()/2
        };
        let angle = (Math.atan2(center.y - e.offsetY, center.x - e.offsetX)* 180 / Math.PI + 189)%360;
        let distance = Math.sqrt(Math.pow(center.y - e.offsetY, 2) + Math.pow(center.x - e.offsetX, 2));
        
        let scored = 0;
        if(distance/(boardSize/2) < 0.032){
            scored = 50;                                // Bullseye
        }else if(distance/(boardSize/2) < 0.072){
            scored = 25;                                // Center Green
        }else if(distance/(boardSize/2) > 0.433 && distance/(boardSize/2) < 0.473){
            scored = fields[Math.floor(angle/18)] * 3;  // Tripples
        }else if(distance/(boardSize/2) > 0.709 && distance/(boardSize/2) < 0.753){
            scored = fields[Math.floor(angle/18)] * 2;  // Doubles
        }else if(distance/(boardSize/2) > 0.753){       // Out
        }else{
            scored = fields[Math.floor(angle/18)];      // Normal
        }
        //console.log(angle, distance,distance/(boardSize/2), fields[Math.floor(angle/18)]);
        console.log(scored);
        //Place Position Marker
        let halfCrosshairSize = Math.floor(boardSize / 50);
        $('section.game > .board').append('<span style="top: '+ (-halfCrosshairSize+e.offsetY) +'px;left: '+ (-halfCrosshairSize + e.offsetX) +'px;"></span>');
        //Set Score preview

        //Set Score in Input
        var totalPoints = 0;
        $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().val(scored).attr('value', scored).trigger("change");
        if($("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").length){
            $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().focus();
        }else{
            $("section.game .accordion-collapse.show .input-group > button > input").focus();
        }
    });

    //Player Finished Throw
    $("section.game .accordion-collapse.show .input-group > button").click((e)=>{
        $("section.game > .board > span").remove();
        setTimeout($("section.game .accordion-collapse.show .input-group > button > input").focus(),100);
    });
});

function generateUUID() { // Public Domain/MIT
    var d = new Date().getTime();//Timestamp
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}