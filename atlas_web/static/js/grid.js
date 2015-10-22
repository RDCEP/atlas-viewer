(function() {

  var world, data, grid_regions, tl, br
    , height = window.innerHeight
    , width = window.innerWidth
    , current_year = 1979
    , sens = .5
    , _time = 0
    //, start_year = 1979
    //, end_year = 2012
    //, _scen = 0
    //, _irr = 0

    , svg = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
      .append('g')
    , defs = svg.append('defs')
    , ocean_layer = svg.append('g')
    , grid_layer = svg.append('g')


    , color = d3.scale.quantile()
      .range(['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404'])

    , projection = d3.geo.equirectangular()
      .center([Options.lon, Options.lat])
      .scale(2900)
      .translate([width / 2, height / 2])
      .precision(.1)
    , path = d3.geo.path()
      .projection(projection)
    , graticule = d3.geo.graticule()

    , drag_rotate = d3.behavior.drag()
      .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
      .on('drag', dragged)
    , scroll_zoom = d3.behavior.zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .scaleExtent([height, 8 * height])
      .on('zoom', null)
    ;

  function dragged() {
    var λ = d3.event.x * sens
      , φ = d3.event.y * sens
      , c = projection.center()
      , upper_drag_limit = projection([0, 90])[1]
      , lower_drag_limit = projection([0, -90])[1] - height
    ;
    tl = projection.invert([0,0]);
    br = projection.invert([width, height]);
    φ = φ > lower_drag_limit ? lower_drag_limit :
    φ < upper_drag_limit ? upper_drag_limit :
    φ;
    projection.center(projection.invert([width / 2 - λ, height / 2 - φ]));
    path.projection(projection);
    svg.selectAll('.boundary').attr('d', path);
  }

  var update_projection = function(w, h) {
    return (width / 6) * 360 / (42);
  };

  var resize = function() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2]);
    projection.scale(update_projection(width, height, data));
    //projection.center(data.center);
    d3.selectAll('.boundary').attr('d', path);
  };

  var update_data_fills = function() {
    grid_regions.each(function(d, i) {
      d3.select(this).style({
        fill: function() {
          if (d.properties.var[_time] < 1000000) {
            return color(d.properties.var[_time]);
          }
          return 'transparent';
        }
      });
    });
  };

  var atlas = function(error, queued_data) {

    data = queued_data[0];
    console.log(data);
    //data = Options.data;
    projection.scale(update_projection(width, height));
    //projection.center(data.center);

    color.domain([d3.min(data, function(d) { return d.properties.value; }),
                  d3.max(data, function(d) { return d.properties.value; })]);

    var sphere = [
      ocean_layer.append('path')
        .datum({type: 'Sphere'})
        .attr('id', 'sphere')
        .attr('d', path)
        .attr('class', 'boundary'),
      ocean_layer.append('use')
        .attr('class', 'stroke')
        .attr('xlink:href', '#sphere')
      ];

    ocean_layer.append('path')
      .datum(graticule)
      .attr('class', 'graticule boundary')
      .attr('d', path)
      .style({
        stroke: '#B4D5E5',
        'stroke-width': '1px',
        fill: 'transparent'
      });

    grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data)
      .enter()
      .append('path')
      .filter(function(d) {
        //Leave out cells that contain NaNs
        return d.properties.var.reduce(function(a, b){ return a + b; }) >= 0;
      })
      .attr('class', 'grid-boundary boundary')
      .attr('d', path);

    update_data_fills(data);
    svg.call(drag_rotate);

  };

  tl = projection.invert([0, 0]);
  br = projection.invert([width, height]);

  queue()
    //.defer(d3.json, '/static/topojson/atlas_gadm1.json')
    .defer(d3.json, '/api/'+tl[0]+'/'+tl[1]+'/'+br[0]+'/'+br[1])
    .awaitAll(atlas);

  var time_opt = d3.select('#time_select');
  var time_label = d3.select('#menu_time label');
  time_opt.on('change', function() {
    _time = +d3.select(this).property('value');
    var _ctime = time_label.text();
    current_year = 1979 + _time;
    time_label.text(current_year);
    d3.select('#corner_legend [data-type="time"]').text(current_year);
    update_data_fills(data);
  });

  d3.select(window).on('resize', resize);

})();