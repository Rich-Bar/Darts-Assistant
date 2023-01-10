var rndPlayerUserId = generateUUID();
var rndGameId= generateUUID();
var currentTurn = null;
window.database = {
    autoSave: false,
    currentGame: null,
    games: [{
            id: rndGameId,
            mode: "501",
            started: new Date(),
            winners: [],
            turns: [{
                playerId: rndPlayerUserId,
                throw1:{points:30, angle: 10, distance: 0.4},
                throw2:{points:30, angle: 102, distance: 0.4},
                throw3:{points:30, angle: 1, distance: 0.4}
            }]
        }],
    players: [{
            username: "Gustav",
            id: rndPlayerUserId,
            started: new Date(),
            image: "",
            gameIds:[rndGameId]
        }],
    modes: [{
            name: "501",
            startPoints: 501,
            bullForStart: false,
            lastChance: true,
            doubleOut: true,
            start: 501,
            bestOfLegs: 3,
            legCount: 0,
            bestOfSets: 3,
            setCount: 0
    }]
};

const fields = [6,10,15,2,17,3,19,7,16,8,11,14,9,12,5,20,1,18,4,13];
$(function(){
    //Extending JQuery
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
    $('section.home .view-stats').click(()=>{
        $('section.stats').removeClass('visually-hidden');
    });
    $('section.home .save-db').click(()=>{
        let option = $('section.home .database select').val();
        if(option === "clipboard"){
            navigator.clipboard.writeText(JSON.stringify(window.database));
        }else if(option === "file"){
            new JavascriptDataDownloader(window.database).download();
        }else if(option === "browser"){
            localStorage.setItem('dartsAssistantDB', JSON.stringify(window.database));
        }
    });
    $('section.home .load-db').click(()=>{
        let option = $('section.home .database select').val();
        if(option === "clipboard"){
            window.database = JSON.parse(navigator.clipboard.readText());
        }else if(option === "file"){
            $('section.home .database .fileOpener').trigger('click');
        }else if(option === "browser"){
            window.database = JSON.parse(localStorage.getItem('dartsAssistantDB'));
        }
    });
    //Section-Game-creator Buttons
    $('section.game-creator i.edit-mode').click(()=>{
        //Open Edit Mode
        $("section.mode-details > h1 > span").text("Edit");
        $('section.mode-details').removeClass('visually-hidden');
        let selectedMode = database.modes[$('.game-creator .available-modes').val()];
        
        $('section.mode-details .modeName').val(selectedMode.name);
        $('section.mode-details .startNr').val(selectedMode.start);
        $('section.mode-details .setNr').val(selectedMode.setCount);
        $('section.mode-details .legNr').val(selectedMode.legCount);
        $('section.mode-details .bestOfSets input').prop('checked', selectedMode.bestOfSets);
        $('section.mode-details .bestOfLegs input').prop('checked', selectedMode.bestOfLegs);
        $('section.mode-details .doubleOut input').prop('checked', selectedMode.doubeOut);
        $('section.mode-details .lastChance input').prop('checked', selectedMode.lastChance);
    });
    $('section.game-creator i.create-mode').click(()=>{
        //Open New Mode
        $("section.mode-details > h1 > span").text("Create new");
        $('section.mode-details').removeClass('visually-hidden');
    });
    $('section.game-creator button').click(()=>{
        //Start Game
        $('section:not(.home)').addClass('visually-hidden');
        $('section.game .player-overview').html('');
        let i = 0;
        for(playerName of window.selectedPlayers){
            let player = database.players.find((p)=>p.username==playerName);
            $('section.game .player-overview').append('<div class="accordion-item player" data-id='+player.id+'>'+`
                <h2 class="accordion-header" role="tab"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#player-accordion .item-`+i+`" aria-expanded="false" aria-controls="player-accordion .item-`+i+`">`+playerName+`<span class="stat"><span class="remaining"></span><span class="average"></span></span><span class="stat">S.:<span class="set"></span></span><span class="stat">L.:<span class="leg"></span></span></button></h2>
                <div class="accordion-collapse collapse item-`+i+`" role="tabpanel" data-bs-parent="#player-accordion">
                    <div class="accordion-body">
                        <div class="input-group input-group-sm throw-input-group"><input class="border rounded-pill" type="number" min="0" max="180"><input class="border rounded-pill" type="number" min="0" max="180"><input class="border rounded-pill" type="number" min="0" max="180"><button class="btn btn-primary border rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#player-accordion .item-`+(i+1==window.selectedPlayers.length?0:i+1)+`" aria-expanded="false" aria-controls="player-accordion .item-`+i+`"><input type="number" placeholder="Sum">&nbsp; Done</button></div>
                    </div>
                </div>
            </div>`);
            i++;
        }
        $('section.game .throw-input-group input[max="180"]').change(calculateThrow);
        
        //Continue on Enter in Button-Input
        $("section.game .accordion-collapse .input-group > input").pressEnter((e)=>{
            $(e.target).attr('value', $(e.target).val());
            let inputsLeft = $(e.target).parent().find('input[type=number]:not([value])');
            if(inputsLeft.length)inputsLeft.first().focus();
            else $(e.target).parent().find(">button > input").focus();
        });
        $("section.game .accordion-collapse .input-group > button").click(function(e){
            if(typeof window.currentTurn !== "undefined" && typeof window.currentTurn.throw1 !== "undefined" && typeof window.currentTurn.throw2 !== "undefined" && typeof window.currentTurn.throw3 !== "undefined" && typeof window.currentTurn.playerId !== "undefined"){
                database.currentGame.turns.push(window.currentTurn);
                $("section.game .accordion-collapse .input-group input").val("").removeAttr('value');
                $("section.game > .board > span").remove();
            }
        });
        $("section.game .accordion-collapse .input-group > button > input").pressEnter((e)=>{
            $(e.target).parent().click();
        });

        $('section.game').removeClass('visually-hidden');
        window.database.currentGame = {
            id: generateUUID(),
            mode: database.modes.find((m)=>m.name==$('.game-creator .available-modes').val()),
            started: new Date(),
            winners: [],
            turns: []
        };
        $('.accordion-body input').change(function(){
            let curr = (isNaN($(".collapse.show .sum-turn").val())) ? 0 : $(".collapse.show .sum-turn").val();
            let sumT = 0;
            database.currentGame.turns.filter(turn=> {
                if(turn.playerId!=$(".collapse.show").parents(".player").data("id"))return;
                sumT = sumT + turn.throw1.points + turn.throw2.points + turn.throw3.points;
                return 0;
            });
            $(".remaining").text(database.currentGame.mode.start - curr - sumT);
        });
    });
    $("section.game-creator i.close-section").click(()=>{
        //Close New Game
        $("section.game-creator").addClass("visually-hidden");
        $("section.user-selection").addClass("visually-hidden");
    });
    //Section-User-selector Buttons
    $('section.user-selector .create-user-icon').click(()=>{
        //Open Create User
        $('section.user-details h1 > span').text('Create');
        $('section.user-details').removeClass('visually-hidden');
    });
    let editUser = function(e){
        //Open Edit User
        let existing = database.players.find((p)=>p.username==$(e.target).parent().text());
        if(existing != null){
            $('section.user-details input[name="username"]').val(existing.username);
            $('section.user-details input[name="uuid"]').val(existing.id);
            $('section.user-details input[name="date-created"]').val(existing.started);
            $("section.user-details img.profilePicture").attr('src', existing.image),
            $('section.user-details input[name="all-games"]').val(existing.gameIds);
        }
        $('section.user-details').removeClass('visually-hidden');
    }
    $('section.user-selector div.player-selection > span > span > i').click(editUser);
     let selectUser = function(e){
        //Select User
        $(e.target).toggleClass('selected');
        var playerListPreview = $('section.game-creator .player-list-preview');
        playerListPreview.html('');
        window.selectedPlayers = [];
        $('section.user-selector div.player-selection > span').each((i, v) => {
            if($(v).hasClass('selected')){
                window.selectedPlayers = [...window.selectedPlayers, $(v).find('span').text()];
                playerListPreview.append("<li data-uuid='"+$(v).find('span').data('uuid')+"'>"+ $(v).find('span').text() +"</li>");
            }
        });
    };
    $('section.user-selector div.player-selection > span').click(selectUser);
    //Section User Details
    $('section.user-details .save-btn').click((e)=>{
        let existing = database.players.find((p)=>p.username==$('section.user-details input[name="username"]').val());
        window.database.players.push({
            username: $('section.user-details input[name="username"]').val(),
            id: existing != null && typeof existing.id !== "undefined" && existing.id != $('section.user-details input[name="uuid"]').val()?$('section.user-details input[name="uuid"]').val():generateUUID(),
            started: existing != null && existing.started != $('section.user-details input[name="date-created"]').val()?$('section.user-details input[name="date-created"]').val():new Date(),
            image: $("section.user-details img.profilePicture").attr('src'),
            gameIds: existing != null && existing.gameIds != $('section.user-details input[name="all-games"]').val()?existing.gameIds:$('section.user-details input[name="all-games"]').val()
        });
        let newPlayer = $('section.user-selector .player-selection .template').clone().removeClass('template');
        newPlayer.find('span').html($('section.user-details input[name="username"]').val() + '<i class="fa fa-pencil edit-user" style="margin-left: 0.666em;"></i>');
        newPlayer.appendTo('section.user-selector .player-selection');
        newPlayer.click(selectUser);
        newPlayer.find('i').click(editUser);
        $('section.user-details').addClass('visually-hidden');
    });
    $("section.user-details input[type='file']").change((e)=>{
        let file = $("input[type=file]").get(0).files[0];
        if(file){
            var reader = new FileReader();
            reader.onload = function(){
                $("section.user-details img.profilePicture").attr("src", reader.result);
            }
            reader.readAsDataURL(file);
        }
    });
    $('section.user-details .cancel-btn').click((e)=>{
        $('section.user-details').addClass('visually-hidden');
    });
    $('section.user-details .delete-btn').click((e)=>{
        window.database.players.remove(database.players.find((p)=>p.username==$('section.user-details input[name="username"]').val()));
        $('section.user-details').addClass('visually-hidden');
        e.preventDefault();
    });
    //Section Mode Details
    $('section.mode-details .save-btn').click((e)=>{
        $('section.mode-details').addClass('visually-hidden');
        e.preventDefault();
        window.database.modes[$('section.mode-details .modeName').val()] = {
            name: $('section.mode-details .modeName').val(),
            doubeOut: $('section.mode-details .doubleOut input[type="checkbox"]').is(':checked'),
            lastChance: $('section.mode-details .lastChance input[type="checkbox"]').is(':checked'),
            start: $('section.mode-details .startingNr').val(),
            bestOfLegs: $('section.mode-details .bestOfLegs input[type="checkbox"]').is(':checked'),
            legCount: $('section.mode-details .legNr').val(),
            bestOfSets: $('section.mode-details .bestOfSets input[type="checkbox"]').is(':checked'),
            setCount: $('section.mode-details .setNr').val()
        };
    });
    $('section.mode-details .cancel-btn').click((e)=>{
        $('section.mode-details').addClass('visually-hidden');
        e.preventDefault();
    });
    $('section.mode-details .delete-btn').click((e)=>{
        $('section.mode-details').addClass('visually-hidden');
        let searchFor = $('section.game-creator .modeName').text();
        modes.remove(searchFor);
        $('section.game-creator .available-modes option[value="'+searchFor+'"]').remove();
        e.preventDefault();
    });
    //Show Screen create User
    $('.create-user-icon').click(()=>{
        $("section.user-details > h1 > span").text("Create new");
        $("section.user-details").removeClass('visually-hidden');
    });
    //Calculate Throw 
    window.calculateThrow = function(e){
        let totalPoints = 0;
        $(e.target).parent().find("> input").each(function(){
                totalPoints = parseInt($(this).val()||"0") + totalPoints;
        });
        $(e.target).parent().find("> button > input").val(totalPoints).attr('value', totalPoints).trigger("change")
    }
    //via inputs
    $("section.game .accordion-collapse .input-group > input").on('change', calculateThrow);
    //via board
    let calculateScore = function(x, y){
        let boardSize = $("section.game > .board img").innerWidth();
        let center = {
            x: $('section.game > .board img').innerWidth()/2 ,
            y:$('section.game > .board img').innerHeight()/2
        };
        let angle = (Math.atan2(center.y - y, center.x - x)* 180 / Math.PI + 189)%360;
        let distance = Math.sqrt(Math.pow(center.y - y, 2) + Math.pow(center.x - x, 2));
        
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
        let turn = 0;
        let player = database.players.find(p=>p.id === $('.accordion-collapse.show').parents('.player').data('id'));
        if(player == null) return;
        if(currentTurn == null || currentTurn.throw1 == null){
            turn = 1;
            currentTurn =  {
                playerId: player.id,
                throw1:{points:scored, angle:angle, distance: distance},
                throw2:null,
                throw3:null
            };
        }else if( currentTurn.throw2 == null){
            turn = 2;
            currentTurn["throw2"] = {points:scored, angle:angle, distance: distance};
        }else if( currentTurn.throw3 == null){
            turn=3;
            currentTurn["throw3"] = {points:scored, angle:angle, distance: distance};
        }
        return {turn:turn, points:scored, angle:angle, distance:distance};
        
    }
    $("section.game > .board img").click(function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        //Check if already thrown
        if($("section.game > .board > span").length == 3){
            $("section.game > .board > span").remove();
            return;
        }
        let boardSize = $("section.game > .board img").innerWidth();
        
        let scored = calculateScore(e.offsetX, e.offsetY);
        console.log(scored);
        //Place Position Marker
        var halfCrosshairSize = Math.floor(boardSize / 50);
        let crossHair = $('section.game > .board').append('<span data-throw="'+scored.turn+'" class="ui-draggable ui-draggable-handle" style="top: '+ (-halfCrosshairSize+e.offsetY) +'px;left: '+ (-halfCrosshairSize + e.offsetX) +'px;"></span>');
        let crossHairClick = function(e){
            e.stopImmediatePropagation();
            //Check if already thrown
            if($("section.game > .board > span").length == 3){
                $("section.game > .board > span").remove();
                return;
            }
            let boardX = e.offsetX + parseInt($(e.target).css('left').replace('px',''));
            let boardY = e.offsetY + parseInt($(e.target).css('top').replace('px',''));
            if(Number.isNaN(boardY) || Number.isNaN(boardX)) return;
            
            let scored = calculateScore(boardX, boardY);
            console.log(scored);
            let crossHairr = $('section.game > .board').append('<span data-throw="'+scored.turn+'" class="ui-draggable ui-draggable-handle" style="top: '+ (-halfCrosshairSize+boardY) +'px;left: '+ (-halfCrosshairSize + boardX) +'px;"></span>');
            crossHairr.on("click", crossHairClick);
            $('section.game > .board > span').draggable({
                stop: function( e, ui) {
                    if(currentTurn == null || currentTurn.throw1 == null){
                        currentTurn =  {
                            playerId: player.id,
                            throw1:null,
                            throw2:null,
                            throw3:null
                        };
                    }else if( currentTurn.throw2 == null){
                        currentTurn["throw2"] = null;
                    }else if( currentTurn.throw3 == null){
                        currentTurn["throw3"] = null;
                    }
                    let scored = calculateScore(ui.position.left + halfCrosshairSize, ui.position.top + halfCrosshairSize);
                    console.log(scored);
                    //Set Score in Input
                    $("section.game .accordion-collapse.show .input-group > input[type='number'][value]:nth-child("+($(e.target).attr('data-throw'))+")").val(scored.points).attr('value', scored.points).trigger("change");
                    if($("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").length){
                        $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().focus();
                    }else{
                        $("section.game .accordion-collapse.show .input-group > button > input").focus();
                    }
                }
            });
            //Set Score in Input
            $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().val(scored.points).attr('value', scored.points).trigger("change");
            if($("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").length){
                $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().focus();
            }else{
                $("section.game .accordion-collapse.show .input-group > button > input").focus();
            }
        };
        crossHair.click(crossHairClick);
        $('section.game > .board > span').draggable({
            stop: function( e, ui) {
                if(currentTurn == null || currentTurn.throw1 == null){
                    currentTurn =  {
                        playerId: player.id,
                        throw1:null,
                        throw2:null,
                        throw3:null
                    };
                }else if( currentTurn.throw2 == null){
                    currentTurn["throw2"] = null;
                }else if( currentTurn.throw3 == null){
                    currentTurn["throw3"] = null;
                }
                let scored = calculateScore(ui.position.left + halfCrosshairSize, ui.position.top + halfCrosshairSize);
                console.log(scored);
                //Set Score in Input
                $("section.game .accordion-collapse.show .input-group > input[type='number'][value]:nth-child("+($(e.target).attr('data-throw'))+")").val(scored.points).attr('value', scored.points).trigger("change");
                if($("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").length){
                    $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().focus();
                }else{
                    $("section.game .accordion-collapse.show .input-group > button > input").focus();
                }
            }
        });
        //Set Score in Input
        $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().val(scored.points).attr('value', scored.points).trigger("change");
        if($("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").length){
            $("section.game .accordion-collapse.show .input-group > input[type='number']:not([value])").first().focus();
        }else{
            $("section.game .accordion-collapse.show .input-group > button > input").focus();
        }
    });
    //Player Finished Throw
    $("section.game .accordion-collapse.show .input-group > button").click((e)=>{
        $("section.game > .board > span").remove();
        setTimeout($("section.game .accordion-collapse.show .input-group > button > input").focus());
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

class JavascriptDataDownloader {
    constructor(data={}) {
        this.data = data;
    }
    download (type_of = "application/json", filename= "Darts-Assistant-Save.json") {
        let body = document.body;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([JSON.stringify(this.data, null, 2)], {
            type: type_of
        }));
        a.setAttribute("download", filename);
        body.appendChild(a);
        a.click();
        body.removeChild(a);
    }
} 
