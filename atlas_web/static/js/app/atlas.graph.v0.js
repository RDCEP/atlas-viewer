
var AtlasApp = (function (atlas) {

  'use strict';

  var select_layer = d3.select('.ui.layer').append('g')
      .attr('class', 'select layer')
    , graph_layer = d3.select('.ui.layer').append('g')
      .attr('class', 'graph layer')
  ;

  graph_layer.append('rect').attr('class', 'bkgd');

  var _time_series = function _time_series(pixel) {



  };

  var _update_map_events = function _update_map_events() {

    if (atlas.select_tool) {

      d3.selectAll('.geo.grid')
        .on('click', function () {
          select_layer.selectAll('.outline').remove();
          var that = d3.select(this);
          select_layer.append('path')
            .attr('class', 'select geo outline')
            .attr('d', that.attr('d'));

        });

    } else {

      d3.selectAll('.geo.grid')
        .on('click', null);

    }
  };

  atlas.update_map_events = function() {
    _update_map_events();
  };

  return atlas;

})(AtlasApp || {});

