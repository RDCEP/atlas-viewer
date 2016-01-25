(function() {

  var group_data_test = false;

  var world, data, grid_regions
    , top_left, bottom_right, top_right, bottom_left, dims
    , height = window.innerHeight
    , width = window.innerWidth
    , current_year = 1979
    , sens = 1
    , _time = 0
    //, start_year = 1979
    //, end_year = 2012

    , resize_time
    , resize_timeout = false
    , resize_delta = 200
    , resize_reload = false

    , total_pan = {x: 0, y: 0, d: 0}
    , get_map_scale = function get_map_scale() { return d3.max([height, width]) * 1.5; }

    , svgroot = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
    , filter = svgroot.append('defs')
      .append('filter').attr({id: 'grid_filter', x: 0, y: 0})
    , svg = svgroot.append('g')
    , ocean_layer = svg.append('g')
      .attr('id', 'ocean_layer')
    , grid_layer = svg.append('g')
      .attr({id: 'grid_layer', filter: 'url(#grid_filter)'})
    , edges_layer = svg.append('g')
      .attr('id', 'edges_layer')

    , color = d3.scale.quantile()
      .range(['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c',
              '#f16913', '#d94801', '#a63603', '#7f2704'])

    , projection = d3.geo.equirectangular()
      .rotate([-Options.lon, 0])
      .center([0, Options.lat])
      .scale(get_map_scale())
      .translate([width / 2, height / 2])
      .precision(.1)
    , path = d3.geo.path()
      .projection(projection)
    , graticule = d3.geo.graticule()

    , hover_legend = d3.select('#hover_legend')
    ;

  var fee = 0.8
    , fea = 1.2
    , feo = 0.1
    , fetv = [0, 0.25, 0.5, 0.75, 1]
    , fetvr = [0.5, 0.65, 0.85, 0.95, 0.99, 0.99, 0.99, 0.99, 1, 1]
    , fetvg = [0.15, 0.21, 0.28, 0.41, 0.55, 0.68, 0.82, 0.90, 0.96]
    , fetvb = [0.02, 0.01, 0.00, 0.07, 0.24, 0.42, 0.64, 0.81, 0.92]
    , ct1, ct2
  ;
  filter
    .append('feGaussianBlur').attr({in: 'SourceGraphic', stdDeviation: 0 });
    //.append('feColorMatrix').attr({
    //  type: 'saturate',
    //  result: 'desat',
    //  values: .5});

    //  values: 0.35,
    //  result: 'desat'});

  //ct1 = filter.append('feComponentTransfer');
  //ct1.append('feFuncR').attr({type: 'gamma', exponent: fee, amplitude: fea, offset: feo});
  //ct1.append('feFuncG').attr({type: 'gamma', exponent: fee, amplitude: fea, offset: feo});
  //ct1.append('feFuncB').attr({type: 'gamma', exponent: fee, amplitude: fea, offset: feo});
  //
  ct2 = filter.append('feComponentTransfer');
  ct2.append('feFuncR').attr({type: 'discrete', tableValues: fetvr.join(' ')});
  ct2.append('feFuncG').attr({type: 'discrete', tableValues: fetvg.join(' ')});
  ct2.append('feFuncB').attr({type: 'discrete', tableValues: fetvb.join(' ')});

  //filter.append('feConvolveMatrix').attr({
  //  in: 'SourceGraphic',
  //  order: '3 3',
  //  kernelMatrix: '1 3 1 3 5 3 1 3 1'});

  var drag_start = function drag_start() {
    total_pan.x = 0;
    total_pan.y = 0;
  };

  var dragged = function dragged() {

    var λ = d3.event.dx * sens
      , φ = d3.event.dy * sens
      , upper_drag_limit = projection([0, 90])[1]
      , lower_drag_limit = projection([0, -90])[1] - height
    ;

    if (Math.abs(total_pan.d) > 10) {
      grid_regions.remove();
    } else {
      total_pan.x += λ;
      total_pan.y += φ;
      total_pan.d = Math.sqrt(λ * λ + φ * φ);
    }


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

  var drag_end = function drag_end() {
    if (total_pan.d > 10) {
      get_data_for_viewport();
    }
  };

  var drag_rotate = d3.behavior.drag()
      .origin(function() {
        var r = projection.rotate();
        return {x: r[0] / sens, y: -r[1] / sens}; })
      .on('dragstart', drag_start)
      .on('drag', dragged)
      .on('dragend', drag_end)
    , scroll_zoom = d3.behavior.zoom()
      .translate(projection.translate())
      .scale(projection.scale())
      .scaleExtent([height, 8 * height])
      .on('zoom', null)
    ;

  var get_viewport_dimensions = function get_viewport_dimensions() {

    top_left = projection.invert([0, 0]);
    bottom_right = projection.invert([width, height]);

    top_left[0] = bottom_right[0] > 180 ? top_left[0] - 180 : top_left[0];
    bottom_right[0] = bottom_right[0] > 180 ? bottom_right[0] - 180 : bottom_right[0];

    top_right = [bottom_right[0], top_left[1]];
    bottom_left = [top_left[0], bottom_right[1]];

    return {
      'top_left': top_left,
      'top_right': top_right,
      'bottom_left': bottom_left,
      'bottom_right': bottom_right
    }
  };

  var resize = function resize() {

    //Check for end of resize event
    resize_time = new Date();
    if (resize_timeout === false) {
      resize_timeout = true;
      setTimeout(resize_end, resize_delta);
    }

    //Resize SVG
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});

    //Set reload switch
    resize_reload = get_map_scale() < projection.scale();

    //Re-project
    projection.translate([width / 2, height / 2])
      .scale(get_map_scale());
    d3.selectAll('.boundary').attr('d', path);
  };

  var resize_end = function resize_end() {
    if (new Date() - resize_time < resize_delta) {
      setTimeout(resize_end, resize_delta);
    } else {
      resize_timeout = false;
      if (resize_reload) {
        get_data_for_viewport();
      }
    }
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

    d3.json('/static/json/ne_50m_admin_0_countries.geojson', function(world) {

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

      edges_layer.selectAll('path.countries')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'countries boundary')
        .style({
          stroke: 'black',
          'stroke-width': 1,
          'stroke-line-join': 'round',
          fill: 'none'
        });

    });

  };

  var draw_map_countries = function draw_map_countries() {

    d3.json('/static/json/ne_50m_admin_0_countries.geojson', function(world) {

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

      edges_layer.selectAll('path.countries')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', 'countries boundary')
        .style({
          stroke: 'black',
          'stroke-width': 1,
          'stroke-line-join': 'round',
          fill: 'none'
        });
    });
  };

  var update_data_fills = function update_data_fills() {
    grid_regions.each(function(d, i) {
      d3.select(this).style({
        fill: function() {
          if (group_data_test) {
            return color(d3.mean(d.properties.values))
          }
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
        dims['bottom_right'][0]+'/'+dims['bottom_right'][1]+'/default_firr_'+
        Options.var+'_'+Options.crop)
      .awaitAll(atlas);
  };

  var draw_areas_by_time = function draw_areas_by_time(data, idx) {

    var grouped_data = new Array(color.range().length);
    color.range().forEach( function(d, i) {
      grouped_data[i] = {'type': 'Feature', 'geometry': {
        'type': 'MultiPolygon', 'coordinates': []
      }, 'properties': {'values': []}}
    });

    data.forEach(function(d) {

      var x = d.properties.centroid.geometry.coordinates[0];
      var y = d.properties.centroid.geometry.coordinates[1];

      // TODO: Need dynamic resolution
      var s = .25;

      idx = color.range().indexOf(color(d.properties.value.values[_time]));
      grouped_data[idx].geometry.coordinates.push(
        [[[x-s, y+s], [x+s, y+s], [x+s, y-s], [x-s, y-s], [x-s, y+s]]]
      );
      grouped_data[idx].properties.values.push(d.properties.value.values[_time]);
    });

    return grouped_data;

  };

  var atlas = function atlas(error, queued_data) {

    data = queued_data[0];

    data.filter(function (d) { return d.properties.value != null; });

    color.domain([
      d3.min(data, function(d) {
        return d3.min(d.properties.value.values, function(dd) {return dd; }); }),
      d3.max(data, function(d) {
        return d3.max(d.properties.value.values, function(dd) {return dd; }); })]);

    if (!group_data_test) {
      data.forEach(function (d) {

        var x = d.properties.centroid.geometry.coordinates[0];
        var y = d.properties.centroid.geometry.coordinates[1];

        // TODO: Need dynamic resolution
        var s = 0.25 + .005;

        d.geometry = {
          type: 'Polygon',
          coordinates: [[[x - s, y + s], [x + s, y + s], [x + s, y - s], [x - s, y - s], [x - s, y + s]]]
        }
      });
      grid_regions = grid_layer.selectAll('.grid-boundary')
        .data(data);
    } else {
      grid_regions = grid_layer.selectAll('.grid-boundary')
        .data(draw_areas_by_time(data));
    }

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
    svgroot.call(drag_rotate);

    svg.selectAll('.boundary').attr('d', path);
    hide_loader();

  };

  var time_opt = d3.select('#time_select');
  var time_label = d3.select('#menu_time label');
  time_opt.on('input', function() {
    _time = +d3.select(this).property('value');
    //var _ctime = time_label.text();
    current_year = 1979 + _time;
    //time_label.text(current_year);
    //d3.select('#corner_legend [data-type="time"]').text(current_year);
    update_data_fills(data);
  });

  var smooth_opt = d3.select('#smooth_select');
  smooth_opt.on('input', function() {
    d3.select('feGaussianBlur').attr('stdDeviation',
      +d3.select(this).property('value'));
  });

  d3.select(window).on('resize', resize);
  get_data_for_viewport();

  draw_map_basics();



})();