(function() {

  var world, data, globe_regions,
    height = window.innerHeight,
    width = window.innerWidth,
    globe_scale = (height - 100) / 2,
    plate_scale = (width - 100) / 6,
    sens = .2,
    _scen = 0,
    _irr = 0,
    _time = 0,
    ortho = true,
    svg = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
      .append('g'),
    defs = svg.append('defs'),
    color = d3.scale.pow(.5)
      .range([d3.rgb(50, 255, 150), d3.rgb(0, 160, 80)]),
    projection_map = d3.geo.equirectangular()
      .translate([width / 2, height / 2])
      .scale(plate_scale),
    projection_globe = d3.geo.orthographic()
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .scale(globe_scale),
    projection = projection_globe,
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
      });

  var resize = function() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2]);
    graph_wrap.attr({transform: 'translate(0,'+(height- 100)+')'});
    _x.range([0, width]);
    y_axis.tickSize(width);
    graph_axes_x.call(x_axis);
//    d3.selectAll('.boundary').attr('d', path);
    graph_line.attr('d', _line);

  };

  var update_data_fills = function(_data) {
    globe_regions.each(function(d, i) {
      d3.select(this).style({
        fill: '#cccccc',
        stroke: 'transparent'
      });
      d3.select(this).style({
        'stroke-width': .5,
        stroke: function() {
          j = d.properties.adm;
          if (i == 0) {
            console.log(_data);
          }
          if (_data.data.hasOwnProperty(j)) {
            if (_data.data[j][_time] < 1000000) {
              d3.select(this).classed('active', true);
              return '#eeeeee';
            }
            return '#eeeeee';
          }
          return '#eeeeee';
        },
        fill: function() {
          j = d.properties.adm;
          if (_data.data.hasOwnProperty(j)) {
            if (_data.data[j][_time] < 1000000) {
              return color(_data.data[j][_time]);
            }
            return '#cccccc';
          }
          return '#cccccc';
        }
      });
    });
  };

  var projection_tween = function(projection0, projection1, forward) {

    return function(d) {
      var t = 0;

      projection0.rotate([0,0]);

      function project(λ, φ) {
        λ *= 180 / Math.PI; φ *= 180 / Math.PI;
        var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
        return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
      }

      var projection = d3.geo.projection(project)
        .scale(1)
        .translate([width / 2, height / 2]);
      if (!forward) { projection.clipAngle(90); }

      var path = d3.geo.path()
          .projection(projection);

      return function(_) {
        t = _;
        return path(d);
      };
    };
  };

  var atlas = function(error, queued_data) {

    world = queued_data[0];
    data = queued_data[1];

    console.log(world);

    color.domain([data.min, Math.sqrt(data.max)]);

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
    globe_regions = svg.selectAll('.world-boundary')
      .data(topojson.feature(world, world.objects.regions).features)
      .enter()
      .append('path')
      .attr('class', 'world-boundary boundary')
      .attr('d', path)
      .on('dblclick', function(d) {
        console.log(d, path.centroid(d), d3.mouse(this));
        if (ortho && d3.select(this).classed('active')) {
          ortho = false;
          svg.selectAll('.boundary').transition()
            .duration(300)
            .attr('d', path)
            .attrTween('d', projection_tween(projection, projection = projection_map, true));
        } else {
          ortho = true;
          svg.selectAll('.boundary').transition()
            .duration(300)
            .attr('d', path)
            .attrTween('d', projection_tween(projection, projection = projection_globe, false));
          sphere.remove();
          sphere = [
            defs.append('path')
              .datum({type: 'Sphere'})
              .attr('id', 'sphere')
              .attr('d', path)
              .attr('class', 'boundary'),
            svg.append('use')
              .attr('class', 'stroke')
              .attr('xlink:href', '#sphere')
            ];

        }
      });

    update_data_fills(data);
    svg.call(drag_rotate);

  };

  queue()
    .defer(d3.json, '/static/topojson/atlas_gadm1.json')
    .defer(d3.json, '/static/json/aggr/yield_gadm1_home.json')
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
    d3.xhr('/update/adm/1/var/yield/type/'+opt_type+'/value/'+opt_value)
      .responseType('json')
      .post()
      .on('load', function(_data) {
        data = _data.response;
        update_data_fills(data);
      });
  });

  var time_opt = d3.select('#time_select');
  var time_label = d3.select('#menu_time label');
  time_opt.on('change', function() {
    _time = +d3.select(this).property('value');
    var _ctime = time_label.text();
    time_label.text(1979 + _time);
    update_data_fills(data);
  });

  d3.select(window).on('resize', resize);

})();