var Unshredder;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
Unshredder = (function() {
  function Unshredder(target) {
    this.target = target;
    this.cursor = 0;
    this.img = document.getElementsByTagName("img")[0];
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }
  Unshredder.prototype.initialize = function(slice_width) {
    this.slices = [];
    this.ordering = [];
    this.sums = {};
    this.edges = {};
    this.matches = {};
    this.minimums = {};
    this.order_map = {};
    if (slice_width) {
      this.slice_width = slice_width;
    }
    if (!this.initialized) {
      this.target.innerHTML = '';
      this.target.appendChild(this.canvas);
      this.canvas.width = Math.round(this.img.width / 10) * 10;
      this.canvas.height = Math.round(this.img.height / 10) * 10;
      this.ctx.drawImage(this.img, 0, 0);
      return this.initialized = true;
    }
  };
  Unshredder.prototype.load = function(path) {
    this.img = new Image();
    this.img.onload = __bind(function() {
      this.target.innerHTML = '';
      this.target.appendChild(this.img);
      return this.initialized = false;
    }, this);
    return this.img.src = path;
  };
  Unshredder.prototype.unshred = function() {
    var fn, _i, _len, _ref, _results;
    _ref = ['initialize', 'split', 'compare', 'match', 'order', 'draw', 'check', 'text'];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      fn = _ref[_i];
      _results.push(this[fn]());
    }
    return _results;
  };
  Unshredder.prototype.text = function() {
    var x, y, _results;
    x = 0;
    _results = [];
    while (x < this.canvas.width) {
      this.ctx.fillStyle = "red";
      this.ctx.font = "13pt arial";
      y = x - this.slice_width / 2;
      if (x < this.slice_width / 2) {
        y = this.slice_width / 2;
      }
      this.ctx.fillText(x % (this.slice_width - 1), y, 10);
      _results.push(x += this.slice_width);
    }
    return _results;
  };
  Unshredder.prototype.shred = function(slices) {
    var num, randomSort, width;
    if (slices == null) {
      slices = 20;
    }
    this.initialize();
    width = parseInt(this.canvas.width) / slices;
    this.initialized = false;
    this.initialize(width);
    this.split();
    this.ordering = (function() {
      var _ref, _results;
      _results = [];
      for (num = 0, _ref = this.slices.length - 1; 0 <= _ref ? num <= _ref : num >= _ref; 0 <= _ref ? num++ : num--) {
        _results.push(num);
      }
      return _results;
    }).call(this);
    randomSort = function(a, b) {
      return parseInt(Math.random() * 10) % 2;
    };
    this.ordering = this.ordering.sort(randomSort);
    return this.draw();
  };
  Unshredder.prototype.split = function() {
    var x, y, _results;
    x = 0;
    y = 0;
    this.slices = [];
    _results = [];
    while (x < parseInt(this.canvas.width)) {
      this.slices.push(this.ctx.getImageData(x, 0, this.slice_width, this.canvas.height));
      this.edges[y] = {
        left: this.ctx.getImageData(x, 0, 1, this.canvas.height),
        right: this.ctx.getImageData((x + this.slice_width) - 1, 0, 1, this.canvas.height)
      };
      x += this.slice_width;
      _results.push(y += 1);
    }
    return _results;
  };
  Unshredder.prototype.compare = function() {
    var x, y, _results;
    x = y = 0;
    _results = [];
    for (x in this.edges) {
      _results.push((function() {
        var _results2;
        _results2 = [];
        for (y in this.edges) {
          _results2.push(y !== x ? this.compareEdges(x, y, this.edges[x]['left'].data, this.edges[y]['right'].data) : void 0);
        }
        return _results2;
      }).call(this));
    }
    return _results;
  };
  Unshredder.prototype.match = function() {
    var bucket, distance, key, _results;
    for (bucket in this.sums) {
      for (key in this.sums[bucket]) {
        distance = this.sums[bucket][key];
        if ((distance < this.minimums[bucket]) || !this.minimums[bucket]) {
          this.minimums[bucket] = distance;
          this.matches[bucket] = key;
        }
      }
    }
    _results = [];
    for (bucket in this.matches) {
      _results.push(this.order_map[this.matches[bucket]] = bucket);
    }
    return _results;
  };
  Unshredder.prototype.order = function(cursor) {
    var x, _results;
    if (cursor == null) {
      cursor = this.cursor;
    }
    if (!(this.slices.length > 0) || !(this.cursor >= 0)) {
      return false;
    }
    x = 0;
    this.ordering = [];
    _results = [];
    while ((this.ordering.length < this.slices.length) && x < 999) {
      if (this.ordering.indexOf(this.cursor) >= 0) {
        this.ordering.splice(this.cursor);
      }
      this.ordering.push(this.cursor);
      this.cursor = this.order_map[this.cursor];
      _results.push(x += 1);
    }
    return _results;
  };
  Unshredder.prototype.draw = function() {
    var pos, x, _i, _len, _ref, _results;
    x = 0;
    _ref = this.ordering;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      pos = _ref[_i];
      if (this.slices[pos]) {
        this.ctx.putImageData(this.slices[pos], x, 0);
      }
      _results.push(x += this.slice_width);
    }
    return _results;
  };
  Unshredder.prototype.check = function() {
    var result;
    console.log("checking...");
    result = this.detectSliceWidth(true);
    if (result) {
      console.log("result: " + result);
      this.cursor = parseInt(result[0] / this.slice_width);
      return console.log("@cursor: " + this.cursor);
    } else {
      return console.log("done");
    }
  };
  Unshredder.prototype.detectSliceWidth = function(mode) {
    var average, data, max, pixels, result, rgb, row, sum, threshold, value, x, _i, _len, _ref;
    if (mode == null) {
      mode = false;
    }
    result = [];
    _ref = [5, this.canvas.height / 2, this.canvas.height - 5];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      data = this.ctx.getImageData(0, row - 1, this.canvas.width, row + 1).data;
      pixels = [];
      x = 0;
      max = 0;
      sum = 0;
      while (x < parseInt(this.canvas.width)) {
        rgb = this.getRGB(data, row, x);
        value = rgb[0] + rgb[1] + rgb[2];
        if (value) {
          sum += value;
          if (value > max) {
            max = Math.sqrt(Math.pow(value, 2));
          }
          pixels.push(rgb[0] + rgb[1] + rgb[2]);
        }
        x += 1;
      }
      average = sum / pixels.length;
      threshold = Math.sqrt(Math.pow(max - average, 2));
      x = 0;
      while (x < pixels.length) {
        if (x > 0) {
          if (Math.abs(pixels[x] - pixels[x - 1]) > threshold) {
            result.push(x);
            console.log("exception! " + x + " " + pixels[x]);
          }
        }
        x += 1;
      }
    }
    return result;
  };
  Unshredder.prototype.compareEdges = function(bucket, key, a1, a2) {
    var bdelta, gdelta, rdelta, rgb1, rgb2, x;
    if (!this.sums[bucket]) {
      this.sums[bucket] = {};
    }
    this.sums[bucket][key] = 0;
    x = 0;
    while (x < this.canvas.height) {
      rgb1 = this.getRGB(a1, x);
      rgb2 = this.getRGB(a2, x);
      rdelta = Math.abs(rgb1[0] - rgb2[0]);
      gdelta = Math.abs(rgb1[1] - rgb2[1]);
      bdelta = Math.abs(rgb1[2] - rgb2[2]);
      this.sums[bucket][key] += (rdelta + gdelta + bdelta) / 3;
      x += 1;
    }
    return this.sums[bucket][key];
  };
  Unshredder.prototype.getRGB = function(data, row, column) {
    var result, x, _i, _len, _ref;
    if (column == null) {
      column = 0;
    }
    result = [];
    _ref = [0, 1, 2];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      x = _ref[_i];
      result.push(data[(row * 4) + (column * 4) + x]);
    }
    return result;
  };
  return Unshredder;
})();