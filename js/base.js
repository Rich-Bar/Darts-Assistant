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

window.saveDB = (callback)=>{// set settings as cookie
    document.cookie = "settings="+JSON.stringify((window.settings||{}))+" expires=Thu, 18 Dec 2024 12:00:00 UTC; path=/";
    // Create the schema
    var open = window.indexedDB.open("DartsDatabase", 1);
    
    open.onupgradeneeded = function () {
        var db = open.result;
        var gamesStore = db.createObjectStore("GamesStorage", {keyPath: "id"});
        var playersStore = db.createObjectStore("PlayersStorage", {keyPath: "id"})
        var activeGamesStore = db.createObjectStore("ActiveGamesStorage", {keyPath: "id"})
    };

    open.onsuccess = function () {
        // Start a new transaction
        var db = open.result;
        var txGames = db.transaction("GamesStorage", "readwrite");
        var txActiveGames = db.transaction("ActiveGamesStorage", "readwrite");
        var txPlayers = db.transaction("PlayersStorage", "readwrite");
        var gamesStore = txGames.objectStore("GamesStorage");
        var activeGamesStore = txActiveGames.objectStore("ActiveGamesStorage");
        var playersStore = txPlayers.objectStore("PlayersStorage");
        var waitFor = 3;
        // Add some data
        games.forEach(game => gamesStore.put(game));
        activeGames.forEach(game => activeGamesStore.put(game));
        players.forEach(player => playersStore.put(player));

        // Close the db when the transaction is done
        txActiveGames.oncomplete = function () {
            db.close();
            if(--waitFor == 0 && callback) callback();
        };
        // Close the db when the transaction is done
        txGames.oncomplete = function () {
                db.close();
                if(--waitFor == 0 && callback) callback();
        };
        // Close the db when the transaction is done
        txPlayers.oncomplete = function () {
                db.close();
                if(--waitFor == 0 && callback) callback();
        };
    }
};

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
        if(window.dbloaded)window.dbloaded();

        // Autosave to IndexedDB
        setInterval(saveDB, 15000);
        
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
        if((window.activeGames||[]).length){
            $('.main-menu a.disabled').removeClass('disabled');
            (window.activeGames||[]).forEach((ag)=>{
                $('.game-selector').append(`<diV>${new Date(ag.started||0).toLocaleString()}</div>`);
            });
        }
        // Setup Listeners
        $('button.start-game').on("click touchdown", ()=>{
            window.currentGame = {
                id: generateUUID(),
                started: Date.now(),
                players: $('.player-selector > div.active').map((i,el) => $(el).attr('data-id')).get(),
                startingPoints: $('.game-settings input[name="startingPoints"]').val(),
                legs: $('.game-settings input[name="legs"]').val(),
                sets: $('.game-settings input[name="sets"]').val(),
                bestOfLegs: $('.game-settings input[name="bestOfLegs"]').is(':checked'),
                bestOfSets: $('.game-settings input[name="bestOfSets"]').is(':checked'),
                doubleIn: $('.game-settings input[name="doubleIn"]').is(':checked'),
                doubleOut: $('.game-settings input[name="doubleOut"]').is(':checked'),
                gameAction: $('.game-settings select[name="gameAction"]').val(),
                legAction: $('.game-settings select[name="legAction"]').val(),
                setAction: $('.game-settings select[name="setAction"]').val(),
                playing:true,
                turns:[]
            };
            (window.activeGames||[]).forEach((ag)=> ag.playing = false);
            window.activeGames = [...(window.activeGames||[]), currentGame];
            saveDB(()=>{window.location.href = "game.html";});
        });
        $('button.continue-game').on("click touchdown", ()=>{

        });
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
                let player = {
                    id: generateUUID(),
                    username: form.find('input[name="username"]').val(),
                    sem: form.find('select[name="sem"]').val()
                };
                window.players.push(player);
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
                saveDB();
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
    // JQuery pressEnter event
    $.fn.pressEnter = function(fn) {  
        return this.each(function() {  
            $(this).bind('enterPress', fn);
            $(this).keyup(function(e){
                if(e.keyCode == 13){$(this).trigger("enterPress", e);}
            })
        });  
     };

    getDb(buildUI);

});