window.fields = [6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5, 20, 1, 18, 4, 13];

window.calculateCoordinates = (distance, angle) => {
    return {
        x: 50 + 50 * (distance * Math.cos(((angle + 189) % 360) * Math.PI / 180)),
        y: 50 + 50 * (distance * Math.sin(((angle + 189) % 360) * Math.PI / 180))
    };
}
//via board
window.calculateScore = (x, y) => {
    let boardSize = $("section.overlays .dart-board .board img").innerWidth();
    let center = {
        x: $('section.overlays .dart-board .board img').innerWidth() / 2,
        y: $('section.overlays .dart-board .board img').innerHeight() / 2
    };
    let angle = (Math.atan2(center.y - y, center.x - x) * 180 / Math.PI + 189) % 360;
    let distance = Math.sqrt(Math.pow(center.y - y, 2) + Math.pow(center.x - x, 2)) / (boardSize / 2);

    let scored = 0;
    if (distance < 0.032) {
        scored = 50;                                // Bullseye
    } else if (distance < 0.072) {
        scored = 25;                                // Center Green
    } else if (distance > 0.433 && distance < 0.473) {
        scored = fields[Math.floor(angle / 18)] * 3;  // Tripples
    } else if (distance > 0.709 && distance <= 0.753) {
        scored = fields[Math.floor(angle / 18)] * 2;  // Doubles
    } else if (distance > 0.753) {       // Out
    } else {
        scored = fields[Math.floor(angle / 18)];      // Normal
    }
    return { points: scored, angle: angle, distance: distance, x: x, y: y };
}

window.popoverAction = (action, callback) => {
    if(action == "bulls" || action == "board"){
        $('.overlays, .overlays > .dart-board').addClass('visible');
    }else if(action == "win"){
        $('.overlays > .win h3').text(currentGame.turns[currentGame.turns.length-1].type + ' Winner');
        $('.overlays > .win .username').text("  "+players.filter((p)=>p.id==currentGame.turns[currentGame.turns.length-1].winner).pop().username+"  ");
        $('.overlays, .overlays .win').addClass('visible');
        setTimeout(()=>{
            $('.overlays, .overlays .win').removeClass('visible')
            if(typeof(callback)=="function")setTimeout(()=>callback());
        },5000);
        return;
    }else if(action == "random"){
        currentGame.players = shuffle(currentGame.players);
    }else if(action == "rotate"){
        currentGame.players = arrayRotate(currentGame.players, currentGame.legRotation++);
    }else if(action == "rotateSet"){
        legRotation = 0;
        currentGame.players = shuffle(currentGame.startingOrder, ++currentGame.setRotation);
    }
    if(typeof(callback)=="function")setTimeout(()=>callback());
};

