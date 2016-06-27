/* global PerlinNoise */

var Map = function() {
  
    this.size = 4000;
    this.density = 50;
    this.tiles = [];
        
    var tile_size = this.size / this.density;
    
    var d = Math.sqrt(this.density) * 3;

    for (var i = 0; i < this.density; i++) {
        
        for (var j = 0; j < this.density; j++) {
            
            this.tiles.push(new Tile(
                i * tile_size, j * tile_size, tile_size, 
                PerlinNoise.noise(i / d, j / d) + Math.random() / 10
            ));
            
        }
        
    }
    
    this.draw = function(game) {
        
        for (var i = 0; i < this.tiles.length; i++) {
            
            this.tiles[i].draw(game);
            
        }
        
    };
    
    this.draw_minimap = function(game) {
        
        for (var i = 0; i < this.tiles.length; i++) {
            
            this.tiles[i].draw_minimap(game);
            
        }
        
    };
    
};

var Tile = function(x, y, size, noise_val) {
    
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = "hsl(" + parseInt(noise_val * 250) + ", " + parseInt(noise_val * 30, 10) + "%, " 
        + parseInt(noise_val * 50, 10) + "%)";
    //this.color = "hsl(" + parseInt(noise_val * 25 + 140, 10) + ", 50%, 50%)";
    
    this.draw = function(game) {
        
        game.graphics.rect(this.x, this.y, this.size, this.size, this.color);
        
        // game.context.fillStyle = this.color;
        // game.context.fillRect(this.x, this.y, this.size, this.size);
        
    };
    
    this.draw_minimap = function(game) {
        
        game.graphics.minimap_rect(this.x, this.y, this.size, this.size, this.color);
        
    };
    
};

var Camera = function(w, h) {
    
    this.offset_x = 0;
    this.offset_y = 0;
    this.w = w;
    this.h = h;
    this.target = null;
    
    this.scale = 5;
    
    this.scale_goal = 5;
    
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
        
        if (this.scale != this.scale_goal) {
            
            this.scale += (this.scale_goal - this.scale) / 50;
            
        };
      
        this.offset_x = this.w / (2 * this.scale) - this.target.pos().x;
        this.offset_y = this.h / (2 * this.scale) - this.target.pos().y;
        
    };
    
};

var Graphics = function(game) {
    
    this.camera = game.camera;
    this.context = game.context;
    
    this.minimap = game.mm_context;
    this.map_size = game.map.size;
    this.minimap_size = game.mm_canvas.width;
    
    // should be the size of the largest object in the game
    // so it doesn't get culled (drink!)
    
    // current max radius: 282
    this.safe_zone = 300;
        
    var self = this;
    
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
    
    this.pointer = function(x, y, size, color, dir) {
        
        var p_dir = dir - Math.PI * 3 / 4;
        
        var tl = this.camera.apply(x, y);
        
        // translate to point of rotation
        this.context.translate(tl.x, tl.y);
        // rotate by dir
        this.context.rotate(p_dir);
        // translate back
        this.context.translate(-tl.x, -tl.y);
        
        this.rect(x, y, size * 7/8, size * 7/8, color);
        
        this.context.translate(tl.x, tl.y);
        this.context.rotate(-p_dir);
        this.context.translate(-tl.x, -tl.y);
        
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
    
    this.minimap_dot = function(x, y, size, color) {
            
        var tl = this.camera.apply(x, y);
        
        if (this.out_of_bounds(tl)) return;
        
        this.minimap.fillStyle = color;
        
        x = x / this.map_size * this.minimap_size;
        y = y / this.map_size * this.minimap_size;
        size = size / this.map_size * this.minimap_size;
        
        this.minimap.beginPath();
        this.minimap.arc(x, y, size, 0, Math.PI * 2);
        this.minimap.fill();
        
    };
    
    this.minimap_ring = function(x, y, size) {
        
        this.minimap.strokeStyle = "#FFF";
        
        x = x / this.map_size * this.minimap_size;
        y = y / this.map_size * this.minimap_size;
        size = size / this.map_size * this.minimap_size;
        
        this.minimap.beginPath();
        this.minimap.arc(x, y, size, 0, Math.PI * 2);
        this.minimap.stroke();
        
    };
    
    this.minimap_rect = function(x, y, w, h, color) {
        
        var norm = function(v) {
            return v / self.map_size * self.minimap_size;
        }
        
        this.minimap.fillStyle = color;
        x = norm(x);
        y = norm(y);
        w = norm(w);
        h = norm(h);
        
        this.minimap.fillRect(x, y, w, h);
        
    };
    
};