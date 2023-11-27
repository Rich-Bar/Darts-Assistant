/* Analyze file for errors and fix them in this file */ 
/* Generate UUID */ 
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

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
    if(localStorage.getItem('dartsAssistantAutosave') == "true"){
        $('section.home .autosave')[0].checked = true;
        window.autoSave = setInterval(()=>{
            localStorage.setItem('dartsAssistantDB', JSON.stringify(window.database));
            reloadPlayers();
        },250);
    }
    $('section.home .autosave').change((e)=>{
        if($(e.target).is(':checked')){ 
            localStorage.setItem('dartsAssistantAutosave', "true");
            window.autoSave = setInterval(()=>{
                localStorage.setItem('dartsAssistantDB', JSON.stringify(window.database));
            },250);
        }else{
            localStorage.setItem('dartsAssistantAutosave', "");
        } 
    });
    //Load saved Players and Games if autosave is enabled
    if(localStorage.getItem('dartsAssistantAutosave') == "true"){
        reloadPlayers();
        reloadGames();
    }
    //Reload Games
    function reloadGames(){
        $('section.game-creator').addClass('visually-hidden');
        $('section.game').removeClass('visually-hidden');
        $('section.game .player-overview').html('');
        let games = window.database.games;
        games.forEach(loadGame);
    }
    //Reload Players
    function reloadPlayers(){
        $('section.game-creator').addClass('visually-hidden');
        $('section.game').removeClass('visually-hidden');
        $('section.game .player-overview').html('');
        let players = window.database.players;
        let loadPlayer = (player)=>{
            let playerView = `
            <div class="player-overview">
                <div class="player-name">${player.username}</div>
                <div class="player-image"><img src="${player.image}"></div>
            </div>`;
            $('section.game .player-overview').append(playerView);
        }
        players.forEach(loadPlayer);
    }
    //Reload Modes
    function reloadModes(){
        $('section.game-creator').addClass('visually-hidden');
        $('section.game').removeClass('visually-hidden');
        $('section.game .player-overview').html('');
        let modes = window.database.modes;
        modes.forEach(loadMode);
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
        window.database.currentGame = {
            id: generateUUID(),
            mode: database.modes.find((m)=>m.name==$('.game-creator .available-modes').val()),
            started: new Date(),
            winners: [],
            turns: []
        };
        let i = 0;
        for(playerName of window.selectedPlayers){
            let player = database.players.find((p)=>p.username==playerName);
            $('section.game .player-overview').append('<div class="accordion-item player" data-id='+player.id+'>'+`
                <h2 class="accordion-header" role="tab"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#player-accordion .item-`+i+`" aria-expanded="false" aria-controls="player-accordion .item-`+i+`">`+playerName+`<span class="stat"><span class="remaining">`+database.currentGame.mode.startPoints+`</span><span class="average"></span></span><span class="stat">S.:<span class="set">0</span></span><span class="stat">L.:<span class="leg">0</span></span></button></h2>
                <div class="accordion-collapse collapse item-`+i+`" role="tabpanel" data-bs-parent="#player-accordion">
                    <div class="accordion-body">
                        <div class="input-group input-group-sm throw-input-group"><input class="border rounded-pill" type="number" min="0" max="180"><input class="border rounded-pill" type="number" min="0" max="180"><input class="border rounded-pill" type="number" min="0" max="180"><button class="btn btn-primary border rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#player-accordion .item-`+(i+1==window.selectedPlayers.length&&i!=0?0:i+1)+`" aria-expanded="false" aria-controls="player-accordion .item-`+i+`"><input type="number" placeholder="Sum">&nbsp; Done</button></div>
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
            if(window.currentTurn != null && window.currentTurn.throw1 !=null && window.currentTurn.throw2 != null && window.currentTurn.throw3 != null && window.currentTurn.playerId != null){
                database.currentGame.turns.push(window.currentTurn);
                $("section.game .accordion-collapse .input-group input").val("").removeAttr('value');
                $("section.game > .board > span").remove();
                $(e.target).siblings()[0].focus({preventScroll: true});
            }
        });
        $("section.game .accordion-collapse .input-group > button > input").pressEnter((e)=>{
            $(e.target).parent().click();
        });
        $('section.game').removeClass('visually-hidden');
        $("section.game .accordion-collapse .input-group > button > input").change(function(e){
            let tar = $(e.target);
            let curr = isNaN(parseInt(tar.val())) ? 0 : parseInt(tar.val());
            let sumT = 0;
            database.currentGame.turns.filter(turn=> {
                if(turn.playerId!= tar.parents(".player").data("id"))return;
                sumT += (turn.throw1 == null?0:turn.throw1.points||0) +(turn.throw2 == null?0:turn.throw2.points||0) + (turn.throw3 == null?0:turn.throw3.points||0);
                return 0;
            });
            tar.parents(".player").find(".remaining").text(""+(database.currentGame.mode.startPoints - curr - sumT));
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
    window.reloadPlayers = function(){
        if(window.database && window.database.players && window.database.players.length){
            window.database.players.forEach((p)=>{
                let newPlayer = $('section.user-selector .player-selection .template').clone().removeClass('template');
                newPlayer.find('span').html(p.username + '<i class="fa fa-pencil edit-user" style="margin-left: 0.666em;"></i>');
                newPlayer.appendTo('section.user-selector .player-selection');
                newPlayer.click(selectUser);
                newPlayer.find('i').click(editUser);
            });
        }
    };
    $('section.user-details .save-btn').click((e)=>{
        let existing = database.players.find((p)=>p.username==$('section.user-details input[name="username"]').val());
        window.database.players.push({
            username: $('section.user-details input[name="username"]').val(),
            id: existing != null && typeof existing.id !== "undefined" && existing.id != $('section.user-details input[name="uuid"]').val()?$('section.user-details input[name="uuid"]').val():generateUUID(),
            started: existing != null && existing.started != $('section.user-details input[name="date-created"]').val()?$('section.user-details input[name="date-created"]').val():new Date(),
            image: $("section.user-details img.profilePicture").attr('src'),
            gameIds: existing != null && existing.gameIds != $('section.user-details input[name="all-games"]').val()?existing.gameIds:$('section.user-details input[name="all-games"]').val()
        });
        $('section.user-details').addClass('visually-hidden');
        reloadPlayers();
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
    window.getPlayerStats = function(obj, type, filter, ...args){
        switch(type+"".toLowerCase()){
            case "game":
                let avrg = 0, total = 0, throws = 0;
                obj.turns.forEach((turn)=>{
                    if(filter == null || turn.playerId === filter){
                        if(turn.throw1 && turn.throw1.over != true){
                            throws++;
                            total += turn.throw1.points;
                        }
                        if(turn.throw2 && turn.throw2.over != true){
                            throws++;
                            total += turn.throw2.points;
                        }
                        if(turn.throw3 && turn.throw3.over != true){
                            throws++;
                            total += turn.throw3.points;
                        }
                    };
                });
                avrg = total / throws;
                return {
                    average: avrg,
                    total: total,
                    throws: throws
                }
            break;
            case "turn":

            break;
            default:

        }
    }
    window.calculateCoordinates = function(distance, angle) {
        return { 
            x: 50 + 50*(distance * Math.cos(((angle + 189) % 360) * Math.PI / 180)),
            y: 50 + 50*(distance * Math.sin(((angle + 189) % 360) * Math.PI / 180))
        };
    }
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
        let distance = Math.sqrt(Math.pow(center.y - y, 2) + Math.pow(center.x - x, 2))/(boardSize/2);
        
        let scored = 0;
        if(distance < 0.032){
            scored = 50;                                // Bullseye
        }else if(distance < 0.072){
            scored = 25;                                // Center Green
        }else if(distance > 0.433 && distance < 0.473){
            scored = fields[Math.floor(angle/18)] * 3;  // Tripples
        }else if(distance > 0.709 && distance < 0.753){
            scored = fields[Math.floor(angle/18)] * 2;  // Doubles
        }else if(distance > 0.753){       // Out
        }else{
            scored = fields[Math.floor(angle/18)];      // Normal
        }
        let turn = 0;
        let player = database.players.find(p=>p.id === $('.accordion-collapse.show').parents('.player').data('id'));
        if(player == null) return;
        if(currentTurn != null && currentTurn.throw2 == null){
            turn = 2;
            currentTurn["throw2"] = {points:scored, angle:angle, distance: distance};
        }else if(currentTurn != null && currentTurn.throw3 == null){
            turn=3;
            currentTurn["throw3"] = {points:scored, angle:angle, distance: distance};
        }else{
            turn = 1;
            currentTurn =  {
                playerId: player.id,
                throw1:{points:scored, angle:angle, distance: distance},
                throw2:null,
                throw3:null
            };
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
        if(scored == null) return;
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
            if(scored == null) return;
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
                    if(scored == null) return;
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
                if(scored == null) return;
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