window.handleScoreInput = (e) => {
    let inputRow = $(e.target).parents('.turn').last();
    let cid = $(e.target).parents('.player').attr('data-id');

    // Calculate Score
    let currentRemaining = parseInt(inputRow.find('td:first-child').text()), turnScore = 0, throws = [], isIn = false, showNextPlayer = false;
    inputRow.find('input').each((i, e) => {
        let inputValue = parseInt($(e).val()||-1);
        if ($(e).is('[name="total"]')) {
            if(inputValue < 0 || inputValue > 180 || [179, 178, 176, 175, 173, 172, 169, 166, 163].includes(inputValue)) return;
            turnScore = inputValue;
        } else {
            //Impossible Numbers
            if(inputValue < 0 || inputValue > 60 || [59, 58, 56, 55, 53, 52, 49, 47, 46, 44, 43, 41, 37, 35, 31, 29, 23].includes(inputValue)) return;
            if(currentGame.doubleIn && currentGame.startingPoints == currentRemaining && isIn == false){
                if(inputValue%2==0){
                    throws.push({ score: inputValue });
                    turnScore = turnScore + inputValue;
                }else{
                    throws.push({ score: 0 });
                }
            }else{
                throws.push({ score: inputValue });
                turnScore = turnScore + inputValue;
            }
        }
    });
    let over = Math.min(0, currentRemaining - turnScore),
        finish = currentRemaining == turnScore,
        player = window.players.filter((pl) => pl.id == cid).pop();
    
        // Display Turn Total
    inputRow.find(".total").text(turnScore);
    if (finish){
        let saveFinish = ()=>{
            // Save Turn
            let turn = {
                player: player.id,
                toClear: currentRemaining,
                score: turnScore,
                over: over,
                finish: finish,
                throws: throws,
                timestamp: Date.now()
            };
            currentGame.turns.push(turn);
            finishedLeg();
        }
        //Check if finished
        if(currentGame.doubleOut){
            if(parseInt($(e.target).val())%2==0){
                saveFinish();
                return;
            }else if(currentRemaining - turnScore == 1){
                // Save Turn
                let turn = {
                    player: player.id,
                    toClear: currentRemaining,
                    score: 0,
                    over: -1,
                    finish: false,
                    throws: throws,
                    timestamp: Date.now()
                };
                currentGame.turns.push(turn);
                showNextPlayer = true;
            }else if(currentRemaining - turnScore < 0){
                // Save Turn
                let turn = {
                    player: player.id,
                    toClear: currentRemaining,
                    score: 0,
                    over: turnScore - currentRemaining,
                    finish: false,
                    throws: throws,
                    timestamp: Date.now()
                };
                currentGame.turns.push(turn);
                showNextPlayer = true;
            }   
        }else{
            saveFinish();
            return;
        }
    }
    // Turn Complete // Show next Player
    if ($("section.game .player.selected .turn input:visible").filter((i, e) => $(e).val() == "").length == 0 || showNextPlayer) {
        // Save Turn
        let turn = {
            player: player.id,
            toClear: currentRemaining,
            score: turnScore,
            over: over,
            finish: finish,
            throws: throws,
            timestamp: Date.now()
        };
        currentGame.turns.push(turn);
        // Find next Player
        let cid = $(e.target).parents('.player').attr('data-id'), found, next, last;
        currentGame.players.forEach((player) => {
            if (next == true) {
                found = player;
                next = false;
            } else if (player == cid) {
                next = true;
            }
        });
        if (!found) {
            last = true;
            found = currentGame.players[0];
        }
        $('.player[data-id="' + cid + '"]').removeClass('selected');
        inputRow.find('input').remove();
        // Append new Row for next Turn
        inputRow.after(`
            <tr class="turn${finish ? "finish" : ""}">
                <td>${over < 0 ? currentRemaining : currentRemaining - turnScore}</td>
                <td>
                ${player.sem == "total" ? `<input class="total" type="number" name="total" maxlength="3" min="0" max="180" required/>` :
                `<input class="throw" type="number" name="throw-1" maxlength="2" min="0" max="60" required/>
                <input class="throw" type="number" name="throw-2" maxlength="2" min="0" max="60" required/>
                <input class="throw" type="number" name="throw-3" maxlength="2" min="0" max="60" required/>`}
                <span class="total"></span>
                </td>
            </tr>`);
        updateStatistics();

        // Add Listeners to new InputRow
        if(last) $("section.game .player .turn input").on('change enterPress', handleScoreInput);
        if(last) $("section.game .player .turn input").on('keyup', (e)=>{
            if(e.keyCode == 32 || e.keyCode == 66)popoverAction('board');
        });

        // Show next Player
        $('.player[data-id="' + found + '"]').addClass('selected').find('.turn .total')[0].scrollIntoView();
    }
    //Focus next Input
    $("section.game .player .turn input:visible").filter((i, e) => $(e).val() == "").first().focus();
};

