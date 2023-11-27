$(() => {


    window.players = [{
        playerId: 13,
        username: "drich",
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
        gameId: "333",
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
    // set settings as cookie
    document.cookie = "settings="+JSON.stringify(settings)+" expires=Thu, 18 Dec 2024 12:00:00 UTC; path=/";


// open (or create) db
    var open = window.indexedDB.open("DartsDatabase", 1);

// Create the schema
    open.onupgradeneeded = function () {
        var db = open.result;
        var gamesStore = db.createObjectStore("GamesStorage", {keyPath: "gameId"});
        var playersStore = db.createObjectStore("PlayersStorage", {keyPath: "playerId"})
    };

    open.onsuccess = function () {
        // Start a new transaction
        var db = open.result;
        var txGames = db.transaction("GamesStorage", "readwrite");
        var txPlayers = db.transaction("PlayersStorage", "readwrite");
        var gamesStore = txGames.objectStore("GamesStorage");
        var playersStore = txPlayers.objectStore("PlayersStorage");

        // Add some data
        gamesStore.put(games.at(0));
        playersStore.put(players.at(0));
        playersStore.put(players.at(1));

        // Close the db when the transaction is done
        txGames.oncomplete = function () {
            db.close();
        };
        // Close the db when the transaction is done
        txPlayers.oncomplete = function () {
            db.close();
        };
    }

});