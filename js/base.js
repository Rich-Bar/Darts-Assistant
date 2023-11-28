$(() => {
    window.players = null;
    window.games = null;
    window.activeGames = null;
    window.settings = null;
    function getDb(callback) {
        var open = window.indexedDB.open("DartsDatabase", 3);
        open.onupgradeneeded = function(){
            var db = open.result;
            if (!db.objectStoreNames.contains("ActiveGamesStorage")) db.createObjectStore("ActiveGamesStorage", {keyPath: "gameId"});
            if (!db.objectStoreNames.contains("GamesStorage")) db.createObjectStore("GamesStorage", {keyPath: "gameId"});
            if (!db.objectStoreNames.contains("PlayersStorage")) db.createObjectStore("PlayersStorage", {keyPath: "playerId"});
        };
        open.onsuccess = function () {
            // Start a new transaction
            var db = open.result;
            var txActiveGames = db.transaction("ActiveGamesStorage", "readwrite");
            var activeGamesStore = txActiveGames.objectStore("ActiveGamesStorage");
            var getActiveGames = activeGamesStore.getAll()
            getActiveGames.onsuccess = function () {
                window.activeGames = getActiveGames.result;
            };
            var txGames = db.transaction("GamesStorage", "readwrite");
            var gamesStore = txGames.objectStore("GamesStorage");
            var getGames = gamesStore.getAll()
            getGames.onsuccess = function () {
                window.games = getGames.result;
            };
            var txPlayers = db.transaction("PlayersStorage", "readwrite");
            var playersStore = txPlayers.objectStore("PlayersStorage");
            var getPlayers = playersStore.getAll();
            getPlayers.onsuccess = function () {
                window.players = getPlayers.result;
                if(games && activeGames) {
                    callback();
                }
            };

            // Close the db when the transaction is done
            txGames.oncomplete = function () {
                db.close();
            };
            // Close the db when the transaction is done
            txPlayers.oncomplete = function () {
                db.close();
            };
            txActiveGames.oncomplete = function () {
                db.close();
            };
        }
    }

    function pushDataIntervall() {
        setInterval(function(){
            console.log("push data");
            pushData();
        }, 60000)
    }
    getDb(pushDataIntervall);
   /* window.players = [{
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
        playerId: players.at(0).playerId,
        Throw: [window.throw],
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
    // set settings as cookie
    document.cookie = "settings="+JSON.stringify(settings)+" expires=Thu, 18 Dec 2024 12:00:00 UTC; path=/";


    // Create the schema
    function pushData(){
        var open = window.indexedDB.open("DartsDatabase", 3);

        open.onsuccess = function () {
            // Start a new transaction
            var db = open.result;
            var txGames = db.transaction("GamesStorage", "readwrite");
            var txPlayers = db.transaction("PlayersStorage", "readwrite");
            var gamesStore = txGames.objectStore("GamesStorage");
            var playersStore = txPlayers.objectStore("PlayersStorage");
            var txActiveGames = db.transaction("ActiveGamesStorage", "readwrite");
            var activeGamesStore = txActiveGames.objectStore("ActiveGamesStorage");

            // Add some data
            games.forEach(game => gamesStore.put(game));
            players.forEach(player => playersStore.put(player));
            activeGames.forEach(activeGame => activeGamesStore.put(activeGame));
            // Close the db when the transaction is done
            txGames.oncomplete = function () {
                db.close();
            };
            // Close the db when the transaction is done
            txPlayers.oncomplete = function () {
                db.close();
            };
            txActiveGames.oncomplete = function () {
                db.close();
            };
        }
    }
});