window.createGameUI = () => {
    let playerIndex = 0;
    //Clear Scoreboard
    $("section.game .scoreboard").html('');
    currentGame.players.forEach((player) => {
        player = players.filter((pl) => pl.id == player).pop();
        $('section.game .scoreboard').append(`
            <div data-id="${player.id}" class="player${playerIndex++ == 0?" selected":""}">
                <img width="200" height="200" src="https://picsum.photos/500">
                <h3>${player.username}</h3>
                <div class="simple-stat"></div>
                <table>
                    <thead>
                        <tr><th>Remaining</th><th>Scored</th></tr>
                    </thead>
                    <tbody>
                        <!--<tr class="turn">
                            <td>${currentGame.startingPoints}</td>
                            <td>
                                <span>20</span>
                                <span class="modifier">Double</span><span>20</span>
                                <span>20</span>
                            </td>
                        </tr>-->
                        <tr class="turn">
                            <td>${currentGame.startingPoints}</td>
                            <td>
                            ${player.sem == "total" ? `<input class="total" type="number" name="total" maxlength="3" min="0" max="180" required/>` :
                `           <input class="throw" type="number" name="throw-1" maxlength="2" min="0" max="60" required/>
                            <input class="throw" type="number" name="throw-2" maxlength="2" min="0" max="60" required/>
                            <input class="throw" type="number" name="throw-3" maxlength="2" min="0" max="60" required/>`}
                            <span class="total"></span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>`);
    });
    updateStatistics();
    $("section.game .scoreboard > .player .turn input:visible").filter((i, e) => $(e).val() == "").first().focus();

    // Player erntered Score
    setTimeout(()=>{
        $("section.game .player .turn input").on('change enterPress', handleScoreInput);
        $("section.game .player .turn input").on('keyup', (e)=>{
            if(e.keyCode == 32 || e.keyCode == 66)popoverAction('board');
        });
    });
};

window.finishedLeg = () => {
    let turns = currentGame.turns.filter((t) => t.type == undefined),
        legs = currentGame.turns.filter((t) => t.type == "leg"),
        sets = currentGame.turns.filter((t) => t.type == "set"), action;
    
    // Just won a Leg
    legs.push({
        type: "leg",
        turns: turns,
        players: currentGame.players,
        winner: turns.filter((t) => t.finish != undefined).pop().player
    });
    currentGame.turns = [...sets, ...legs];
    if (currentGame.legAction) {
        action = currentGame.legAction;
    }
    // Check if Won Set
    let legWinCount = {}, setWinner;
    legs.forEach((leg) => {
        legWinCount[leg.winner] = (legWinCount[leg.winner] || 0) + 1;
    });
    Object.entries(legWinCount).forEach((e, i) => {
        if ((currentGame.bestOfLegs == true && e[1] > currentGame.legs / 2) ||
            (currentGame.bestOfLegs != true && e[1] >= currentGame.legs)) {
            setWinner = e[0];
        }
    });
    if(setWinner){
        sets.push({
            type: "set",
            turns: legs,
            players: currentGame.players,
            winner: setWinner
        });
        // Check if Game-Winner exists
        let setWinCount = {}, gameWinner;
        sets.forEach((set) => {
            setWinCount[set.winner] = (setWinCount[set.winner] || 0) + 1;
        });
        Object.entries(setWinCount).forEach((e, i) => {
            if ((currentGame.bestOfSets == true && e[1] > currentGame.sets / 2) ||
                (currentGame.bestOfSets != true && e[1] >= currentGame.sets)) {
                gameWinner = currentGame.winner = e[0];
                $('.overlays > .backdrop').css('background',"#222b");
                $('.overlays > .win h3').text('Game Winner');
                $('.overlays > .win .username').text("  "+players.filter((p)=>p.id==e[0]).pop().username+"  ");
                $('.overlays, .overlays .win').addClass('visible');
                currentGame.playing = false;
                activeGames = JSON.parse(JSON.stringify(activeGames));
                activeGames.filter((ag)=>ag.id == currentGame.id).forEach((ag)=>ag.delete=true);
                window.games.push(currentGame);
                setTimeout(()=>{
                    $('.overlays .win').removeClass('visible');
                    saveDB(()=>{setTimeout(()=>window.location.href="index.html",250)})
                },5000);
            }
        });
        if(gameWinner)return;
        currentGame.turns = sets;
        if (currentGame.setAction) {
            action = currentGame.setAction;
        } else if (currentGame.legAction) {
            action = currentGame.legAction;
        }
    }
    popoverAction("win", ()=>popoverAction(action, createGameUI));
};

