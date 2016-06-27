/*
 * ui.js - interactive UI elements from HTML
 */
 
/* global $ game two_dec escape_html */

var log_message;
var update_hs, update_info;
    
var format_mass = function(mass) {
    
    mass *= 100;
   
    return mass.toFixed(0).replace(/./g, function(c, i, a) {
        return i && c !== "." && ((a.length - i) % 3 === 0) ? ',' + c : c;
    });
    
};
 
$(document).ready(function() {
 
    var $name_area = $("#player-name");
    var $name_submit = $("#submit-player-name");
    
    $name_area.val(game.local_player.name());
    
    $name_submit.click(function(event) {
        
        if ($name_area.val() == game.local_player.name()) return;
       
       event.stopPropagation();
       event.preventDefault();
       
       if ($name_area.val().length >= 20) return;
       
       game.set_local_player_name($name_area.val());
        
    });
    
    $("#name-input").keydown(function(event) {
        event.stopPropagation();
    }).mouseleave(function() {
        $("button").blur();
    });
    
    var $log = $("#log");
    var MAX_MESSAGES = 15;
    
    log_message = function(message) {
        
        $log.append("<p>" + escape_html(message) + "</p>");
        
        if ($log.children().length > MAX_MESSAGES)
            $log.html($log.children().splice(1, MAX_MESSAGES));
        
    };
    
    var $smallest = $("#sb-smallest");
    var $largest = $("#sb-largest");
    
    var sm_init = $smallest.html();
    var la_init = $largest.html();
    
    var top_player = null;
    
    update_hs = function(players) {
        
        var top = 3;
        
        var sorted = [players[0]];
        
        for (var i in players) {
            
            if (i == 0) continue;
            
            for (var j in sorted) {
                
                if (players[i].mass() >= sorted[j].mass()) {
                    
                    sorted.splice(j, 0, players[i]);
                    break;
                    
                } else if (j == sorted.length - 1) {
                    
                    sorted.push(players[i]);
                    break;
                    
                }
                
            }
            
        }
        
        if (top_player == null || top_player != sorted[0]) {
            
            top_player = sorted[0];
            
            log_message(top_player.name() + " is now in the lead!");
            
        }
        
        var out = "";
        var mass;
        
        for (var i = 0; i < top && i < sorted.length; i++) {
            
            mass = format_mass(sorted[i].mass());
            
            out += "<p>#" +(i + 1) + ". " + escape_html(sorted[i].name()) + "<br>" + mass + "</p>";
            
        }
        
        $largest.html(la_init + out);
        
        out = "";
        
        for (var i = sorted.length - 1; i >= sorted.length - top && i >= 0; i--) {
            
            mass = format_mass(sorted[i].mass());
            
            out += "<p>#" +(i + 1) + ". " + escape_html(sorted[i].name()) + "<br>" + mass + "</p>";
            
        }
        
        $smallest.html(sm_init + out);
        
    };
    
    var $info = $("#info-pane");
    var in_init = $info.html();
    
    update_info = function(player) {
        
        var info_html = in_init;
        
        var combined_mass = "Total game mass: " + format_mass(game.total_mass());
        
        var current_mass = "Your mass: " + format_mass(player.mass());
        
        var percentage = "(" + game.players_percentage().toFixed(2) + "% of total)";
        
        var shot_mass = "Shot mass: " + format_mass(player.projectile_mass());
        
        $info.html(info_html
            .replace("{current mass}", current_mass)
            .replace("{shot mass}", shot_mass)
            .replace("{combined mass}", combined_mass)
            .replace("{percentage}", percentage)
        );
        
    };
    
});