/*
 *  jQuery jMap - v0.1
 *  A jQuery Google Maps wrapper plugin.
 *  https://github.com/tormjens/jmap
 *
 *  Made by Tor Morten Jensen
 *  Under MIT License
 */
/*
 * jmap.js Version 0.1
 * A jQuery Google Maps plugin
 *  
 * Licensed under MIT license
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright (c) 2014 Tor Morten Jensen
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS 
 * IN THE SOFTWARE.
 */
(function($, window, document, undefined) {

    /**
     * Store the plugin name in a variable. It helps you if later decide to 
     * change the plugin's name
     * @type {String}
     */
    var pluginName = 'jMap';
 
    /**
     * The plugin constructor
     * @param {DOM Element} element The DOM element where plugin is applied
     * @param {Object} options Options passed to the constructor
     */
    function jMap(element, options) {

        // Store a reference to the source element
        this.el = element;

        // Store a jQuery reference  to the source element
        this.$el = $(element);

        // wrap element in
        this.$el.wrapAll( '<div class="jmap-container"></div>' );

        // Store jQuery parent reference
        this.$parent = this.$el.parent();

        // Set the instance options extending the plugin defaults and
        // the options passed by the user
        this.settings = $.extend({}, $.fn[pluginName].defaults, options);

        // map object
        this.map = null;

        // map center
        this.center = null;

        // raw markers
        this.markers = null;

        // google markers
        this.map_markers = [];

        // init plugin
        this.init();
    }

    /**
     * Set up your jMap protptype with desired methods.
     * It is a good practice to implement 'init' and 'destroy' methods.
     */
    jMap.prototype = {
        
        /**
         * Initialize the plugin instance.
         * Set any other attribtes, store any other element reference, register 
         * listeners, etc
         *
         * When bind listerners remember to name tag it with your plugin's name.
         * Elements can have more than one listener attached to the same event
         * so you need to tag it to unbind the appropriate listener on destroy:
         * 
         * @example
         * this.$someSubElement.on('click.' + pluginName, function() {
         *      // Do something
         * });
         * 
         * @access {Public}
         */
        init: function() {

            // check for google maps api
            if (typeof google === 'object' && typeof google.maps === 'object') {

                // render the map
                this._renderMap();

                // aspectize it
                this._aspectRatio();

            }
            else {
                // throw an error if it is not loaded
                this._error( 'Google Maps API is not loaded. Load it before loading jMap.' );
            }
        },

        /**
         * Evaluates a string to see if it is a function and if so runs it
         * 
         * @param  {String} string The string to search for a function
         * @return {Void} No return
         * 
         * @access {Private}
         */
        _runFunction: function( string, options ) {

            if (typeof string === 'function') {
                string.call(this, options);
            }

        },


        /**
         * Renders a Google Map
         * 
         * @return {Void} No return
         * 
         * @access {Private}
         */
        _renderMap: function() {

            // find and store markers
            this._findMarkers();
            
            // maybe set height
            if ( this.$el.height() === 0 ) {
                this._error( 'Container has no height. Setting it to '+ this.settings.height +'px.' );
                this.$el.height(this.settings.height);
            }

            // find the map type

            var type = '';

            switch( this.settings.type ) {

                case 'hybrid' :
                    type = google.maps.MapTypeId.HYBRID;
                    break;

                case 'satellite' :
                    type = google.maps.MapTypeId.SATELLITE;
                    break;

                case 'terrain' :
                    type = google.maps.MapTypeId.TERRAIN;
                    break;

                default :
                    type = google.maps.MapTypeId.ROADMAP;
                    break;

            }

            // setup arguments
            var args = {
                center      : new google.maps.LatLng(this.settings.lat, this.settings.lng),
                zoom        : this.settings.zoom,
                mapTypeId   : type
            };

            // before the map init
            this._runFunction( this.settings.beforeMapInit );

            // create the map object
            this.map        = new google.maps.Map( this.$el[0], args);

            // after map init
            this._runFunction( this.settings.afterMapInit );

            // before the marker add
            this._runFunction( this.settings.beforeMarkerAdd );

            // adds markers to the map
            this._addMarkers();

            // after the marker add
            this._runFunction( this.settings.afterMarkerAdd );

            // maybe center on all markers
                if( this.settings.centerMarkers ) {

                // before setting the center
                this._runFunction( this.settings.beforeCenter );

                this.centerMap();

                // after setting the center
                this._runFunction( this.settings.afterCenter );

            }
            // maybe set geo
            else {

                // before setting the center
                this._runFunction( this.settings.beforeGeoCenter );

                this.geoCenter();

                // before setting the center
                this._runFunction( this.settings.afterGeoCenter );
                
            }

            this._doCenter();


        },

        /**
         * Set center on resize. 
         * 
         * @return {Void} No return
         * 
         * @access {Private}
         */
        _doCenter: function() {

        	if( this.center !== null ) {

        		var parent = this;

        		google.maps.event.addDomListener(window, 'resize', function() {
        			parent.map.setCenter(parent.center);
				});

        	}



        },

        /**
         * Finds all pre-set markers to the map. 
         * jMap accepts marker data both in DOM and via the options object
         * 
         * @return {Void} No return
         * 
         * @access {Private}
         */
        _findMarkers: function() {

            // the array for our markers
            var markers = [];

            // first find markers in DOM
            this.$el.find( 'div.marker' ).each(function() {

                var lat         = $(this).data('lat');
                var lng         = $(this).data('lng');
                var content     = $(this).html();

                var obj = {
                    lat         : lat,
                    lng         : lng,
                    content     : content
                };

                markers.push(obj);

            });

            // find markers from the options
            if( this.settings.markers !== null ) {

                $.each(this.settings.markers, function(index, content) {
                    markers.push(content);
                });

            }

            // push markers to the array
            this.markers = markers;

        },

        /**
         * Adds all pre-set markers to the map
         * 
         * @return {Void} No return
         * 
         * @access {Private}
         */
        _addMarkers: function() {

            if( this.markers !== null ) {

                var parent = this;

                $.each(this.markers, function(index, content) {

                    parent.addMarker( content );

                });

            }

        },

        /**
         * Throws an error if the debug setting is set to true
         * 
         * @param  {String} message The error string
         * 
         * @access {Private}
         */
        _error: function( message ) {

            if( this.settings.debug === true ) {
                console.error( message );
            }

        },

        /**
	     * Make sure the map fits aspect ratio
         * 
         * @access {Private}
	     */
     	_aspectRatio: function() {

     		if( this.settings.aspectRatio !== false ) {

     			var $parent 	= this.$parent,
     				$el 		= this.$el,
     				ratio 		= 56.25,
     				aspect 		= this.settings.aspectRatio.split('/');

     			ratio = (aspect[1]/aspect[0]) * 100;

     			$parent.css({
     				'position' 		: 'relative',
     				'padding-top'	: ratio + '%',
     			});

     			$el.css({
     				'position'		: 'absolute',
     				'top'			: '0',
     				'bottom'		: '0',
     				'left'			: '0',
     				'right'			: '0',
     				'height'		: 'auto'
     			});

     		}
		
     	},

        /**
         * Add a new marker to the map
         *
         * @example
         * $('#element').jMap('addMarker',{ lat: 00.00, lng: 00.00, content: 'Balooo', events: {} });
         *  
         * @param  {Object} options The options for a new marker
         * 
         * @return {Boolean} Success
         * 
         * @access {Public}
         */
        addMarker: function( marker ) {

            var markers = new google.maps.Marker({
                position    : new google.maps.LatLng( marker.lat, marker.lng ),
                map         : this.map
            });

            this.map_markers.push(markers);

            var parent = this;

            if( typeof marker.content !== 'undefined' ) {

                var infowindow = new google.maps.InfoWindow({
                    content     : marker.content
                });

                // show info window when marker is clicked
                google.maps.event.addListener(markers, 'click', function() {

                    infowindow.open( this.map, markers );

                });

            }

            if( marker.events ) {

            	for( var key in marker.events ) {

					google.maps.event.addListener(markers, key, parent.markerEvent(key, parent, this, markers, marker) );         		

            	}

            }

            return true;

        },

        markerEvent: function(key, parent, current, markers, marker) {

        	marker.events[key].call(parent, current, markers, marker);

        },

        /**
         * Centers the map around the markers added to it
         *
         * @example
         * $('#element').jMap('centerMap');
         * 
         * @return {Void} No return
         * 
         * @access {Public}
         */
        centerMap: function() {

            // vars
            var bounds = new google.maps.LatLngBounds();

            // loop through all markers and create bounds
            $.each( this.map_markers, function( i, marker ){

                var latlng = new google.maps.LatLng( marker.position.lat(), marker.position.lng() );

                bounds.extend( latlng );

            });

            // only 1 marker?
            if( this.map_markers.length === 1 )
            {
                // set center of map
                this.map.setCenter( bounds.getCenter() );
                this.map.setZoom( 16 );
            }
            else
            {
                // fit to bounds
                this.map.fitBounds( bounds );
            }

            this.center = bounds.getCenter();

        },

        /**
         * Asks the user for their geographical location and sets it as their center
         *
         * @example
         * $('#element').jMap('geoCenter');
         * 
         * @return {Void} No return
         * 
         * @access {Public}
         */
        geoCenter: function() {

            if(navigator.geolocation) {

                var parent = this;

                // request the users location
                navigator.geolocation.getCurrentPosition(function(position) {

                    // create a latlng object from the users location
                    var pos = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);

                    parent.map.setCenter(pos);
                    this.center = pos;

                }, function(error) {
                    parent._error( error.message );
                });
            }
            else {
                this._error( 'The user navigator is unavailiable.' );
            }
            

        },

        /**
         * The 'destroy' method is were you free the resources used by your plugin:
         * references, unregister listeners, etc.
         *
         * Remember to unbind for your event:
         *
         * @example
         * this.$someSubElement.off('.' + pluginName);
         *
         * Above example will remove any listener from your plugin for on the given
         * element.
         * 
         * @access {Public}
         */
        destroy: function() {

        	this.$el.html('');
        	this.$el.attr('style', '');

            // Remove any attached data from your plugin
            this.$el.removeData();
        },

        /**
         * Gets the Google Maps instance
         *
         * @example
         * $('#element').jMap('get');
         * 
         * @return {Object} Google Maps object
         * 
         * @access {Public}
         */
        get: function() {
            return this.map;
        },
    };

    /**
     * Registers jMap as an actual jQuery Plugin
     *
     * @example
     * $('#element').jMap({
     *     	lat: 22.34123321,
     *     	lng: 44.23135823
     * });
     */
    $.fn[pluginName] = function(options) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            
            return this.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new jMap(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            
            if (Array.prototype.slice.call(args, 1).length === 0 && $.inArray(options, $.fn[pluginName].getters) !== -1) {
                
                var instance = $.data(this[0], 'plugin_' + pluginName);
                return instance[options].apply(instance, Array.prototype.slice.call(args, 1));
            } else {
                
                return this.each(function() {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof jMap && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    };

    /**
     * Plugin getter methods
     * @type {Array}
     */
    $.fn[pluginName].getters = ['get', 'geoCenter', 'centerMap'];

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        lat             : 62.10,		// the default center latitude
        lng             : 10.10,		// the default center longitude
        height 			: 350,			// the default height of the canvas when no css height is set, will be ignored if A/R is ture
        centerResize	: true,			// always keep the map center on resize
        aspectRatio 	: '16/9',		// make sure the map keeps its aspect ratio. accepts: string 'a/r' or boolean false
        zoom            : 16,			// the default zoom level
        type            : 'roadmap',	// the map type. accepts: 'roadmap', 'terrain', 'hybrid' or 'satellite'
        markers         : null,			// the markers of the map
        centerMarkers   : true,			// if the map should be centered around markers
        geoCenter       : false, 		// will be overridden if centerMarkers = true
        debug           : false, 		// whether or not to show debug messages
        beforeMapInit   : null, 		// callback before the map renders
        afterMapInit    : null, 		// callback after the map has rendered
        beforeMarkerAdd : null, 		// before markers are added to the map
        afterMarkerAdd  : null, 		// after markers have been added to the map
        beforeCenter    : null, 		// before center is set
        afterCenter     : null, 		// after center is set
        beforeGeoCenter : null, 		// before geocenter is set
        afterGeoCenter  : null, 		// after geocenter is set
    };

})(jQuery, window, document);