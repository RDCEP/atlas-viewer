(function() {

  var world, data, grid_regions, top_left, bottom_right
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
    , ocean_layer = svg.append('g')
    , grid_layer = svg.append('g')
      .attr('id', 'grid_layer')

    , color = d3.scale.quantile()
      .range(['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
              '#f16913', '#d94801', '#a63603', '#7f2704'])

    , projection = d3.geo.equirectangular()
      .center([Options.lon, Options.lat])
      .scale(1500)
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
    , hover_legend = d3.select('#hover_legend')
    ;

  function dragged() {
    var λ = d3.event.x * sens
      , φ = d3.event.y * sens
      , c = projection.center()
      , upper_drag_limit = projection([0, 90])[1]
      , lower_drag_limit = projection([0, -90])[1] - height
    ;
    φ = φ > lower_drag_limit ? lower_drag_limit :
    φ < upper_drag_limit ? upper_drag_limit :
    φ;
    projection.center(projection.invert([width / 2 - λ, height / 2 - φ]));
    path.projection(projection);
    svg.selectAll('.boundary').attr('d', path);
  }

  var update_projection = function(w, h, d) {
    return (width / 6) * 360 / (42);
  };

  var expand_lon = function(lon, left) {
    while (lon < left) {
      lon += 180;
    }
    return lon;
  };

  var compress_lon = function(lon) {
    return (lon / 180) % 1 * 180;
  };

  var limit_lat = function (lat) {

  };

  var get_viewport_dimensions = function() {
    top_left = projection.invert([0,0]);
    bottom_right = projection.invert([width, height]);
    top_right = [bottom_right[0], top_left[1]];
    bottom_left = [top_left[0], bottom_right[1]];
    center = [
      compress_lon((
        expand_lon(bottom_right[0], top_left[0]) - top_left[0])
        / 2 + top_left[0]),
      (top_left[1] - bottom_right[1]) / 2 + bottom_right[1]
    ];
    return {
      'top_left': top_left,
      'top_right': top_right,
      'bottom_left': bottom_left,
      'bottom_right': bottom_right,
      'center': center
    }
  };

  var resize = function() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2]);
    projection.center(dims.center);
    d3.selectAll('.boundary').attr('d', path);
  };

  var update_data_fills = function() {
    grid_regions.each(function(d, i) {
      d3.select(this).style({
        fill: function() {
          return d.properties.value.values[_time] == null
            ? 'transparent' : color(d.properties.value.values[_time]);
        }
      });
    });
  };

  var grid_hover = function(d) {
    var q = d.geometry.coordinates[0] + ', ';
    q += d.geometry.coordinates[1] + ': ';
    q += d.properties.value;
    hover_legend.select('p').text(q);
    hover_legend.style({
      left: d3.event.mouse[0] + 'px',
      top: d3.event.mouse[1] + 'px',
      display: 'block'
    });
  };

  var atlas = function(error, queued_data) {

    data = queued_data[0];
    world = queued_data[1];
    data.filter(function (d) { return d.properties.value != null; });
    data.forEach(function(d) {
      d.geometry.coordinates.reverse();
    });
    console.log(data);

    projection.center(dims.center);

    color.domain([
      d3.min(data, function(d) {
        return d3.min(d.properties.value.values, function(dd) {return dd; }); }),
      d3.max(data, function(d) {
        return d3.max(d.properties.value.values, function(dd) {return dd; }); })]);

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

    ocean_layer.selectAll('path.countries')
      .data(world.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('class', 'countries boundary')
      .style({
        stroke: 'none',
        fill: '#dddddd'
      });

    grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data)
      .enter()
      .append('path')
      .attr('class', 'grid-boundary boundary')
      .attr('d', path)
      .on('mouseover', grid_hover)
      .on('mouseout', function() { hover_legend.style({display: 'none'})})
    ;

    update_data_fills(data);
    svg.call(drag_rotate);

  };

  var dims = get_viewport_dimensions();

  queue()
    .defer(d3.json, '/api/'+
      dims['top_left'][0]+'/'+ dims['top_left'][1]+'/'+
      dims['bottom_right'][0]+'/'+dims['bottom_right'][1])
    .defer(d3.json, '/static/json/countries_110.geojson')
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