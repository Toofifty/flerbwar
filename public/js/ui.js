/*
 * ui.js - interactive UI elements from HTML
 */
 
/* global $ game two_dec escape_html */

var log_message;
var update_hs;
 
$(document).ready(function() {
 
    var $name_area = $("#player-name");
    var $name_submit = $("#submit-player-name");
    
    $name_area.val(game.local_player.name());
    
    $name_submit.click(function(event) {
       
       event.stopPropagation();
       event.preventDefault();
       
       if ($name_area.val().length >= 20) return;
       
       game.set_local_player_name($name_area.val());
        
    });
    
    var $log = $("#log");
    var MAX_MESSAGES = 20;
    
    log_message = function(message) {
        
        $log.append("<p>" + escape_html(message) + "</p>");
        
        if ($log.children().length > MAX_MESSAGES)
            $log.html($log.children().splice(1, MAX_MESSAGES));
        
    };
    
    var $smallest = $("#sb-smallest");
    var $largest = $("#sb-largest");
    
    var sm_init = $smallest.html();
    var la_init = $largest.html();
    
    update_hs = function(players) {
        
        var sorted = [players[0]];
        
        for (var i in players) {
            
            if (i == 0) continue;
            
            for (var j in sorted) {
                
                if (players[i].id() == players[j].id()) continue;
                
                if (players[i].size() >= players[j].size()) {
                    
                    sorted.splice(j, 0, players[i]);
                    
                } else if (j == sorted.length - 1) {
                    
                    sorted.push(players[i]);
                    
                }
                
            }
            
        }
        
        var out = "";
        
        for (var i = 0; i < 5 && i < sorted.length; i++) {
            
            out += "<p>" + escape_html(sorted[i].name()) + "<br>" + parseInt(two_dec(sorted[i].size()) * 100, 10) + "</p>";
            
        }
        
        $largest.html(la_init + out);
        
        out = "";
        
        for (var i = sorted.length - 1; i > sorted.length - 5 && i >= 0; i--) {
            
            out += "<p>" + escape_html(sorted[i].name()) + "<br>" + parseInt(two_dec(sorted[i].size()) * 100, 10) + "</p>";
            
        }
        
        $smallest.html(sm_init + out);
        
    };
    
});