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
    color = d3.scale.quantile()
      .range(['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']),
    projection_map = d3.geo.equirectangular()
      .translate([width / 2, height / 2])
      .scale(plate_scale),
    projection_globe = d3.geo.orthographic()
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate([0,-20])
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
    projection_globe.translate([width / 2, height / 2]);
    projection_map.translate([width / 2, height / 2]);
    d3.selectAll('.boundary').attr('d', path);

  };

  var update_data_fills = function(_data) {
    globe_regions.each(function(d) {
      d3.select(this).style({
        fill: '#cccccc',
        stroke: 'transparent'
      });
      d3.select(this).style({
        'stroke-width': .5,
        stroke: function() {
          j = d.properties.adm;
          if (_data.data.hasOwnProperty(j)) {
            if (_data.data[j][_time] < 1000000) {
              d3.select(this).classed('active', true);
              return '#eeeeee';
            }
            return 'transparent';
          }
          return 'transparent';
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

  var projection_tween = function(projection0, projection1, forward, lon) {

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
      if (!forward) { projection.clipAngle(90).rotate([-lon[0],-20]); }
      else { projection.rotate([-lon[0], 0]); }

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
    globe_regions = svg.selectAll('.world-boundary')
      .data(topojson.feature(world, world.objects.regions).features)
      .enter()
      .append('path')
      .attr('class', 'world-boundary boundary')
      .attr('d', path)
      .on('dblclick', function(d) {
        if (+d.properties.adm == 105) {
          window.location = '/south_asia/aggr/'+Options.var;
        } else if (ortho && d3.select(this).classed('active')) {
          ortho = false;
          svg.selectAll('.boundary').transition()
            .duration(300)
            .attr('d', path)
            .attrTween('d', projection_tween(projection, projection = projection_map, true, d3.geo.centroid(d)));
        } else {
          ortho = true;
          svg.selectAll('.boundary').transition()
            .duration(300)
            .attr('d', path)
            .attrTween('d', projection_tween(projection, projection = projection_globe, false, d3.geo.centroid(d)));
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
    .defer(d3.json, '/static/topojson/atlas_gadm0.json')
    .defer(d3.json, '/static/json/aggr/gadm0/'+Options.var+'_gadm0_home.json')
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