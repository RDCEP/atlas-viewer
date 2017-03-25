var AtlasUI = (function (ui) {

  'use strict';

  var select_layer = d3.select('.ui.layer').append('g')
    .attr('class', 'select layer');

  var _update_map_events = function _update_map_events() {
    if(ui.select_tool == true){
      d3.selectAll('.grid.geo')
        .on('click', function (d) {
          select_layer.selectAll('.outline').remove();
          d3.select('.oldRect').remove();
          d3.select('.oldRect_text').remove();
          var that = d3.select(this);
          select_layer.append('path')
            .attr('class', 'select geo outline')
            .attr('d', that.attr('d'));
          that.classed('selected', !that.classed('selected'));
          if (that.classed('selected')) {
            var rectX = d3.event.clientX + 10;
            var rectY = d3.event.clientY - 100;
            var pop_up = d3.select('.ui.layer');
            pop_up.append('rect')
                .attrs({
                  height: 250,
                  width: 200,
                  class: 'oldRect',
                  x: rectX,
                  y: rectY
                })
                .styles({
                  opacity: .9,
                  fill: '#fff'
                });

            pop_up.append('text')
                .text(d.properties.centroid.geometry.coordinates["0"] + ", " + d.properties.centroid.geometry.coordinates["1"])
                .attrs({
                  class: 'oldRect_text',
                  x: rectX + 10,
                  y: rectY + 25
                  //x: 10,
                  //y: 5,
                })

                /*
                .attr('y', function () {
                  return rectY + 10 })

                .text(function(vals, x, y){
                  var currentY;
                  function label(l, v){
                    d.properties.centroid.geometry.coordinates["0"] + ", " + d.properties.centroid.geometry.coordinates["1"]
                  }
                })*/
                .styles({
                  fill: 'black',
                  opacity: .65,
                  'font-weight': 600
                });
        }
    })
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
        opacity: .9,
        fill: '#fff',
        position: 'fixed'});

  d3.select('.ui.layer').append('rect')
      .attrs({
        height: 360,
        width: ui.width,
        class: 'chart_layer',
        x: 0,
        y: ui.height - 360})
      .styles({
        opacity: .9,
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
      opacity: .5,
      fill: '#000',
      position: 'fixed',
      'font-size': '2em'
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
      opacity: .5,
      fill: '#000',
      position: 'fixed',
      'font-size': '2em',
      'visibility': 'hidden'
      /*'font-family': 'FontAwesome'*/});

  d3.select('#up_icon')
    .on('click', function() {
      var l = d3.select('.chart_layer');
      if (l.style('visibility') == 'hidden') {
          l.style('visibility', 'visible');
          d3.select('.chart_drawer').attrs({y: ui.height-360});
          d3.select('#up_icon').styles({'visibility': 'hidden'});
          d3.select('#down_icon').styles({'visibility': 'visible'});
        }
    });
  d3.select('#down_icon')
    .on('click', function() {
      var l = d3.select('.chart_layer');
      l.style('visibility', 'hidden');
      d3.select('.chart_drawer').attrs({y: ui.height-20});
      d3.select('#up_icon').styles({'visibility': 'visible'});
      d3.select('#down_icon').styles({'visibility': 'hidden'});
        });

  var _clear_selection;

  ui.update_map_events = function update_map_events() {
    //console.log(1);
    _update_map_events();
  };

  return ui;

})(AtlasUI || {});