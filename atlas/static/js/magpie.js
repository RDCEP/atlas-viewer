(function() {

  var world, data, globe_regions, ptop, pbot,
    height = window.innerHeight,
    width = window.innerWidth,
    start_year = 2015,
    end_year = 2095,
    current_year = 2095,
    globe_scale = (height - 100) / 2,
    plate_scale = (width - 100) / 6,
    sens = .2,
    _scen = 0,
    _irr = 0,
    _time = 0,
    svg = d3.select('#map').append('svg')
      .attr({'width': width, 'height': height})
      .append('g'),
    defs = svg.append('defs'),
    color = d3.scale.quantile()
      .range(['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']),
    color_plus = d3.scale.quantile()
      .range(['#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']),
    color_minus = d3.scale.quantile()
      .range(['#313695', '#4575b4', '#74add1', '#abd9e9']),
//      .range(['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8']),
//      .range(['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695']),
    projection = d3.geo.mercator()
      .rotate([-Options.lon, -Options.lat])
      .scale(1070)
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
        projection.rotate([λ, φ]);
        path = d3.geo.path().projection(projection);
        svg.selectAll('.boundary').attr('d', path);
      }),
    graph_wrap = d3.select('#map svg').append('g')
      .attr({
        height: 100,
        transform: 'translate(0,'+(height- 100)+')'
      })
      .style('pointer-events', 'none'),
    graph_line = graph_wrap.append('path'),
    graph_axes = graph_wrap.append('g'),
    graph_axes_x = graph_axes.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + (100) + ')'),
    graph_axes_y = graph_axes.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(0,0)'),
    graph_data,
    _x = d3.time.scale().domain([new Date(start_year,0,1), new Date(end_year,0,1)]).range([0, width]),
    _y = d3.scale.linear().domain([0, 1]).range([100, 0]),
    graph_cursor = graph_wrap.append('line')
      .attr({
        'id': 'graph_cursor',
        'x1': _x(new Date(current_year,0,1)),
        'x2': _x(new Date(current_year,0,1)),
        'y1': 0,
        'y2': 100
      }),
    custom_label_placement = function(g) {
      g.selectAll("text")
        .attr("x", 4)
        .attr("dy", -4);
    },
    x_axis = d3.svg.axis()
      .scale(_x)
      .orient('top')
      .tickSize(0)
      .innerTickSize(0),
    y_axis = d3.svg.axis()
      .scale(_y)
      .tickSize(width)
      .orient('right')
      .ticks(3)
      .tickFormat(function(d, i) {
        return (i == 0) ? null : d;
      }),
    _line = d3.svg.line().x(function(d) { return _x(d.x); }).y(function(d) { return _y(d.y + d.y0); });

  var resize = function() {
    width = window.innerWidth;
    height = window.innerHeight;
    d3.select('svg').attr({height: height, width: width});
    projection.translate([width / 2, height / 2]);
    graph_wrap.attr({transform: 'translate(0,'+(height - 100)+')'});
    _x.range([0, width]);
    y_axis.tickSize(width);
    graph_axes_x.call(x_axis);
    graph_line.attr('d', _line);
  };

  var update_data_fills = function(_data) {
    globe_regions.each(function(d, i) {
      d3.select(this).style({
        fill: '#cccccc'
      });
      d3.select(this).style({
        fill: function() {
          j = d.properties.adm;
          if (_data.data.hasOwnProperty(j)) {
            if (_data.data[j][_time] < 0) {
              return color_minus(_data.data[j][_time]);
            } else {
              return color_plus(_data.data[j][_time]);
            }
          }
          return '#cccccc';
        }
      });
      if (d3.select(this).classed('active')) {
        graph_data = data.data[d.properties.adm].slice();
        graph_data.forEach(function(d, i) {
          graph_data[i] = {x: new Date(i+start_year,0,1), y: d, y0: 0};
        });
        _y.domain([d3.min(graph_data, function(d) { return d.y }),
          d3.max(graph_data, function(d) { return d.y })]);
        graph_line.datum(graph_data)
          .attr('d', _line);
      }
    });
  };

  var focus_region = function(d) {
    graph_data = data.data[d.properties.adm].slice();
    graph_data.forEach(function(d, i) {
      graph_data[i] = {x: new Date(i+2014,0,1), y: d, y0: 0};
    });
    _y.domain([d3.min(graph_data, function(d) { return d.y }),
      d3.max(graph_data, function(d) { return d.y })]);
    var _this = this;
    var region = d3.select(this);
    d3.selectAll('.world-boundary')
      .filter(function() { return this !== _this; })
      .classed('active', false);
    region.classed('active', function() {
      if (region.classed('active')) {
        graph_wrap.style({
          'display': 'none',
          'background-color': 'white',
          'opacity': .7
        });
        graph_line.datum([])
          .attr('class', 'data-line')
          .attr('d', _line);
      } else {
        graph_wrap.style('display', 'block');
        graph_line.datum(graph_data)
          .attr('class', 'data-line')
          .attr('d', _line);
      }
      return !region.classed('active'); });
    graph_axes_x.call(x_axis);
    graph_axes_y.call(y_axis).call(custom_label_placement);
  };

  var atlas = function(error, queued_data) {

    world = queued_data[0];
    data = queued_data[1];

    var merged_values = [];
    merged_values = merged_values.concat.apply(merged_values, d3.values(data.data));

    color_minus.domain(merged_values.filter(function(d) {
	    return !(d >= 0 || d === '' || typeof d == 'undefined' || d === null);
    }));
    color_plus.domain(merged_values.filter(function(d) {
	    return !(d < 0 || d === '' || typeof d == 'undefined' || d === null);
    }));

//    if (data.min < 0) {
////      color_minus.domain([data.min, 0]);
//      color_minus.domain([0, data.min]);
//      color_plus.domain([0, data.max]);
//    } else {
//      color_plus.domain([data.min, data.max]);
//    }

    _y.domain([data.min, data.max]);

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
      .on('click', focus_region)
      .on('dblclick', function(d) {
        var c = d3.geo.centroid(d),
          url= '/grid/'+Math.round(c[0])+'/'+Math.round(c[1])+'/';
        url += Options.model+'/'+Options.dataset+'/'+Options.scenario+'/';
        url += Options.irrigation+'/'+Options.crop+'/'+Options.var;
        window.location = url;
      })
      .on('mouseover', function(d) {
        d3.select('#hover_legend')
          .text(d.properties.name+', '+ d.properties.NAME_0+'\n')
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

    update_data_fills(data);
    svg.call(drag_rotate);

  };

  queue()
    .defer(d3.json, '/static/topojson/atlas_gadm1.json')
    .defer(d3.json, '/static/json/aggr/gadm1/magpie/'+Options.crop+'_gadm1_home.json')
    .awaitAll(atlas);

  var time_opt = d3.select('#time_select');
  var time_label = d3.select('#menu_time label');
  time_opt.on('change', function() {
    _time = +d3.select(this).property('value');
    var _ctime = time_label.text();
    current_year = 2015 + _time;
    time_label.text(current_year);
    graph_cursor.attr({
      'x1': _x(new Date(current_year,0,1)),
      'x2': _x(new Date(current_year,0,1))
    });
    d3.select('#corner_legend [data-type="time"]').text(current_year);
    update_data_fills(data);
  });

  d3.select(window).on('resize', resize);

  resize();

})();