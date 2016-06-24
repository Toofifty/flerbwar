/* global PerlinNoise */

var Map = function() {
  
    this.size = 4000;
    this.density = 80;
    this.tiles = [];
        
    var tile_size = this.size / this.density;
    
    var d = Math.sqrt(this.density);

    for (var i = 0; i < this.density; i++) {
        
        for (var j = 0; j < this.density; j++) {
            
            this.tiles.push(new Tile(
                i * tile_size, j * tile_size, tile_size, 
                PerlinNoise.noise(i / d, j / d)
            ));
            
        }
        
    }
    
    this.draw = function(game) {
        
        for (var i = 0; i < this.tiles.length; i++) {
            
            this.tiles[i].draw(game);
            
        }
        
    };
    
};

var Tile = function(x, y, size, noise_val) {
    
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = "hsl(200, " + parseInt(noise_val * 75, 10) + "%, " 
        + parseInt(noise_val * 75, 10) + "%)";
    //this.color = "hsl(" + parseInt(noise_val * 25 + 140, 10) + ", 50%, 50%)";
    
    this.draw = function(game) {
        
        game.graphics.rect(this.x, this.y, this.size, this.size, this.color);
        
        // game.context.fillStyle = this.color;
        // game.context.fillRect(this.x, this.y, this.size, this.size);
        
    };
    
};

var Camera = function(w, h) {
    
    this.offset_x = 0;
    this.offset_y = 0;
    this.w = w;
    this.h = h;
    this.target = null;
    
    this.scale = 5;
    
    this.resize = function(w, h) {
        
        this.w = w;
        this.h = h;
        
    };
    
    this.apply = function(x, y) {
        
        return {
            x: (x + this.offset_x) * this.scale, 
            y: (y + this.offset_y) * this.scale
        };
        
    };
    
    this.apply_scale = function(w, h) {
        
        if (h) return {w: w * this.scale, h: h * this.scale};
        else return w * this.scale;
        
    }
    
    this.focus = function(object) {
        
        this.target = object;
        
    };
    
    this.update = function() {
        
        if (this.target == null) return;
      
        this.offset_x = this.w / (2 * this.scale) - this.target.x;
        this.offset_y = this.h / (2 * this.scale) - this.target.y;
        
    };
    
};

var Graphics = function(game) {
    
    this.camera = game.camera;
    this.context = game.context;
    
    // should be the size of the largest object in the game
    // so it doesn't get culled (drink!)
    this.safe_zone = 250;
    
    this.out_of_bounds = function(pos) {
        
        return pos.x > this.camera.w + this.safe_zone * this.camera.scale
            || pos.x < 0 - this.safe_zone * this.camera.scale
            || pos.y > this.camera.h + this.safe_zone * this.camera.scale
            || pos.y < 0 - this.safe_zone * this.camera.scale;
        
    };
    
    this.circle = function(x, y, radius, color) {
        
        if (color !== undefined)
            this.context.fillStyle = color;
            
        var tl = this.camera.apply(x, y);
        radius = this.camera.apply_scale(radius);
        
        if (this.out_of_bounds(tl)) return;
        
        this.context.beginPath();
        this.context.arc(tl.x, tl.y, radius, 0, Math.PI * 2);
        this.context.fill();
        
    };
    
    this.rect = function(x, y, w, h, color) {
        
        if (color !== undefined)
            this.context.fillStyle = color;
            
        var tl = this.camera.apply(x, y);
        var rs = this.camera.apply_scale(w, h);
        
        if (this.out_of_bounds(tl)) return;
        
        this.context.fillRect(tl.x, tl.y, rs.w + 1, rs.h + 1);
        
    };
    
    this.text = function(text, x, y, color) {
        
        if (color !== undefined)
            this.context.fillStyle = color;
        else
		    this.context.fillStyle = "#FFF";
            
        var tl = this.camera.apply(x, y);
        
        if (this.out_of_bounds(tl)) return;
		    
		this.context.fillText(text, tl.x, tl.y);  
        
    };
    
};