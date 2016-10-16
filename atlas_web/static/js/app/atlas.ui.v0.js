
var AtlasUI = (function (ui) {

  'use strict';

  var resize_event
    , color_options = {
    /*
     Object for storing application's color state.
     */
    schemes: {
      orange: {
        interp: d3.interpolateOranges,
        reverse: false },
      spectral: {
        interp: d3.interpolateSpectral,
        reverse: true}
    },
    colors: [],
    bins: Options.color_bins
  }
    , ui_layer = d3.select('.ui.layer')
  ;

  ui.color2 = d3.scaleQuantile()
    .range(color_options.colors);

  var _component_table = function _component_table(arr) {
    /*
     Generate color tables for SVG component replacement as space-separated
     strings.
     */
    var j = 0;
    while (j < 100) {
      if (j / 100 < (arr[arr.length - 2] + arr[arr.length - 1]) / 2) {
        arr.splice(j, 0, arr[arr.length - 1])
      } else {
        arr.pop();
        arr.splice(j, 0, arr[arr.length - 1])
      }
      j += 1;
    }
    return arr.splice(0, 100).join(' ');
  };

  var _create_color_scheme = function _create_color_scheme(name, bins) {
    /*
     Update UI color given scheme and number of bins.
     */
    color_options.colors = [];
    var r = []
      , g = []
      , b = []
      , c
      , interp = color_options.schemes[name]
    ;

    for (var i=0; i < bins; ++i) {
      c = d3.rgb(interp.interp(i / (bins - 1)));
      color_options.colors.push(c);
      r.push(Math.round(c.r / 255 * 100) / 100);
      g.push(Math.round(c.g / 255 * 100) / 100);
      b.push(Math.round(c.b / 255 * 100) / 100);
    }

    if (!interp.reverse) {
      r.reverse();
      g.reverse();
      b.reverse();
      color_options.colors.reverse();
    }

    ui.component_transfer_filter.select('feFuncR').attr('tableValues', r.join(' '));
    ui.component_transfer_filter.select('feFuncG').attr('tableValues', g.join(' '));
    ui.component_transfer_filter.select('feFuncB').attr('tableValues', b.join(' '));
    ui.color2.range(color_options.colors);
    ui.update_data_fills();
    _draw_color_legend(15);

  };

  var _get_viewport_dimensions = function _get_viewport_dimensions() {
    /*
     Return coordinates of viewport bounding box
     */
    //FIXME: Use AtlasUI object's bbox
    ui.bbox.top_left = ui.projection.invert([0, 0]);
    ui.bbox.bottom_right = ui.projection.invert([ui.width, ui.height]);

    ui.bbox.top_left[0] = ui.bbox.bottom_right[0] > 180
      ? ui.bbox.top_left[0] - 180
      : ui.bbox.top_left[0];
    ui.bbox.bottom_right[0] = ui.bbox.bottom_right[0] > 180
      ? ui.bbox.bottom_right[0] - 180
      : ui.bbox.bottom_right[0];

    ui.bbox.top_right = [ui.bbox.bottom_right[0], ui.bbox.top_left[1]];
    ui.bbox.bottom_left = [ui.bbox.top_left[0], ui.bbox.bottom_right[1]];

    return ui.bbox;
  };

  var new_resize_wrapper = function new_resize_wrapper() {
    /*
     Wrapper function for debouncing resize events.
     */
    clearTimeout(resize_event);
    resize_event = setTimeout(new_resize, 1000);
  };

  var new_resize = function new_resize() {
    /*
     Resize SVG when browser resizes.
     */
    ui.width = window.innerWidth;
    ui.height = window.innerHeight;
    ui.min_zoom = d3.max([ui.width / 6, ui.height / 3]);
    d3.select('svg').attrs({
      height: ui.height,
      width: ui.width,
      'viewBox': '0 0 ' + ui.width + ' ' + ui.height});
    ui.projection.translate([ui.width / 2, ui.height / 2])
      // .scale(ui.get_map_scale())
    ;

    ui.get_data(Options.datatype);
  };

  var _show_loader = function _show_loader() {
    /*
     Show animated SVG loader element.
     */
    var loader = d3.select('#loader');
    loader.style('display', 'block')
      .style('top', (ui.height - loader.node().getBoundingClientRect().height) / 2 + 'px')
      .style('left', (ui.width - loader.node().getBoundingClientRect().width) / 2 + 'px');
  };

  var _hide_loader = function _hide_loader() {
    /*
     Hide animated SVG loader element.
     */
    var loader = d3.select('#loader');
    loader.style('display', 'none');
  };

  var _draw_color_legend = function _draw_color_legend(block_size) {
    /*
     Draw color legend in bottom right corner of map.
     */
    var top_margin = 15
      , legend_height = ui.color2.range().length * block_size + (ui.color2.range().length-1) + 70
      , gap = 3
      , legend_layer = ui_layer.append('g').attr('class', 'legend layer')
    ;
    d3.selectAll('.legend_bkgd').remove();
    d3.selectAll('.legend_region').remove();
    d3.selectAll('.legend-block').remove();
    d3.selectAll('.legend-data').remove();

    //TODO: Is legend_layer an attribute of AtlasUI—Or just select it in this function?
    legend_layer.append('rect')
      .attrs({
        height: legend_height,
        width: 160,
        x: ui.width - 240,
        y: ui.height - (legend_height + 81),
        class: 'legend_bkgd'})
      .styles({
        opacity: .9,
        fill: 'white'});

    legend_layer.append('text')
    //TODO: Replace with variable name, units
      .text('GADM 0')
      .attrs({
        x: ui.width - 240 + 15,
        y: ui.height - (legend_height + 58),
        class: 'legend_region'})
      .styles({
        fill: 'black',
        opacity: .65,
        'font-weight': 600});

    legend_layer.selectAll('.legend-block')
      .data(ui.color2.range())
      .enter()
      .append('rect')
      .attrs({
        width: block_size,
        height: block_size,
        class: 'legend-block',
        x: ui.width - 240 + 15 })
      .attr('fill', function (d) { return d; })
      .attr('y', function (d, i) {
        return ui.height - (legend_height + 60) +
          top_margin + i * (block_size + gap); });

    legend_layer.selectAll('.legend-data')
      .data(ui.color2.range())
      .enter()
      .append('text')
      .attrs({
        x: ui.width - 240 + 35,
        class: 'legend-data'})
      .text(function (d, i) {
        var q = ui.color2.quantiles(),
          r = ui.color2.range().length
        ;
        if (i == 0) {
          return ui.round1(ui.color2.domain()[0]) + '–' + ui.round1(q[i]); }
        if (i == r - 1) {
          return ui.round1(q[i-1]) + '–' + ui.round1(ui.color2.domain()[1]); }
        return ui.round1(q[i-1]) + '–' + ui.round1(q[i]); })
      .attr('y', function (d, i) {
        return ui.height - (legend_height + 60) + top_margin + (block_size - 3) +
          (color_options.bins - i - 1) * (block_size + gap); });
  };

  d3.select('#pixel_pointer .iconswitch')
    .on('click', function() {
      var that = d3.select(this);
      that.classed('inactive', !that.classed('inactive'));
      ui.select_tool = !ui.select_tool;
      d3.select('#map').style('cursor', ui.select_tool ? 'crosshair' : 'move');
      ui.toggle_zoom();
    });

  d3.select('#input_buckets')
    .on('input', function() {
      color_options.bins = d3.select("#input_buckets").node().value;
      _create_color_scheme(Options.color_scheme,
        color_options.bins)
    });

  d3.select('#legend_settings')
    .on('click', function() {
      var l = d3.select('.legend.layer');
      var eye = d3.select('#iconSwitch');
      if (l.style('visibility') == 'visible') {
          l.style('visibility', 'hidden');
          eye.attrs({class: 'fa fa-eye fa-lg'});
        } else {
          l.style('visibility', 'visible');
          eye.attrs({class: 'fa fa-eye-slash fa-lg'});
        }});

  d3.selectAll('.color_scheme')
    .on('click', function() {
      Options.color_scheme = d3.select(this).attr('id');
      _create_color_scheme(Options.color_scheme, color_options.bins);
    });

  d3.select(window).on('resize', new_resize_wrapper);

  ui.component_table = function(arr) {
    return _component_table(arr);
  };

  ui.create_color_scheme = function(interp, color_bins) {
    return _create_color_scheme(interp, color_bins);
  };

  ui.get_viewport_dimensions = function() {
    return _get_viewport_dimensions();
  };

  ui.show_loader = function() {
    return _show_loader();
  };

  ui.hide_loader = function() {
    return _hide_loader();
  };

  ui.draw_color_legend  = function(block_size) {
    return _draw_color_legend(block_size);
  };



  return ui;

})(AtlasUI || {});