window.dbloaded = () => {
    window.currentGame = (window.activeGames || []).filter((ag) => ag.playing == true).pop();
    if(!currentGame && (window.activeGames || []).length ){
        window.activeGames[0].playing = true;
        window.currentGame = window.activeGames[0];
        currentGame.legRotation = currentGame.legRotation||0;
        currentGame.setRotation = currentGame.setRotation||0;
        
    }
    let action;
    if (currentGame.gameAction) {
        action = currentGame.gameAction;
    } else if (currentGame.setAction) {
        action = currentGame.setAction;
    } else if (currentGame.legAction) {
        action = currentGame.legAction;
    }
    // Start Game
    popoverAction(action, ()=>{
        currentGame.startingOrder = currentGame.players;
        createGameUI();
    });
}

// Board Overlay Logic
$("section.overlays .dart-board .board img").click(function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    //Check if already thrown
    if ($("section.overlays .dart-board .board > span").length == 3) {
        $("section.overlays .dart-board .board > span").remove();
        return;
    }
    let boardSize = $("section.overlays .dart-board .board img").innerWidth();

    let scored = calculateScore(e.offsetX, e.offsetY);
    if (scored == null) return;
    //Check if already thrown
    if ($("section.overlays .dart-board .board > span").length == 3) {
        return;
    }
    //Place Position Marker
    var halfCrosshairSize = Math.floor(boardSize / 50);
    let crossHair = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" style="top: ' + (-halfCrosshairSize + e.offsetY) + 'px;left: ' + (-halfCrosshairSize + e.offsetX) + 'px;"></span>');
    let crossHairClick = function (e) {
        e.stopImmediatePropagation();
        let boardX = e.offsetX + parseInt($(e.target).css('left').replace('px', ''));
        let boardY = e.offsetY + parseInt($(e.target).css('top').replace('px', ''));
        if (Number.isNaN(boardY) || Number.isNaN(boardX)) return;

        let scored = calculateScore(boardX, boardY);
        if (scored == null) return;
        let crossHairr = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" style="top: ' + (-halfCrosshairSize + boardY) + 'px;left: ' + (-halfCrosshairSize + boardX) + 'px;"></span>');
        crossHairr.on("click", crossHairClick);
        $('section.overlays .dart-board .board > span').draggable({
            stop: function (e, ui) {
                let scored = calculateScore(ui.position.left + halfCrosshairSize, ui.position.top + halfCrosshairSize);
                if (scored == null) return;
            }
        });
    };
    crossHair.click(crossHairClick);
});
$("section.overlays .backdrop").on('click touchdown', ()=>{
    $('section.overlays, section.overlays > .visible').removeClass('visible');
});

window.updateStatistics = ()=>{
    currentGame.players.forEach((pid)=>{
        let player = players.filter((p)=>p.id == pid).pop();
        let average, doubleInChances = {tries:0,hits:0}, doubleOutChances = {tries:0,hits:0}, legWins, setWins, legAverages = [], setAverages = [];
        let calculateStats = (turn)=>{
            if(turn.type == undefined){
                if(turn.throws.length){

                }
            }else if(turn.type == "leg"){

            }else if(turn.type == "set"){

            }
        }
        currentGame.turns.forEach(calculateStats);
    });
}