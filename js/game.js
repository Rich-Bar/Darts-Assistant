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
        $('.overlays, .overlays > .dart-board').toggleClass('visible');
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
    let scoreSpan = inputRow.find("span.total");
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
    inputRow.attr('data-total', turnScore);
    throws.forEach((tr, i)=>inputRow.attr('data-throw-'+i, tr.score));
    let over = currentRemaining - turnScore <2?currentRemaining - turnScore:0,
        finish = currentRemaining == (turnScore-over),
        player = window.players.filter((pl) => pl.id == cid).pop();
    
    if(over != 0) showNextPlayer = true;
    if(player.turnScoreCount == undefined) player.turnScoreCount = [];
    
    // Display Turn Total
    scoreSpan.text(turnScore);
    // No other actions if Dart-Board Overlay is visible
    if($('.overlays, .overlays > .dart-board').hasClass('visible')) return;
    if (finish){
        let saveFinish = ()=>{
            // Save Turn
            player.turnScoreCount[turnScore] = (player.turnScoreCount[turnScore]||0)+1;
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
            }else if(currentRemaining - turnScore == 1 || currentRemaining - turnScore < 0){
                // Save Turn
                player.turnScoreCount[0] = (player.turnScoreCount[0]||0)+1;
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
        scoreSpan.after(`<svg class="edit pencil" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="1em" width="1em" version="1.1" viewBox="0 0 306.637 306.637" xml:space="preserve"><path d="M12.809,238.52L0,306.637l68.118-12.809l184.277-184.277l-55.309-55.309L12.809,238.52z M60.79,279.943l-41.992,7.896    l7.896-41.992L197.086,75.455l34.096,34.096L60.79,279.943z"/><path d="M251.329,0l-41.507,41.507l55.308,55.308l41.507-41.507L251.329,0z M231.035,41.507l20.294-20.294l34.095,34.095    L265.13,75.602L231.035,41.507z"/></svg>`);
        // Save Turn
        player.turnScoreCount[turnScore] = (player.turnScoreCount[turnScore]||0)+1;
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
                <td>${over != 0 ? currentRemaining : currentRemaining - turnScore}</td>
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
                        <!-- Maybe display all throws and doubles? (D20 = 2x20 & 20D = 2x10 ?) RFC
                        <tr class="turn">
                            <td>${currentGame.startingPoints}</td>
                            <td>
                                <span>20</span>
                                <span class="modifier">Double</span><span>20</span>
                                <span>20</span>
                            </td>
                        </tr>-->
                    </tbody>
                </table>
            </div>`);
    });
    playersRemaining = [];
    currentGame.turns.forEach((turn)=>{
        if(turn.type == undefined){
            playersRemaining[turn.player] = Math.min(playersRemaining[turn.player]||currentGame.startingPoints, turn.over? 0: turn.toClear - turn.score);
            $('section.game .player[data-id="'+turn.player+'"] tbody').append(`
            <tr class="turn" data-total="${turn.score}" ${turn.throws.length?` data-throw-0="${turn.throws[0]?turn.throws[0].score:0}" data-throw-1="${turn.throws[1]?turn.throws[1].score:0}" data-throw-2="${turn.throws[2]?turn.throws[2].score:0}"`:''}>
                <td>${turn.toClear}</td>
                <td>            
                    <span class="total">${turn.score}</span>
                    <svg class="edit pencil" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="1em" width="1em" version="1.1" viewBox="0 0 306.637 306.637" xml:space="preserve"><path d="M12.809,238.52L0,306.637l68.118-12.809l184.277-184.277l-55.309-55.309L12.809,238.52z M60.79,279.943l-41.992,7.896    l7.896-41.992L197.086,75.455l34.096,34.096L60.79,279.943z"></path><path d="M251.329,0l-41.507,41.507l55.308,55.308l41.507-41.507L251.329,0z M231.035,41.507l20.294-20.294l34.095,34.095    L265.13,75.602L231.035,41.507z"></path></svg>
                </td>
            </tr>`);
        }
    });
    currentGame.players.forEach((player) => {
        player = players.filter((pl) => pl.id == player).pop();
        $('section.game .player[data-id="'+player.id+'"] tbody').append(`
            <tr class="turn">
                <td>${playersRemaining[player.id]||currentGame.startingPoints}</td>
                <td>
                    ${player.sem == "total" ? `<input class="total" type="number" name="total" maxlength="3" min="0" max="180" required/>` :
        `           <input class="throw" type="number" name="throw-1" maxlength="2" min="0" max="60" required/>
                    <input class="throw" type="number" name="throw-2" maxlength="2" min="0" max="60" required/>
                    <input class="throw" type="number" name="throw-3" maxlength="2" min="0" max="60" required/>`}
                    <span class="total"></span>
                </td>
            </tr>`);
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
// Initialize Graphs & Stats
let dummyOptions=(title) => {return {
    series: title=='Set Leg Wins'? Array.from({length: 4}, () => Math.floor(Math.random() * 100)).sort((a,b)=>a-b):[{
      name: "Player 1",
      data: Array.from({length: 10}, () => Math.floor(Math.random() * 180)).sort((a,b)=>b-a)
  },{
    name: "Player 2",
    data: Array.from({length: 10}, () => Math.floor(Math.random() * 180)).sort((a,b)=>b-a)
}],
  chart: {
    width: "100%",
    height: "100%",
    type: title=="Average" || title == "Remainder"?'line':title=='Set Leg Wins'?'radialBar':'bar',
    stacked:title=='Doubles'?true:false,
    toolbar:{show:false},
    zoom: {
      enabled: false
    }
  },
  legend:{show:false},
  dataLabels: {
    style:{fontSize:'10px'},
    enabled: false
  },
  stroke: {
    curve: 'straight',
    width: 2
  },
  title: {
    text: title,
    align: 'left'
  },
  grid: {
    row: {
      colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.5
    },
  },
  };
};

  let chart = new ApexCharts($('section.statistics > div:nth-child(1) > div')[0], dummyOptions('Average'));
  let chart2 = new ApexCharts($('section.statistics > div:nth-child(2) > div')[0], dummyOptions('Remainder'));
  let chart3 = new ApexCharts($('section.statistics > div:nth-child(3) > div')[0], dummyOptions('Score Over'));
  let chart4 = new ApexCharts($('section.statistics > div:nth-child(4) > div')[0], dummyOptions('Doubles'));
  let chart5 = new ApexCharts($('section.statistics > div:nth-child(5) > div')[0], dummyOptions('Set Leg Wins'));
  chart.render();
  chart2.render();
  chart3.render();
  chart4.render();
  chart5.render();
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
    $($("section.game .player .turn input:visible")[$("section.overlays .dart-board .board > span").length]).val(scored.points).change().focus();
    $("section.game .player .turn input.total:visible").val(parseInt($("section.game .player .turn input.total:visible").val()) + scored.points).change().focus();
    //Place Position Marker
    var halfCrosshairSize = Math.floor(boardSize / 50);
    let crossHair = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" data-throw="'+$("section.overlays .dart-board .board > span").length+'" style="top: ' + (-halfCrosshairSize + e.offsetY) + 'px;left: ' + (-halfCrosshairSize + e.offsetX) + 'px;"></span>');
    let crossHairClick = function (e) {
        e.stopImmediatePropagation();
        let boardX = e.offsetX + parseInt($(e.target).css('left').replace('px', ''));
        let boardY = e.offsetY + parseInt($(e.target).css('top').replace('px', ''));
        if (Number.isNaN(boardY) || Number.isNaN(boardX)) return;

        let scored = calculateScore(boardX, boardY);
        if (scored == null) return;
        //Check if already thrown
        if ($("section.overlays .dart-board .board > span").length == 3) {
            return;
        }
        let crossHairr = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" style="top: ' + (-halfCrosshairSize + boardY) + 'px;left: ' + (-halfCrosshairSize + boardX) + 'px;"></span>');
        crossHairr.on("click", crossHairClick);
        $($("section.game .player .turn input:visible")[$(e).attr('data-throw')]).val(scored.points).change().focus();
        $("section.game .player .turn input.total:visible").val(parseInt($("section.game .player .turn input.total:visible").val()) + scored.points).change().focus();
    };
    
    $('section.overlays .dart-board .board > span').draggable({
        stop: function (e, ui) {
            let scored = calculateScore(ui.position.left + halfCrosshairSize, ui.position.top + halfCrosshairSize);
            if (scored == null) return;
            console.log(e);
            $($("section.game .player .turn input:visible")[$(e).attr('data-throw')]).val(scored.points).change().focus();
            $("section.game .player .turn input.total:visible").val(parseInt($("section.game .player .turn input.total:visible").val()) + scored.points).change().focus();
        }
    });
    crossHair.click(crossHairClick);
});
$("section.overlays .backdrop").on('click touchdown', ()=>{
    $('section.overlays, section.overlays > .visible').removeClass('visible');
});

window.updateStatistics = ()=>{
    currentGame.stats ={};
    let independetStats = {average:0, doubleInChances: {tries:0,hits:0}, doubleOutChances: {tries:0,hits:0}, wins:[], throws: 0, turns: 0, totalScore:0, totalOver:0};
    currentGame.players.forEach((pid)=>{
        let player = players.filter((p)=>p.id == pid).pop();
        let calculateStats = (turn, preResult)=>{
            let result = {average:0, doubleInChances: {tries:0,hits:0}, doubleOutChances: {tries:0,hits:0}, wins:[], throws: 0, turns: 0, totalScore:0, totalOver:0, ...preResult};
            if(turn.type == undefined){
                if(turn.player != player.id) return;
                result.turns++;
                if(turn.over != 0) result.totalOver += Math.abs(turn.over);
                else result.totalScore += turn.score;
                // ToDo: DoubleIn / DoubleOut
                if(turn.throws.length){
                    let thrown = turn.throws.length;
                    result.throws += thrown;
                    result.average += ((turn.score / thrown) * 3 - result.average) / result.turns;   // RFC 2: Average per Dart is different from 3 Dart Average if player throws too high
                }else{
                    result.throws += 3;
                    result.average += (turn.score - result.average) / result.turns;
                }
            }else{
                let rollingStat = result;
                turn.turns.forEach((turn) =>{
                    let turnStat = turn.stats[player.id]||calculateStats(turn,rollingStat);
                    if(turnStat)rollingStat = turnStat;
                });
                result = rollingStat;
                
                if(turn.type == "leg" && turn.winner == player.id) result.wins[0] = (result.wins[0]||0)+1;
                else if(turn.type == "set" && turn.winner == player.id) result.wins[1] = (result.wins[1]||0)+1;
            } 
    
            turn.stats[player.id] = result;
            return result;
        }
        let rollingStat={};
        currentGame.turns.forEach((turn) =>{
            let turnStat = turn.stats[player.id]||calculateStats(turn,rollingStat);
            if(turnStat)rollingStat = turnStat;
        });
        currentGame.stats[player.id] = rollingStat;

        independetStats.throws += rollingStat.throws;
        independetStats.turns += rollingStat.turns; 
        independetStats.totalScore += rollingStat.totalScore;
        independetStats.totalOver += rollingStat.totalOver; 
        independetStats.average += (rollingStat.average - independetStats.average) * (rollingStat.throws / independetStats.throws); // See RFC 2  
    });
    currentGame.stats[0] = independetStats;
    console.log(currentGame.stats);
}