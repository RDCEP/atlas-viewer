(function() {

  var world, data, grid_regions, top_left, bottom_right, dims
    , height = window.innerHeight
    , width = window.innerWidth
    , current_year = 1979
    , sens = 1
    , _time = 0
    //, start_year = 1979
    //, end_year = 2012
    //, _scen = 0
    //, _irr = 0

    , svg = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
      .append('g')
    , ocean_layer = svg.append('g')
      .attr('id', 'ocean_layer')
    , grid_layer = svg.append('g')
      .attr('id', 'grid_layer')

    , color = d3.scale.quantile()
      .range(['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
              '#f16913', '#d94801', '#a63603', '#7f2704'])

    , projection = d3.geo.equirectangular()
      .rotate([-Options.lon, 0])
      .center([0, Options.lat])
      .scale(height * 2)
      .translate([width / 2, height / 2])
      .precision(.1)
    , path = d3.geo.path()
      .projection(projection)
    , graticule = d3.geo.graticule()

    , hover_legend = d3.select('#hover_legend')
    ;

  var dragged = function dragged() {

    var λ = d3.event.dx * sens
      , φ = d3.event.dy * sens
      , upper_drag_limit = projection([0, 90])[1]
      , lower_drag_limit = projection([0, -90])[1] - height
    ;

    φ = -φ > lower_drag_limit ? -lower_drag_limit
      : -φ < upper_drag_limit ? -upper_drag_limit
      : φ;

    var c = projection.invert([
      width / 2 - λ,
      height / 2 - φ]);

    projection
      .rotate([-c[0], 0])
      .center([0, c[1]]);
    svg.selectAll('.boundary').attr('d', path);
  };

  var dragend = function dragend() {
    get_data_for_viewport();
  };

  var drag_rotate = d3.behavior.drag()
      .origin(function() {
        var r = projection.rotate();
        return {x: r[0] / sens, y: -r[1] / sens}; })
      .on('drag', dragged)
      .on('dragend', dragend)
    , scroll_zoom = d3.behavior.zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .scaleExtent([height, 8 * height])
      .on('zoom', null)
    ;

  var update_projection = function update_projection(w, h, d) {
    return (width / 6) * 360 / (42);
  };

  var expand_lon = function expand_lon(lon, left) {
    while (lon < left) {
      lon += 180;
    }
    return lon;
  };

  var compress_lon = function compress_lon(lon) {
    return (lon / 180) % 1 * 180;
  };

  var limit_lat = function limit_lat(lat) {

  };

  var get_viewport_dimensions = function get_viewport_dimensions() {
    top_left = projection.invert([0,0]);
    bottom_right = projection.invert([width, height]);

    top_left[0] = bottom_right[0] > 180 ? top_left[0] - 180 : top_left[0];
    bottom_right[0] = bottom_right[0] > 180 ? bottom_right[0] - 180 : bottom_right[0];

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

  var resize = function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2])
      .scale(height * 2);
    d3.selectAll('.boundary').attr('d', path);
  };

  var show_loader = function show_loader() {
    var loader = d3.select('#loader');
    loader.style({
      display: 'block',
      top: (height - loader.node().getBoundingClientRect().height) / 2 + 'px',
      left: (width - loader.node().getBoundingClientRect().width) / 2 + 'px'
    });
  };

  var hide_loader = function show_loader() {
    var loader = d3.select('#loader');
    loader.style({ display: 'none' });
  };

  var draw_map_basics = function draw_map_basics() {

    d3.json('/static/json/countries_110.geojson', function(world) {

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

    });

  };

  var update_data_fills = function update_data_fills() {
    grid_regions.each(function(d, i) {
      d3.select(this).style({
        fill: function() {
          return d.properties.value.values[_time] == null
            ? 'transparent' : color(d.properties.value.values[_time]);
        }
      });
    });
  };

  var grid_hover = function grid_hover(d) {
    var q = '[' + (d.geometry.coordinates[0][0][0] +.25) + ', ';
    q += (d.geometry.coordinates[0][0][1] +.25) + '] <b>';
    q += (Math.round(d.properties.value.values[_time] * 100) / 100) + '</b>' ;
    hover_legend.select('p').html(q);
    hover_legend.style({
      left: d3.mouse(this)[0] + 'px',
      top: d3.mouse(this)[1] + 'px',
      display: 'block'
    });
    hover_legend.classed('hovered', true);
  };

  var get_data_for_viewport = function get_data_for_viewport() {

    show_loader();
    dims = get_viewport_dimensions();

    queue()
      .defer(d3.json, '/api/'+
        dims['top_left'][0]+'/'+ dims['top_left'][1]+'/'+
        dims['bottom_right'][0]+'/'+dims['bottom_right'][1])
      .awaitAll(atlas);
  };

  var atlas = function atlas(error, queued_data) {

    data = queued_data[0];
    data.filter(function (d) { return d.properties.value != null; });
    data.forEach(function(d) {
      d.geometry.coordinates.reverse();
    });

    color.domain([
      d3.min(data, function(d) {
        return d3.min(d.properties.value.values, function(dd) {return dd; }); }),
      d3.max(data, function(d) {
        return d3.max(d.properties.value.values, function(dd) {return dd; }); })]);

     grid_regions = grid_layer.selectAll('.grid-boundary')
      .data(data);
    grid_regions.enter()
      .append('path')
      .attr('class', 'grid-boundary boundary')
      .attr('d', path)
      .on('mouseover', grid_hover)
      .on('mouseout', function() {
        hover_legend.style({display: 'none'});
        hover_legend.classed('hovered', false);})
    ;

    grid_regions.exit().remove();

    update_data_fills(data);
    svg.call(drag_rotate);

    svg.selectAll('.boundary').attr('d', path);
    hide_loader();

  };

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

  get_data_for_viewport();

  draw_map_basics();



})();