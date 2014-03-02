(function() {

  var world, data, globe_outlines, globe_fills, grid_regions,
    height = window.innerHeight,
    width = window.innerWidth,
    start_year = 1979,
    end_year = 2012,
    current_year = 1979,
    globe_scale = (height - 100) / 2,
    plate_scale = (width - 100) / 6,
    sens = .2,
    _scen = 0,
    _irr = 0,
    _time = 0,
    svg = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
      .append('g'),
    world_fill = d3.select('svg').append('g'),
    grid = d3.select('svg').append('g'),
    world_outlines = d3.select('svg').append('g'),
    defs = svg.append('defs'),
    color = d3.scale.quantile()
      .range(['#ffffd4', '#fed98e', '#fe9929', '#d95f0e', '#993404']),
    projection = d3.geo.equirectangular()
      .center([86, 20])
      .scale(2900)
      .translate([width / 2, height / 2])
      .precision(.1),
    path = d3.geo.path()
      .projection(projection),
    graticule = d3.geo.graticule(),
    drag_rotate = d3.behavior.drag()
      .origin(function() { var r = projection.rotate(); return {x: r[0] / sens, y: -r[1] / sens}; })
      .on('drag', function() {
        var λ = d3.event.x * sens,
        φ = -d3.event.y * sens,
        rotate = projection.rotate();
        //Restriction for rotating upside-down
        φ = φ > 30 ? 30 :
        φ < -30 ? -30 :
        φ;
        projection.rotate([λ, φ]);
        path = d3.geo.path().projection(projection);
        svg.selectAll('.boundary').attr('d', path);
      }),
    custom_label_placement = function(g) {
      g.selectAll("text")
        .attr("x", 4)
        .attr("dy", -4);
    };

  var update_projection = function(w, h, d) {
    return (width / 6) * 360 / (d.max_lon - d.min_lon + 2);
  };

  var resize = function() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2]);
    projection.scale(update_projection(width, height, data));
    projection.center([(data.max_lon + data.min_lon) / 2, (data.max_lat + data.min_lat) / 2]);
    d3.selectAll('.boundary').attr('d', path);
  };

  var update_data_fills = function() {
    grid_regions.each(function(d, i) {
      d3.select(this).style({
        fill: function() {
//          if (d.properties.var[_time] && d.properties.var[_time] < 1000000) {
          if (d.properties.var[_time] < 1000000) {
              return color(d.properties.var[_time]);
          }
          return 'transparent';
        }
      });
    });
  };

  var atlas = function(error, queued_data) {

    world = queued_data[0];
    data = queued_data[1];
    projection.scale(update_projection(width, height, data));
    projection.center([(data.max_lon + data.min_lon) / 2, (data.max_lat + data.min_lat) / 2]);

    color.domain([data.min, data.max]);

    var sphere = [
      defs.append('path')
        .datum({type: 'Sphere'})
        .attr('id', 'sphere')
        .attr('d', path)
        .attr('class', 'boundary'),
      svg.append('use')
        .attr('class', 'stroke')
        .attr('xlink:href', '#sphere')
      ];
    svg.append('path')
      .datum(graticule)
      .attr('class', 'graticule boundary')
      .attr('d', path)
      .style({
        stroke: '#B4D5E5',
        'stroke-width': '1px',
        fill: 'transparent'
      });
    globe_outlines = world_outlines.selectAll('.world-boundary')
      .data(topojson.feature(world, world.objects.regions).features)
      .enter()
      .append('path')
      .attr('class', 'world-boundary boundary')
      .style({fill: 'transparent',stroke: '#666666', 'stroke-width': 2})
      .attr('d', path)
      .on('mouseover', function(d) {
        d3.select('#hover_legend')
          .text(d.properties.name)
          .style({
            'display': 'block',
            'left': path.centroid(d)[0]+'px',
            'top': path.centroid(d)[1]+'px'
          });
      })
      .on('mouseout', function(d) {
        d3.select('#hover_legend')
          .text(null)
          .style({
            'display': 'none'
          });
      });
    globe_fills = world_fill.selectAll('.world-fill')
      .data(topojson.feature(world, world.objects.regions).features)
      .enter()
      .append('path')
      .attr('class', 'world-fill boundary')
      .style({fill: '#cccccc', stroke: 'transparent', 'stroke-width': 0})
      .attr('d', path);

    grid_regions = grid.selectAll('.grid-boundary')
      .data(data.data)
      .enter()
      .append('path')
      .attr('class', 'grid-boundary boundary')
      .attr('d', path);
    update_data_fills(data);
//    svg.call(drag_rotate);

  };

  queue()
    .defer(d3.json, '/static/topojson/atlas_gadm1.json')
    .defer(d3.json, '/static/json/grid/SA_'+Options.var+'_whe.json')
    .awaitAll(atlas);

  var ajax_opts = d3.selectAll('.data-ajax');
  ajax_opts.on('click', function() {
    d3.event.preventDefault();
    var opt = d3.select(this),
      opt_type = opt.attr('data-type'),
      opt_value = opt.attr('data-value');
    if (opt_type == 'scenario') {
      _scen = opt_value;
    }
    if (opt_type == 'irrigation') {
      _irr = opt_value;
    }
    d3.xhr('/update/grid/adm/1/var/'+Options.var+'/type/'+opt_type+'/value/'+opt_value)
      .responseType('json')
      .post()
      .on('load', function(_data) {
        data = _data.response;
        d3.select('#corner_legend [data-type="'+opt_type+'"]').text(opt.text());
        update_data_fills(data);
      });
  });

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