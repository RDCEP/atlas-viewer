
var AtlasApp = (function (atlas) {

  'use strict';

  /*
    component_table(arr)
      Colors for SVG smoothing
    _s2l(v)
      gamma correction
    create_color_scheme(name, bins)
      Update UI's color scheme
    get_viewport_dimensions()
      Return corners of viewport as lon lat coordinates
    _new_resize_wrapper()
      Debouncing for resize events
    _new_resize()
      Redraw SVG map on browser resize
    show_loader()
      Show SVG loader icon
    hide_loader()
      Hide SVG loader icon
    draw_color_legend(block_size)

   */

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

  atlas.color2 = d3.scaleQuantile()
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

  var _s2l = function _gamma_correct(v) {
    return Math.round(v / 255 * 100) / 100;
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
      r.push(_s2l(c.r));
      g.push(_s2l(c.g));
      b.push(_s2l(c.b));
    }

    if (!interp.reverse) {
      r.reverse();
      g.reverse();
      b.reverse();
      color_options.colors.reverse();
    }
    d3.select('feFuncR').attr('tableValues', r.join(', '));
    d3.select('feFuncG').attr('tableValues', g.join(', '));
    d3.select('feFuncB').attr('tableValues', b.join(', '));
    atlas.color2.range(color_options.colors);
    atlas.update_data_fills();
    _draw_color_legend(15);

  };

  var _get_viewport_dimensions = function _get_viewport_dimensions() {
    /*
     Return coordinates of viewport bounding box as [lon, lat] coordinates
     */
    //FIXME: Use AtlasApp object's bbox
    atlas.bbox.top_left = atlas.projection.invert([0, 0]);
    atlas.bbox.bottom_right = atlas.projection.invert([atlas.width, atlas.height]);

    atlas.bbox.top_left[0] = atlas.bbox.bottom_right[0] > 180
      ? atlas.bbox.top_left[0] - 180
      : atlas.bbox.top_left[0];
    atlas.bbox.bottom_right[0] = atlas.bbox.bottom_right[0] > 180
      ? atlas.bbox.bottom_right[0] - 180
      : atlas.bbox.bottom_right[0];

    atlas.bbox.top_right = [atlas.bbox.bottom_right[0], atlas.bbox.top_left[1]];
    atlas.bbox.bottom_left = [atlas.bbox.top_left[0], atlas.bbox.bottom_right[1]];

    return atlas.bbox;
  };

  var _new_resize_wrapper = function _new_resize_wrapper() {
    /*
     Wrapper function for debouncing resize events.
     */
    clearTimeout(resize_event);
    resize_event = setTimeout(_new_resize, 1000);
  };

  var _new_resize = function _new_resize() {
    /*
     Resize SVG when browser resizes.
     */
    atlas.width = window.innerWidth;
    atlas.height = window.innerHeight;
    atlas.min_zoom = d3.max([atlas.width / 6, atlas.height / 3]);
    d3.select('svg').attrs({
      height: atlas.height,
      width: atlas.width,
      'viewBox': '0 0 ' + atlas.width + ' ' + atlas.height});
    atlas.projection.translate([atlas.width / 2, atlas.height / 2])
      // .scale(atlas.get_map_scale())
    ;

    atlas.get_data(Options.datatype);
  };

  var _show_loader = function _show_loader() {
    /*
     Show animated SVG loader element.
     */
    var loader = d3.select('#loader');
    loader.style('display', 'block')
      .style('top', (atlas.height - loader.node().getBoundingClientRect().height) / 2 + 'px')
      .style('left', (atlas.width - loader.node().getBoundingClientRect().width) / 2 + 'px');
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
    d3.select('.legend.layer').remove();
    var top_margin = 15
      , legend_height = atlas.color2.range().length * block_size + (atlas.color2.range().length-1) + 40
      , gap = 3
      , legend_layer = ui_layer.append('g').attr('class', 'legend layer')
      , legend_units = d3.select('#legend_units')
      , yl = d3.select('#main_nav').node().offsetHeight + d3.select('#title_legend_wrap').node().offsetHeight
      , xl = d3.select('#title_legend').node().offsetLeft + legend_units.node().parentNode.offsetLeft
    ;

    //TODO: Is legend_layer an attribute of AtlasApp—Or just select it in this function?
    legend_layer.append('rect')
      .attrs({
        height: legend_height,
        width: 160,
        // x: atlas.width - 240,
        // y: atlas.height - (legend_height + 81),
        x: xl,
        y: yl,
        class: 'legend_bkgd'})
      .styles({
        opacity: .9,
        fill: 'white'});
    console.log(xl);
    legend_units.text(Options.units[Options.dataset]);

    // legend_layer.append('text')
    //TODO: Replace with variable name, units
    //   .text(Options.units[Options.dataset])
    //   .attrs({
    //     x: atlas.width - 240 + 15,
    //     y: atlas.height - (legend_height + 58),
    //     class: 'legend_region'})
    //   .styles({
    //     fill: 'black',
    //     opacity: .65,
    //     'font-weight': 600});

    legend_layer.selectAll('.legend-block')
      .data(atlas.color2.range())
      .enter()
      .append('rect')
      .attrs({
        width: block_size,
        height: block_size,
        class: 'legend-block',
        // x: atlas.width - 240 + 15 })
        x: xl + 15 })
      .attr('fill', function (d) { return d; })
      .attr('y', function (d, i) {
        // return atlas.height - (legend_height + 60) +
        //   top_margin + i * (block_size + gap); });
        return yl + 10 + i * (block_size + gap); });

    legend_layer.selectAll('.legend-data')
      .data(atlas.color2.range())
      .enter()
      .append('text')
      .attrs({
        // x: atlas.width - 240 + 35,
        x: xl + 35,
        class: 'legend-data'})
      .text(function (d, i) {
        var q = atlas.color2.quantiles(),
          r = atlas.color2.range().length
        ;
        if (i == 0) {
          return atlas.round1(atlas.color2.domain()[0]) + '–' + atlas.round1(q[i]); }
        if (i == r - 1) {
          return atlas.round1(q[i-1]) + '–' + atlas.round1(atlas.color2.domain()[1]); }
        return atlas.round1(q[i-1]) + '–' + atlas.round1(q[i]); })
      .attr('y', function (d, i) {
        // return atlas.height - (legend_height + 60) + top_margin + (block_size - 3) +
        //   (Options.color_bins - i - 1) * (block_size + gap); });
        return yl + 10 + (block_size - 3) + (Options.color_bins - i - 1) * (block_size + gap); });
  };

  d3.select('#pixel_pointer .iconswitch')
    .on('click', function() {
      var that = d3.select(this);
      that.classed('inactive', !that.classed('inactive'));
      atlas.select_tool = !atlas.select_tool;
      atlas.toggle_zoom();
    });

  d3.select('#input_buckets')
    .on('input', function() {
      Options.color_bins = d3.select("#input_buckets").node().value;
      _create_color_scheme(Options.color_scheme,
        Options.color_bins)
    });

  d3.select('#legend_settings')
    .on('click', function() {
      var l = d3.select('.legend.layer');
      var eye = d3.select('#legend_settings .iconswitch');
      if (l.style('visibility') == 'visible') {
          l.style('visibility', 'hidden');
          eye.classed('fa-eye', true);
          eye.classed('fa-eye-slash', false);
        } else {
          l.style('visibility', 'visible');
          eye.classed('fa-eye-slash', true);
          eye.classed('fa-eye', false);
        }});

  d3.selectAll('.color_scheme')
    .on('click', function() {
      Options.color_scheme = d3.select(this).attr('id');
      _create_color_scheme(Options.color_scheme, Options.color_bins);
    });

  d3.select(window).on('resize', _new_resize_wrapper);

  atlas.component_table = function(arr) {
    return _component_table(arr);
  };

  atlas.create_color_scheme = function(interp, color_bins) {
    return _create_color_scheme(interp, color_bins);
  };

  atlas.get_viewport_dimensions = function() {
    return _get_viewport_dimensions();
  };

  atlas.show_loader = function() {
    return _show_loader();
  };

  atlas.hide_loader = function() {
    return _hide_loader();
  };

  atlas.draw_color_legend  = function(block_size) {
    return _draw_color_legend(block_size);
  };



  return atlas;

})(AtlasApp || {});
