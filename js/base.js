$(() => {

    window.players = [{
        playerId: 13,
        username: "drich",
        picture: "none",
        sem: "table"
    },{
        playerId: 15,
        username: "felix",
        picture: "none",
        sem: "table"
    }];
    //console.log(window.dartPlayers);
    window.games = [{
        gameId: "333",
        started: "27.11.2023 24:59",
        players: players,
        mode: {
            sets: 2,
            legs: 2,
            firstTo: true,
            doubleOut: true,
            doubleIn: false,
            startingMode: "Bullseye"
        },
        turngroup: {
            turngroup: {},
            playerOrder: players,
            winner: {}
        }
    },{
        gameId: "444",
        started: "27.11.2023 22:53",
        players: players,
        mode: {
            sets: 2,
            legs: 2,
            firstTo: true,
            doubleOut: true,
            doubleIn: false,
            startingMode: "Bullseye"
        },
        turngroup: {
            turngroup: {},
            playerOrder: players,
            winner: {}
        }
    }];
    //console.log(window.games);


    window.settings = {

    };


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
        gamesStore.put(games.at(1));
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