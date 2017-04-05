var AtlasUI = (function (ui) {

  'use strict';

  var select_layer = d3.select('.ui.layer').append('g')
    .attr('class', 'select layer');

  var _update_map_events = function _update_map_events() {
    if (ui.select_tool == true) {
      d3.selectAll('.grid.geo')
        .on('click', function (d) {
          select_layer.selectAll('.outline').remove();
          d3.selectAll('.oldRect, .oldRect_text, #chart_icon, #close_icon').remove();
          var that = d3.select(this);
          select_layer.append('path')
            .attr('class', 'select geo outline')
            .attr('d', that.attr('d'));
          that.classed('selected', !that.classed('selected'));
          if (that.classed('selected')) {
            var rectX = d3.event.clientX + 10;
            var rectY = d3.event.clientY;
            var pop_up = select_layer;
            pop_up.append('rect')
              .attrs({
                height: 225,
                width: 165,
                class: 'oldRect',
                x: rectX,
                y: rectY
              })
              .styles({
                opacity: .9,
                fill: '#fff'
              });
            pop_up.append('text')
              .attr('font-family', 'FontAwesome')
              .text(function (d) {
                return '\uf00d'
              })
              .attrs({
                id: "close_icon",
                class: 'inactive',
                x: rectX + 142,
                y: rectY + 20
              })
              .styles({
                fill: '#cccccc',
                position: 'fixed',
                'font-size': '1em',
                'cursor': 'pointer'
                /*'font-family': 'FontAwesome'*/
              });
            d3.select('#close_icon').on('click', function () {
              d3.selectAll('.oldRect, .oldRect_text, #chart_icon, #close_icon').remove();
            });
            pop_up.append('text')
              .attr('font-family', 'FontAwesome')
              .text(function (d) {
                return '\uf1fe'
              })
              .attrs({
                id: "chart_icon",
                class: 'inactive',
                x: rectX + 13,
                y: rectY + 197
              })
              .styles({
                fill: '#000',
                opacity: .65,
                position: 'fixed',
                'font-size': '4em',
                'cursor': 'pointer'
                /*'font-family': 'FontAwesome'*/
              });
            var pop_up_label = function pop_up_label(t) {
              rectY += 22;
              pop_up.append('text')
                .text(t)
                .attrs({
                  class: 'oldRect_text',
                  x: rectX + 13,
                  y: rectY + 15
                })
                .styles({
                  fill: '#000',
                  opacity: .65,
                  'font-weight': 600
                });
            };
            pop_up_label(d.properties.centroid.geometry.coordinates["0"] +
              "°, " + d.properties.centroid.geometry.coordinates["1"] + '°');
            pop_up_label('min: ' + d3.min(d.properties.value.values).toFixed(3));
            pop_up_label('max: ' + d3.max(d.properties.value.values).toFixed(3));
            pop_up_label('median: ' + d3.median(d.properties.value.values).toFixed(3));
            pop_up_label('mean: ' + d3.mean(d.properties.value.values).toFixed(3));
            
            d3.select('#chart_icon').on('click', function () {
              ui.drawer_enabled = true;
              show_drawer();
              //console.log(ui.drawer_enabled);
              var l = d3.select('.chart_layer');
              if (l.style('visibility') == 'hidden') {
                l.style('visibility', 'visible');
                d3.select('.chart_drawer').attrs({y: ui.height - 360});
                d3.select('#up_icon').styles({'visibility': 'hidden'});
                d3.select('#down_icon').styles({'visibility': 'visible'});
              }

              var chart_content = d3.select('.ui.layer').append('g')
                .attr('class', 'chart_content');

              /*BELOW COLOR BLOCK TEST*/
              chart_content.append('rect')
                .attrs({
                  height: 100,
                  width: 100,
                  id: 'test',
                  x: 75,
                  y: ui.height - 300
                })
                .styles({
                  fill: 'orange'
                });

              chart_content.append('rect')
                .attrs({
                  height: 225,
                  width: 750,
                  id: 'test',
                  x: 75,
                  y: ui.height - 285
                })
                .styles({
                  fill: '#ff00ff'
                });

              chart_content.append('rect')
                .attrs({
                  height: 20,
                  width: 20,
                  id: 'test',
                  x: 175,
                  y: ui.height - 105
                })
                .styles({
                  fill: '#222'
                });
            });
          }
        });
    }
  };

  d3.select('.ui.layer').append('rect')
      .attrs({
        height: 20,
        width: ui.width,
        class: 'chart_drawer',
        x: 0,
        y: ui.height-20})
      .styles({
        fill: '#000',
        position: 'fixed'});

  d3.select('.ui.layer').append('rect')
    .attrs({
      height: 360,
      width: ui.width,
      class: 'chart_layer',
      x: 0,
      y: ui.height - 340})
    .styles({
      fill: '#fff',
      position: 'fixed',
      'visibility': 'hidden'});

  d3.select('.ui.layer').append('text')
    .attr('font-family', 'FontAwesome')
    .text(function(d) { return '\uf106' })
    .attrs({
      id: "up_icon",
      class: 'inactive',
      x: ui.width-52,
      y: ui.height})
    .styles({
      fill: '#c6c6c6',
      position: 'fixed',
      'font-size': '2em',
      'cursor': 'pointer'
      /*'font-family': 'FontAwesome'*/});

  d3.select('.ui.layer').append('text')
    .attr('font-family', 'FontAwesome')
    .text(function(d) { return '\uf107' })
    .attrs({
      id: "down_icon",
      class: 'active',
      x: ui.width - 52,
      y: ui.height - 340})
    .styles({
      fill: '#c6c6c6',
      position: 'fixed',
      'font-size': '2em',
      'visibility': 'hidden',
      'cursor': 'pointer'
      /*'font-family': 'FontAwesome'*/});

  var show_drawer = function show_drawer() {
    if (ui.drawer_enabled) {
      var l = d3.select('.chart_layer');
      if (l.style('visibility') == 'hidden') {
        l.style('visibility', 'visible');
        d3.select('.chart_drawer').attrs({y: ui.height - 360});
        d3.select('#up_icon').styles({'visibility': 'hidden'});
        d3.select('#down_icon').styles({'visibility': 'visible'});
      }
    }
  };

  var hide_drawer = function hide_drawer() {
    if (ui.drawer_enabled) {
      var l = d3.select('.chart_layer');
      l.style('visibility', 'hidden');
      d3.select('.chart_drawer').attrs({y: ui.height-20});
      d3.select('#up_icon').styles({'visibility': 'visible'});
      d3.select('#down_icon').styles({'visibility': 'hidden'});
      d3.selectAll('#test').remove();
    }
  };

  d3.select('#up_icon')
      .on('click', show_drawer);

  d3.select('#down_icon')
    .on('click', hide_drawer);

  var _clear_selection;

  ui.update_map_events = function update_map_events() {
    //console.log(1);
    _update_map_events();
  };

  return ui;

})(AtlasUI || {});