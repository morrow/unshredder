class Unshredder

  constructor: (target)->
    @target = target
    @cursor = 0
    @img = document.getElementsByTagName("img")[0]
    @canvas = document.createElement('canvas')
    @ctx = @canvas.getContext('2d')

  initialize:(slice_width)->
    @slices = []
    @ordering = []
    @sums = {}
    @edges = {}
    @matches = {}
    @minimums = {}
    @order_map = {}
    @slice_width = slice_width if slice_width
    #@slice_width = @detectSliceWidth()[0] if not slice_width
    if not @initialized
      @target.innerHTML = ''
      @target.appendChild @canvas
      @canvas.width = Math.round(@img.width/10)*10
      @canvas.height = Math.round(@img.height/10)*10
      @ctx.drawImage(@img, 0, 0)
      @initialized = true

  load: (path)->
    @img = new Image()
    @img.onload = =>
      @target.innerHTML = ''
      @target.appendChild @img
      @initialized = false
    @img.src = path

  unshred: ->
    @[fn]() for fn in ['initialize', 'split', 'compare', 'match', 'order', 'draw', 'check', 'text']

  text:->
    x = 0 
    while x < @canvas.width
      @ctx.fillStyle = "red"
      @ctx.font = "13pt arial"
      y = x - @slice_width/2
      if x < @slice_width/2
        y = @slice_width/2
      @ctx.fillText (x % (@slice_width-1)), y, 10
      x+= @slice_width

  shred:(slices=20)->
    @initialize()
    width = parseInt(@canvas.width) / slices
    @initialized = false
    @initialize(width)
    @split()
    @ordering = (num for num in [0..@slices.length-1])
    randomSort = (a, b) -> parseInt(Math.random() * 10) % 2
    @ordering = @ordering.sort(randomSort)
    @draw()

  split: ->
    x = 0
    y = 0
    @slices = []
    while x < parseInt(@canvas.width)
      @slices.push @ctx.getImageData(x, 0, @slice_width, @canvas.height)
      @edges[y] =
        left:@ctx.getImageData(x, 0, 1, @canvas.height)
        right:@ctx.getImageData((x+@slice_width)-1, 0, 1, @canvas.height)
      x += @slice_width
      y += 1

  compare: ->
    x = y = 0
    for x of @edges
      for y of @edges
        if y != x
          @compareEdges x, y, @edges[x]['left'].data, @edges[y]['right'].data

  match: ->
    for bucket of @sums
      for key of @sums[bucket]
        distance = @sums[bucket][key]
        if (distance < @minimums[bucket]) or not @minimums[bucket]
          @minimums[bucket] = distance
          @matches[bucket] = key
    for bucket of @matches
      @order_map[@matches[bucket]] = bucket
    
  order:(cursor=@cursor) ->
    return false if not(@slices.length > 0) or not(@cursor >= 0)
    x = 0 
    @ordering = []
    while (@ordering.length < @slices.length) and x < 999
      @ordering.splice(@cursor) if @ordering.indexOf(@cursor) >= 0
      @ordering.push @cursor
      @cursor = @order_map[@cursor] 
      x += 1
        
  draw:->
    x = 0
    for pos in @ordering
      @ctx.putImageData(@slices[pos], x, 0) if @slices[pos]
      x += @slice_width

  check:->
    console.log "checking..."
    result = @detectSliceWidth(true)
    if result
      console.log "result: #{result}"
      @cursor = parseInt(result[0] / @slice_width)
      console.log "@cursor: #{@cursor}"
      #@unshred()
    else
      console.log "done"

  detectSliceWidth: (mode=false)->
    result = []
    for row in [5, @canvas.height/2, @canvas.height-5]
      data = @ctx.getImageData(0,row-1, @canvas.width, row+1).data
      pixels = []
      x = 0
      max = 0
      sum = 0
      while x < parseInt(@canvas.width)
        rgb = @getRGB(data, row, x)
        value = (rgb[0] + rgb[1] + rgb[2])
        if value
          sum += value
          max = Math.sqrt(Math.pow(value,2)) if value > max
          pixels.push (rgb[0] + rgb[1] + rgb[2])
        x += 1
      average = sum / pixels.length
      threshold = Math.sqrt(Math.pow((max - average),2))
      x = 0
      while x < pixels.length
        if x > 0
          if Math.abs(pixels[x]  - pixels[x-1]) > threshold
            result.push x
            console.log "exception! #{x} #{pixels[x]}"
        x += 1
    return result

  compareEdges: (bucket, key, a1, a2)->
    @sums[bucket] = {} if not @sums[bucket]
    @sums[bucket][key] = 0
    x = 0
    while x < @canvas.height
      rgb1 = @getRGB(a1, x)
      rgb2 = @getRGB(a2, x)
      rdelta = Math.abs(rgb1[0]-rgb2[0])
      gdelta = Math.abs(rgb1[1]-rgb2[1])
      bdelta = Math.abs(rgb1[2]-rgb2[2])
      @sums[bucket][key] += (rdelta + gdelta + bdelta) / 3
      x += 1
    return @sums[bucket][key]

  getRGB:(data, row, column=0)->
    result = []
    for x in [0,1,2]
      result.push data[(row * 4) + (column * 4) + x]
    return result