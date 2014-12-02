/*!
 * jMap - A jQuery Google Maps plugin
 * http://notasite.io
 *
 * Copyright 2014, Tor Morten Jensen
 * http://tormorten.no/
 * Dual licensed under the MIT and GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
 *
 * @author Tor Morten Jensen
 * @requires jQuery v2.0+
 * @requires Google Maps API v3
 */

 (function($){

 	// map plugin object
 	window.jMap = {

		// map settings
		settings: null,

		// map container
		container: null,

		// map object
		map: null,

		// raw markers
		markers: null,

		// google markers
		map_markers: [],

 		// map init
 		init: function( wrapper, options ) {

 			// parse options with our own stuff
 			this.settings = $.extend({
				lat				: 62.10,
				lng				: 10.10,
				zoom			: 16,
				type 			: 'roadmap',
				markers			: null,
				centerMarkers	: false,
				geoCenter		: true, // will be overridden if centerMarkers = true
				debug			: false,
				beforeMapInit	: null,
				afterMapInit	: null,
				beforeMarkerAdd	: null,
				afterMarkerAdd	: null,
				beforeCenter	: null,
				afterCenter		: null,
				beforeGeoCenter	: null,
				afterGeoCenter	: null,
			}, options);

			// set the container
			this.container = $( wrapper );

			// check for google maps api
			if (typeof google === 'object' && typeof google.maps === 'object') {

	 			// render the map
	 			this.render();

 			}
 			else {
 				// throw an error if it is not loaded
 				this.error( 'Google Maps API is not loaded. Load it before loading jMap.' );
 			}

			
 		},

 		// checks if a string is a function and runs it
 		run_function: function( string ) {

 			if (typeof string == 'function') {
		        string.call(this);
		    }

 		},

 		// render the map
 		render: function() {

 			// find and store markers
 			this.find_markers();
 			
 			// maybe set height
 			if ( this.container.height() === 0 ) {
 				this.error( 'Container has no height. Setting it to 350px.' );
 				this.container.height(350);
 			}

 			// find the map type

 			var type = '';

 			switch( this.settings.type ) {

 				case 'hybrid' :
 					type = google.maps.MapTypeId.HYBRID;

 				case 'satellite' :
 					type = google.maps.MapTypeId.SATELLITE;

 				case 'terrain' :
 					type = google.maps.MapTypeId.TERRAIN;

 				default :
 					type = google.maps.MapTypeId.ROADMAP;

 			}

 			// setup arguments
 			var args = {
 				center 		: new google.maps.LatLng(this.settings.lat, this.settings.lng),
 				zoom		: this.settings.zoom,
				mapTypeId	: type
 			};

 			// before the map init
 			this.run_function( this.settings.beforeMapInit );

 			// create the map object
 			this.map 		= new google.maps.Map( this.container[0], args);

 			// after map init
 			this.run_function( this.settings.afterMapInit );

 			// before the marker add
 			this.run_function( this.settings.beforeMarkerAdd );

 			// adds markers to the map
 			this.add_markers();

 			// after the marker add
 			this.run_function( this.settings.afterMarkerAdd );

 			// maybe center on all markers
	 			if( this.settings.centerMarkers ) {

	 			// before setting the center
	 			this.run_function( this.settings.beforeCenter );

 				this.center();

	 			// after setting the center
	 			this.run_function( this.settings.afterCenter );

 			}
 			// maybe set geo
 			else {

	 			// before setting the center
	 			this.run_function( this.settings.beforeGeoCenter );

 				this.geoCenter();

	 			// before setting the center
	 			this.run_function( this.settings.afterGeoCenter );
 				
 			}


 		},

 		// sets markers
 		find_markers: function() {

 			// the array for our markers
 			var markers = [];

 			// first find markers in DOM
 			this.container.find( 'div.marker' ).each(function() {

 				var lat 		= $(this).data('lat');
 				var lng 		= $(this).data('lng');
 				var content 	= $(this).html();

 				var obj = {
 					lat 		: lat,
 					lng 		: lng,
 					content 	: content
 				}

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

 		// adds markers to the map
 		add_markers: function() {

 			if( this.markers !== null ) {

 				var parent = this;

 				$.each(this.markers, function(index, content) {

	 				var marker = new google.maps.Marker({
	 					position	: new google.maps.LatLng( content.lat, content.lng ),
	 					map 		: parent.map
	 				});

	 				parent.map_markers.push(marker);

	 				if( typeof content.content !== 'undefined' ) {

	 					var infowindow = new google.maps.InfoWindow({
							content		: content.content
						});

						// show info window when marker is clicked
						google.maps.event.addListener(marker, 'click', function() {

							infowindow.open( parent.map, marker );

						});

	 				}

	 			});

 			}

 		},

 		// maybe set center around markers
 		center: function() {

 			// vars
			var bounds = new google.maps.LatLngBounds();

			// loop through all markers and create bounds
			$.each( this.map_markers, function( i, marker ){

				var latlng = new google.maps.LatLng( marker.position.lat(), marker.position.lng() );

				bounds.extend( latlng );

			});

			// only 1 marker?
			if( this.map_markers.length == 1 )
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

 		},

 		// set geo center
 		geoCenter: function() {

 			if(navigator.geolocation) {

				var parent = this;

	    		// request the users location
				navigator.geolocation.getCurrentPosition(function(position) {

					// create a latlng object from the users location
					var pos = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);

					parent.map.setCenter(pos);

				}, function(error) {
					parent.error( error.message );
				});
			}
			else {
				this.error( 'The user navigator is unavailiable.' );
			}
			

 		},

 		// throw error
 		error: function( message ) {

 			if( this.settings.debug === true ) {
 				console.error( message );
 			}

 		},

 		// get map instance
 		get: function() {

			if (typeof google === 'object' && typeof google.maps === 'object' && typeof this.map === 'object') {
				return this.map;
			}
			else {
				this.error( 'No map object exists.' );
			}
 		}

 	};

 	// main function
 	$.fn.jmap = function( options ) {

		return this.each( function () {

			jMap.init( this, options );

		});
	}

 })(jQuery);