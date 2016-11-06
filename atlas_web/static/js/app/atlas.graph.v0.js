var AtlasUI = (function (ui) {

  'use strict';

  var select_layer = d3.select('.ui.layer').append('g')
    .attr('class', 'select layer');

  var _update_map_events = function _update_map_events() {
    d3.selectAll('.grid.geo')
    .on('click', function() {
      console.log(1);
      select_layer.selectAll('.outline').remove();
      var that = d3.select(this);
      select_layer.append('path')
        .attr('class', 'select geo outline')
        .attr('d', that.attr('d'));
      that.classed('selected', !that.classed('selected'));
      // console.log(that.classed('selected'));
      // if (that.classed('selected')) {}
    });
  };



  var _clear_selection;

  ui.update_map_events = function update_map_events() {
    console.log(1);
    _update_map_events();
  };

  return ui;

})(AtlasUI || {});