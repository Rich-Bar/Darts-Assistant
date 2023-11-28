$(() => {
    function getDb(callback){
        var open = window.indexedDB.open("DartsDatabase", 1);

        open.onupgradeneeded = function () {
            var db = open.result;
            var gamesStore = db.createObjectStore("GamesStorage", {keyPath: "id"});
            var playersStore = db.createObjectStore("PlayersStorage", {keyPath: "id"})
            var ActiveGamesStore = db.createObjectStore("ActiveGamesStorage", {keyPath: "id"})
        };

        window.players = [];
        window.games = [];
        window.activeGames = [];
        open.onsuccess = function () {
            console.log("success");
            // Start a new transaction
            var db = open.result, done = 0;
            var txGames = db.transaction("GamesStorage", "readwrite");
            var txPlayers = db.transaction("PlayersStorage", "readwrite");
            var txActiveGames = db.transaction("ActiveGamesStorage", "readwrite");
            var gamesStore = txGames.objectStore("GamesStorage");
            var playersStore = txPlayers.objectStore("PlayersStorage");
            var activeGamesStore = txActiveGames.objectStore("ActiveGamesStorage");
            
            var getPlayers = playersStore.getAll();
            getPlayers.onsuccess = function () {
                window.players = getPlayers.result;
                if (++done == 3) callback();
            };
            
            var getGames = gamesStore.getAll()
            getGames.onsuccess = function () {
                window.games = getGames.result;
                if (++done == 3) callback();
            };
            
            var getActiveGames = activeGamesStore.getAll()
            getActiveGames.onsuccess = function () {
                window.activeGames = getActiveGames.result;
                if (++done == 3) callback();
            };
            
            // Close the db when the transaction is done
            txGames.oncomplete = function () {
                db.close();
            };
            txActiveGames.oncomplete = function () {
                db.close();
            };
            // Close the db when the transaction is done
            txPlayers.oncomplete = function () {
                db.close();
            };
        }

    }

    function buildUI() {
        // Autosave to IndexedDB
        setInterval(function(){// set settings as cookie
            document.cookie = "settings="+JSON.stringify((window.settings||{}))+" expires=Thu, 18 Dec 2024 12:00:00 UTC; path=/";
            // Create the schema
            var open = window.indexedDB.open("DartsDatabase", 1);
            
            open.onupgradeneeded = function () {
                var db = open.result;
                var gamesStore = db.createObjectStore("GamesStorage", {keyPath: "id"});
                var playersStore = db.createObjectStore("PlayersStorage", {keyPath: "id"})
                var ActiveGamesStore = db.createObjectStore("ActiveGamesStorage", {keyPath: "id"})
            };
    
            open.onsuccess = function () {
                // Start a new transaction
                var db = open.result;
                var txGames = db.transaction("GamesStorage", "readwrite");
                var txPlayers = db.transaction("PlayersStorage", "readwrite");
                var gamesStore = txGames.objectStore("GamesStorage");
                var playersStore = txPlayers.objectStore("PlayersStorage");
    
                // Add some data
                games.forEach(game => gamesStore.put(game));
                players.forEach(player => playersStore.put(player));
    
                // Close the db when the transaction is done
                txGames.oncomplete = function () {
                        db.close();
                };
                // Close the db when the transaction is done
                txPlayers.oncomplete = function () {
                        db.close();
                };
            }
        }, 15000);

        // Append relevant UI components
        (window.players||[]).forEach((player) => {
            $('section.new-game .season_content .player-selector').append('<div data-id="'+player.id+'">'+player.username+'</div>');
            $('section.players').append(`
            <div class="card is-collapsed ">
                <div class="card__inner js-expander">
                    <span>${player.username}</span>
                </div>
                <div class="card__expander">
                    <span class="js-collapser">x</span>
                    <form class="user-form" data-id="${player.id}">
                        <img src="https://picsum.photos/5${Math.floor(Math.random()*99)}">
                        <fieldset>
                            <label for="username">
                                <span>Username</span>
                                <input name="username" value="${player.username}" placeholder="Username"/>
                            </label>
                            <label for="Score Entering Method">
                                <span>Score Entering Method</span>
                                <select name="sem" value="${player.sem}" invalid>
                                    <option value="total">Total Score</option>
                                    <option value="perDart">Per Dart</option>
                                    <option value="dartPosition">Dartboard Position</option>
                                </select>
                            </label>
                            <button type="submit">Save</button>
                        </fieldset>
                    </form>
                </div>
            </div>`);
        });
        // Setup Listeners
        $('section.new-game .season_content .player-selector > div').on('click touchdown', (e)=>{
            let playerDiv = $(e.currentTarget);
            if(playerDiv.hasClass('active')){
                let ix = playerDiv.find('.index'), di = parseInt(ix.text());
                $("section.new-game .season_content .player-selector > div .index").each((i,e)=>{
                    if(parseInt($(e).text()) > di) $(e).text(parseInt($(e).text())-1);
                });
                playerDiv.removeClass('active').find('.index').remove();
            }else{
                playerDiv.addClass('active').append('<span class="index">'+($("section.new-game .season_content .player-selector > div .index").length+1)+"</span>");
            }
        });
        $('section.players .user-form').on('submit', (e) => {
            e.preventDefault(); e.stopImmediatePropagation();
            let form = $(e.target).add($(e.target).parents('form'));
            if (form.attr('data-id')) {
                window.players.forEach((player) => {
                    if (player.id == form.attr('data-id')) {
                        player.username = form.find('input[name="username"]').val();
                        player.sem = form.find('select[name="sem"]').val();
                    }
                })
            } else {
                window.players.push({
                    id: Math.floor(Math.random()*0xFFFFFFFF),
                    username: form.find('input[name="username"]').val(),
                    sem: form.find('select[name="sem"]').val()
                });
            }
        });
        //Expandable Player-Cards
        var $cell = $('.card');
        $cell.find('.js-expander').click(function () {
            var $thisCell = $(this).closest('.card');
            if ($thisCell.hasClass('is-collapsed')) {
                $thisCell.removeClass('is-collapsed');
                $thisCell.addClass('is-expanding');

                $cell.not($thisCell).removeClass('is-expanded');
                $cell.not($thisCell).addClass('is-collapsing');
                setTimeout(function () {
                    $thisCell.removeClass('is-expanding');
                    $thisCell.addClass('is-expanded');
                    $cell.not($thisCell).removeClass('is-collapsing');
                    $cell.not($thisCell).addClass('is-collapsed');
                }, 150);
            } else {
                $cell.removeClass('is-expanded').addClass('is-collapsed');
                $cell.not($thisCell).removeClass('is-inactive');
            }
        });
        $cell.find('.js-collapser').click(function () {
            $cell.removeClass('is-expanded').addClass('is-collapsed');
            var $thisCell = $(this).closest('.card');
            $cell.not($thisCell).removeClass('is-inactive');
        });
    }

    getDb(buildUI);

   /*
   window.players = [{
        playerId: 17,
        username: "prich",
        picture: "none",
        sem: "table",
        playerGames: {}
    },{
        playerId: 15,
        username: "felix",
        picture: "none",
        sem: "table",
        playerGames: {}
    }];

    window.currentGame = {
        gameId: "666",
        started: "27.11.2023 24:59",
        players: players,
        winner: players.at(0),
        currentPlayer: players.at(1),
        mode: {
            sets: 2,
            legs: 2,
            bestOfSets: true,
            bestOfLegs: false,
            doubleOut: true,
            doubleIn: false,
            startingMode: {
                newGameAction: "Bullseye",
                newSetAction: "",
                newLegAction: ""
            }
        }
    };

    window.throw = {
        score: 50,
        x: null,
        y: null,
        finish: false,
        over: false
    };

    window.turn = {
        id: players.at(0).playerId,
        throws: [window.throw],
        timestamp: "24:00Uhr"
    }

    window.turngroup = {
        type: "set",
        turngroup: [{
            type: "leg",
            turngroup: [window.turn],
            playerOrder: players,
            winner: {}
        }],
        playerOrder: players,
        winner: {}
    }
    //console.log(window.dartPlayers);
    window.games = [{
        gameId: "333",
        started: "27.11.2023 24:59",
        players: players,
        winner: players.at(0),
        mode: {
            sets: 2,
            legs: 2,
            bestOfSets: true,
            bestOfLegs: false,
            doubleOut: true,
            doubleIn: false,
            startingMode: {
                newGameAction: "Bullseye",
                newSetAction: "",
                newLegAction: ""
            }
        },
        turngroup: {
            type: "leg",
            turngroup: [window.turn],
            playerOrder: players,
            winner: {}
        }
    }];
    //console.log(window.games);

    // settings
    window.settings = {
        darkMode: false,
        defaultGameMode: "501",
        defaultSem: "total"
    };
    */

});