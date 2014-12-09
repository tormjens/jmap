# jQuery jMap [![Build Status](https://secure.travis-ci.org/tormjens/jmap.svg?branch=master)](https://travis-ci.org/tormjens/jmap) ![Bower Version](https://badge.fury.io/bo/jmap.svg)

### A quick and easy way to implement Google Maps to your project

As a front-end developer you often encounter implementing Google Maps to a site. Google Maps isn't hard, I know, but repeating the same code over and over again, well, it sucks. jMap is a simple to use wrapper for the Google Maps API and has some other nice functions too.

## Usage

1. Include jQuery:

	```html
	<script src="http://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
	```

2. Include Google Maps:

	```html
	<script src="http://maps.google.com/maps/api/js?sensor=false"></script>
	```

3. Include plugin's code:

	```html
	<script src="dist/jquery.jmap.min.js"></script>
	```

3. Call the plugin:

	```javascript
	$("#element").jMap({
		lat: 22.33,
		lng: 11.22
	});
	```

## Install

### Using Bower

```bash
bower install jmap
```
