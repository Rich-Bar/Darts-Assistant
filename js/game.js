window.fields = [6,10,15,2,17,3,19,7,16,8,11,14,9,12,5,20,1,18,4,13];
    
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
//via board
window.calculateScore = function(x, y){
    let boardSize = $("section.overlays .dart-board .board img").innerWidth();
    let center = {
        x: $('section.overlays .dart-board .board img').innerWidth()/2 ,
        y:$('section.overlays .dart-board .board img').innerHeight()/2
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
    return {points:scored, angle:angle, distance:distance, x:x, y:y};
}

window.dbloaded = ()=>{
    
    $("section.game .scoreboard .turn > input").on('change', calculateThrow);
    $("section.overlays .dart-board .board img").click(function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        //Check if already thrown
        if($("section.overlays .dart-board .board > span").length == 3){
            $("section.overlays .dart-board .board > span").remove();
            return;
        }
        let boardSize = $("section.overlays .dart-board .board img").innerWidth();
        
        let scored = calculateScore(e.offsetX, e.offsetY);
        console.log(scored);
        if(scored == null) return;
        //Place Position Marker
        var halfCrosshairSize = Math.floor(boardSize / 50);
        let crossHair = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" style="top: '+ (-halfCrosshairSize+e.offsetY) +'px;left: '+ (-halfCrosshairSize + e.offsetX) +'px;"></span>');
        let crossHairClick = function(e){
            e.stopImmediatePropagation();
            //Check if already thrown
            if($("section.overlays .dart-board .board > span").length == 3){
                $("section.overlays .dart-board .board > span").remove();
                return;
            }
            let boardX = e.offsetX + parseInt($(e.target).css('left').replace('px',''));
            let boardY = e.offsetY + parseInt($(e.target).css('top').replace('px',''));
            if(Number.isNaN(boardY) || Number.isNaN(boardX)) return;
            
            let scored = calculateScore(boardX, boardY);
            if(scored == null) return;
            console.log(scored);
            let crossHairr = $('section.overlays .dart-board .board').append('<span class="ui-draggable ui-draggable-handle" style="top: '+ (-halfCrosshairSize+boardY) +'px;left: '+ (-halfCrosshairSize + boardX) +'px;"></span>');
            crossHairr.on("click", crossHairClick);
            $('section.overlays .dart-board .board > span').draggable({
                stop: function( e, ui) {
                    let scored = calculateScore(ui.position.left + halfCrosshairSize, ui.position.top + halfCrosshairSize);
                    if(scored == null) return;
                    console.log(scored);
                }
            });
        };
        crossHair.click(crossHairClick);
    });
}