/*
 * @class ArrowHead.
 * @aka L.ArrowHead.
 * @inherits Polyline
 *
 * Original code by Seth Lutske.
 * A class for drawing arrows between points on a map. Extends `Polyline`.
 */

/**
    Extracted from leaflet.geometryutil.

    Returns the coordinate of the point located on a line at the specified ratio of the line length.
    @param {L.Map} map Leaflet map to be used for this method
    @param {Array<L.LatLng>|L.PolyLine} latlngs Set of geographical points
    @param {Number} ratio the length ratio, expressed as a decimal between 0 and 1, inclusive
    @returns {Object} an object with latLng ({LatLng}) and predecessor ({Number}), the index of the preceding vertex in the Polyline
    (-1 if the interpolated point is the first vertex)
*/
function interpolateOnLine(map, latLngs, ratio) {
    latLngs = (latLngs instanceof L.Polyline) ? latLngs.getLatLngs() : latLngs;
    var n = latLngs.length;
    if (n < 2) {
        return null;
    }

    // ensure the ratio is between 0 and 1;
    ratio = Math.max(Math.min(ratio, 1), 0);

    if (ratio === 0) {
        return {
            latLng: latLngs[0] instanceof L.LatLng ? latLngs[0] : L.latLng(latLngs[0]),
            predecessor: -1
        };
    }
    if (ratio == 1) {
        return {
            latLng: latLngs[latLngs.length -1] instanceof L.LatLng ? latLngs[latLngs.length -1] : L.latLng(latLngs[latLngs.length -1]),
            predecessor: latLngs.length - 2
        };
    }

    // project the LatLngs as Points,
    // and compute total planar length of the line at max precision
    var maxzoom = map.getMaxZoom();
    if (maxzoom === Infinity)
        maxzoom = map.getZoom();
    var pts = [];
    var lineLength = 0;
    for(var i = 0; i < n; i++) {
        pts[i] = map.project(latLngs[i], maxzoom);
        if(i > 0)
          lineLength += pts[i-1].distanceTo(pts[i]);
    }

    var ratioDist = lineLength * ratio;

    // follow the line segments [ab], adding lengths,
    // until we find the segment where the points should lie on
    var cumulativeDistanceToA = 0, cumulativeDistanceToB = 0;
    for (var i = 0; cumulativeDistanceToB < ratioDist; i++) {
        var pointA = pts[i], pointB = pts[i+1];

        cumulativeDistanceToA = cumulativeDistanceToB;
        cumulativeDistanceToB += pointA.distanceTo(pointB);
    }

    if (pointA == undefined && pointB == undefined) { // Happens when line has no length
        var pointA = pts[0], pointB = pts[1], i = 1;
    }

    // compute the ratio relative to the segment [ab]
    var segmentRatio = ((cumulativeDistanceToB - cumulativeDistanceToA) !== 0) ? ((ratioDist - cumulativeDistanceToA) / (cumulativeDistanceToB - cumulativeDistanceToA)) : 0;
    var interpolatedPoint = L.point((pointA.x * (1 - segmentRatio)) + (segmentRatio * pointB.x),
                                    (pointA.y * (1 - segmentRatio)) + (segmentRatio * pointB.y));
    return {
        latLng: map.unproject(interpolatedPoint, maxzoom),
        predecessor: i-1
    };
}

/**
    Extracted from leaflet.geometryutil.

    Returns horizontal angle in degres between two points.
    @param {L.Point} a Coordinates of point A
    @param {L.Point} b Coordinates of point B
    @returns {Number} horizontal angle
 */
function angle(map, latlngA, latlngB) {
    var pointA = map.latLngToContainerPoint(latlngA),
        pointB = map.latLngToContainerPoint(latlngB),
        angleDeg = Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x) * 180 / Math.PI + 90;
    angleDeg += angleDeg < 0 ? 360 : 0;
    return angleDeg;
}

/**
   Extracted from leaflet.geometryutil.

   Returns the point that is a distance and heading away from
   the given origin point.
   @param {L.LatLng} latlng: origin point
   @param {float} heading: heading in degrees, clockwise from 0 degrees north.
   @param {float} distance: distance in meters
   @returns {L.latLng} the destination point.
   Many thanks to Chris Veness at http://www.movable-type.co.uk/scripts/latlong.html
   for a great reference and examples.
*/
function destination(latlng, heading, distance) {
    heading = (heading + 360) % 360;
    var rad = Math.PI / 180,
        radInv = 180 / Math.PI,
        R = L.CRS.Earth.R, // approximation of Earth's radius
        lon1 = latlng.lng * rad,
        lat1 = latlng.lat * rad,
        rheading = heading * rad,
        sinLat1 = Math.sin(lat1),
        cosLat1 = Math.cos(lat1),
        cosDistR = Math.cos(distance / R),
        sinDistR = Math.sin(distance / R),
        lat2 = Math.asin(sinLat1 * cosDistR + cosLat1 *
            sinDistR * Math.cos(rheading)),
        lon2 = lon1 + Math.atan2(Math.sin(rheading) * sinDistR *
            cosLat1, cosDistR - sinLat1 * Math.sin(lat2));
    lon2 = lon2 * radInv;
    lon2 = lon2 > 180 ? lon2 - 360 : lon2 < -180 ? lon2 + 360 : lon2;
    return L.latLng([lat2 * radInv, lon2]);
}

function modulus(i, n) {
    return ((i % n) + n) % n;
}

function definedProps(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([k, v]) => v !== undefined)
    );
}

/**
* Whether or not a string is in the format '<number>m'
* @param {string} value
* @returns Boolean
*/
function isInMeters(value) {
    return (
        value
            .toString()
            .trim()
            .slice(value.toString().length - 1, value.toString().length) === 'm'
    );
}

/**
* Whether or not a string is in the format '<number>%'
* @param {string} value
* @returns Boolean
*/
function isInPercent(value) {
    return (
        value
            .toString()
            .trim()
            .slice(value.toString().length - 1, value.toString().length) === '%'
    );
}

/**
* Whether or not a string is in the format '<number>px'
* @param {string} value
* @returns Boolean
*/
function isInPixels(value) {
    return (
        value
            .toString()
            .trim()
            .slice(value.toString().length - 2, value.toString().length) === 'px'
    );
}

function pixelsToMeters(pixels, map) {
    let refPoint1 = map.getCenter();
    let xy1 = map.latLngToLayerPoint(refPoint1);
    let xy2 = {
        x: xy1.x + Number(pixels),
        y: xy1.y,
    };
    let refPoint2 = map.layerPointToLatLng(xy2);
    let derivedMeters = map.distance(refPoint1, refPoint2);
    return derivedMeters;
}

export var ArrowHead = L.ArrowHead = L.Polyline.extend({
    /**
     * Adds arrowheads to an L.polyline
     * @param {object} options The options for the arrowhead.  See documentation for details
     * @returns The L.polyline instance that they arrowheads are attached to
     */
    arrowheads: function (options = {}) {
        // Merge user input options with default options:
        const defaults = {
            yawn: 60,
            size: '15%',
            frequency: 'allvertices',
            proportionalToTotal: false,
        };

        this.options.noClip = true;

        let actualOptions = Object.assign({}, defaults, options);
        this._arrowheadOptions = actualOptions;

        this._hatsApplied = true;
        return this;
    },

    buildVectorHats: function (options) {
        // Reset variables from previous this._update()
        if (this._arrowheads) {
            this._arrowheads.remove();
        }

        if (this._ghosts) {
            this._ghosts.remove();
        }

        //  -------------------------------------------------------- //
        //  ------------  FILTER THE OPTIONS ----------------------- //
        /*
         * The next 3 lines folds the options of the parent polyline into the default options for all polylines
         * The options for the arrowhead are then folded in as well
         * All options defined in parent polyline will be inherited by the arrowhead, unless otherwise specified in the arrowhead(options) call
         */

        let defaultOptionsOfParent = Object.getPrototypeOf(
            Object.getPrototypeOf(this.options)
        );

        // merge default options of parent polyline (this.options's prototype's prototype) with options passed to parent polyline (this.options).
        let parentOptions = Object.assign({}, defaultOptionsOfParent, this.options);

        // now merge in the options the user has put in the arrowhead call
        let hatOptions = Object.assign({}, parentOptions, options);

        // ...with a few exceptions:
        hatOptions.smoothFactor = 1;
        hatOptions.fillOpacity = 1;
        hatOptions.fill = options.fill ? true : false;
        hatOptions.interactive = false;

        //  ------------  FILTER THE OPTIONS END -------------------- //
        //  --------------------------------------------------------- //

        //  --------------------------------------------------------- //
        //  ------ LOOP THROUGH EACH POLYLINE SEGMENT --------------- //
        //  ------ TO CALCULATE HAT SIZES AND CAPTURE IN ARRAY ------ //

        let size = options.size.toString(); // stringify if its a number
        let allhats = []; // empty array to receive hat polylines
        const { frequency, offsets } = options;

        if (offsets?.start || offsets?.end) {
            this._buildGhosts({ start: offsets.start, end: offsets.end });
        }

        const lineToTrace = this._ghosts || this;

        lineToTrace._parts.forEach((peice, index) => {
            // Immutable variables for each peice
            const latlngs = peice.map((point) => this._map.layerPointToLatLng(point));

            const totalLength = (() => {
                let total = 0;
                for (var i = 0; i < peice.length - 1; i++) {
                    total += this._map.distance(latlngs[i], latlngs[i + 1]);
                }
                return total;
            })();

            // TBD by options if tree below
            let derivedLatLngs;
            let derivedBearings;
            let spacing;
            let noOfPoints;

            //  Determining latlng and bearing arrays based on frequency choice:
            if (!isNaN(frequency)) {
                spacing = 1 / frequency;
                noOfPoints = frequency;
            } else if (isInPercent(frequency)) {
                console.error(
                    'Error: arrowhead frequency option cannot be given in percent.  Try another unit.'
                );
            } else if (isInMeters(frequency)) {
                spacing = frequency.slice(0, frequency.length - 1) / totalLength;
                noOfPoints = 1 / spacing;
                // round things out for more even spacing:
                noOfPoints = Math.floor(noOfPoints);
                spacing = 1 / noOfPoints;
            } else if (isInPixels(frequency)) {
                spacing = (() => {
                    let chosenFrequency = frequency.slice(0, frequency.length - 2);
                    let derivedMeters = pixelsToMeters(chosenFrequency, this._map);
                    return derivedMeters / totalLength;
                })();

                noOfPoints = 1 / spacing;

                // round things out for more even spacing:
                noOfPoints = Math.floor(noOfPoints);
                spacing = 1 / noOfPoints;
            }

            if (options.frequency === 'allvertices') {
                derivedBearings = (() => {
                    let bearings = [];
                    for (var i = 1; i < latlngs.length; i++) {
                        let bearing =
                            angle(
                                this._map,
                                latlngs[modulus(i - 1, latlngs.length)],
                                latlngs[i]
                            ) + 180;
                        bearings.push(bearing);
                    }
                    return bearings;
                })();

                derivedLatLngs = latlngs;
                derivedLatLngs.shift();
            } else if (options.frequency === 'endonly' && latlngs.length >= 2) {
                derivedLatLngs = [latlngs[latlngs.length - 1]];

                derivedBearings = [
                    angle(
                        this._map,
                        latlngs[latlngs.length - 2],
                        latlngs[latlngs.length - 1]
                    ) + 180,
                ];
            } else {
                derivedLatLngs = [];
                let interpolatedPoints = [];
                for (var i = 0; i < noOfPoints; i++) {
                    let interpolatedPoint = interpolateOnLine(
                        this._map,
                        latlngs,
                        spacing * (i + 1)
                    );

                    if (interpolatedPoint) {
                        interpolatedPoints.push(interpolatedPoint);
                        derivedLatLngs.push(interpolatedPoint.latLng);
                    }
                }

                derivedBearings = (() => {
                    let bearings = [];

                    for (var i = 0; i < interpolatedPoints.length; i++) {
                        let bearing = angle(
                            this._map,
                            latlngs[interpolatedPoints[i].predecessor + 1],
                            latlngs[interpolatedPoints[i].predecessor]
                        );
                        bearings.push(bearing);
                    }
                    return bearings;
                })();
            }

            let hats = [];

            // Function to build hats based on index and a given hatsize in meters
            const pushHats = (size, localHatOptions = {}) => {
                let yawn = localHatOptions.yawn ?? options.yawn;

                let leftWingPoint = destination(
                    derivedLatLngs[i],
                    derivedBearings[i] - yawn / 2,
                    size
                );

                let rightWingPoint = destination(
                    derivedLatLngs[i],
                    derivedBearings[i] + yawn / 2,
                    size
                );

                let hatPoints = [
                    [leftWingPoint.lat, leftWingPoint.lng],
                    [derivedLatLngs[i].lat, derivedLatLngs[i].lng],
                    [rightWingPoint.lat, rightWingPoint.lng],
                ];

                let hat = options.fill
                    ? L.polygon(hatPoints, { ...hatOptions, ...localHatOptions })
                    : L.polyline(hatPoints, { ...hatOptions, ...localHatOptions });

                hats.push(hat);
            }; // pushHats()

            // Function to build hats based on pixel input
            const pushHatsFromPixels = (size, localHatOptions = {}) => {
                let sizePixels = size.slice(0, size.length - 2);
                let yawn = localHatOptions.yawn ?? options.yawn;

                let derivedXY = this._map.latLngToLayerPoint(derivedLatLngs[i]);

                let bearing = derivedBearings[i];

                let thetaLeft = (180 - bearing - yawn / 2) * (Math.PI / 180),
                    thetaRight = (180 - bearing + yawn / 2) * (Math.PI / 180);

                let dxLeft = sizePixels * Math.sin(thetaLeft),
                    dyLeft = sizePixels * Math.cos(thetaLeft),
                    dxRight = sizePixels * Math.sin(thetaRight),
                    dyRight = sizePixels * Math.cos(thetaRight);

                let leftWingXY = {
                    x: derivedXY.x + dxLeft,
                    y: derivedXY.y + dyLeft,
                };
                let rightWingXY = {
                    x: derivedXY.x + dxRight,
                    y: derivedXY.y + dyRight,
                };

                let leftWingPoint = this._map.layerPointToLatLng(leftWingXY),
                    rightWingPoint = this._map.layerPointToLatLng(rightWingXY);

                let hatPoints = [
                    [leftWingPoint.lat, leftWingPoint.lng],
                    [derivedLatLngs[i].lat, derivedLatLngs[i].lng],
                    [rightWingPoint.lat, rightWingPoint.lng],
                ];

                let hat = options.fill
                    ? L.polygon(hatPoints, { ...hatOptions, ...localHatOptions })
                    : L.polyline(hatPoints, { ...hatOptions, ...localHatOptions });

                hats.push(hat);
            }; // pushHatsFromPixels()

            //  -------  LOOP THROUGH POINTS IN EACH SEGMENT ---------- //
            for (var i = 0; i < derivedLatLngs.length; i++) {
                let { perArrowheadOptions, ...globalOptions } = options;

                perArrowheadOptions = perArrowheadOptions ? perArrowheadOptions(i) : {};
                perArrowheadOptions = Object.assign(
                    globalOptions,
                    definedProps(perArrowheadOptions)
                );

                size = perArrowheadOptions.size ?? size;

                // ---- If size is chosen in meters -------------------------
                if (isInMeters(size)) {
                    let hatSize = size.slice(0, size.length - 1);
                    pushHats(hatSize, perArrowheadOptions);

                    // ---- If size is chosen in percent ------------------------
                } else if (isInPercent(size)) {
                    let sizePercent = size.slice(0, size.length - 1);
                    let hatSize = (() => {
                        if (
                            options.frequency === 'endonly' &&
                            options.proportionalToTotal
                        ) {
                            return (totalLength * sizePercent) / 100;
                        } else {
                            let averageDistance = totalLength / (peice.length - 1);
                            return (averageDistance * sizePercent) / 100;
                        }
                    })(); // hatsize calculation

                    pushHats(hatSize, perArrowheadOptions);

                    // ---- If size is chosen in pixels --------------------------
                } else if (isInPixels(size)) {
                    pushHatsFromPixels(options.size, perArrowheadOptions);

                    // ---- If size unit is not given -----------------------------
                } else {
                    console.error(
                        'Error: Arrowhead size unit not defined.  Check your arrowhead options.'
                    );
                } // if else block for Size
            } // for loop for each point witin a peice

            allhats.push(...hats);
        }); // forEach peice

        //  --------- LOOP THROUGH EACH POLYLINE END ---------------- //
        //  --------------------------------------------------------- //

        let arrowheads = L.layerGroup(allhats);
        this._arrowheads = arrowheads;

        return this;
    },

    getArrowheads: function () {
        if (this._arrowheads) {
            return this._arrowheads;
        } else {
            return console.error(
                `Error: You tried to call '.getArrowheads() on a shape that does not have a arrowhead.  Use '.arrowheads()' to add a arrowheads before trying to call '.getArrowheads()'`
            );
        }
    },

    /**
     * Builds ghost polylines that are clipped versions of the polylines based on the offsets
     * If offsets are used, arrowheads are drawn from 'this._ghosts' rather than 'this'
     */
    _buildGhosts: function ({ start, end }) {
        if (start || end) {
            let latlngs = this.getLatLngs();

            latlngs = Array.isArray(latlngs[0]) ? latlngs : [latlngs];

            const newLatLngs = latlngs.map((segment) => {
                // Get total distance of original latlngs
                const totalLength = (() => {
                    let total = 0;
                    for (var i = 0; i < segment.length - 1; i++) {
                        total += this._map.distance(segment[i], segment[i + 1]);
                    }
                    return total;
                })();

                // Modify latlngs to end at interpolated point
                if (start) {
                    let endOffsetInMeters = (() => {
                        if (isInMeters(start)) {
                            return Number(start.slice(0, start.length - 1));
                        } else if (isInPixels(start)) {
                            let pixels = Number(start.slice(0, start.length - 2));
                            return pixelsToMeters(pixels, this._map);
                        }
                    })();

                    let newStart = interpolateOnLine(
                        this._map,
                        segment,
                        endOffsetInMeters / totalLength
                    );

                    segment = segment.slice(
                        newStart.predecessor === -1 ? 1 : newStart.predecessor + 1,
                        segment.length
                    );
                    segment.unshift(newStart.latLng);
                }

                if (end) {
                    let endOffsetInMeters = (() => {
                        if (isInMeters(end)) {
                            return Number(end.slice(0, end.length - 1));
                        } else if (isInPixels(end)) {
                            let pixels = Number(end.slice(0, end.length - 2));
                            return pixelsToMeters(pixels, this._map);
                        }
                    })();

                    let newEnd = interpolateOnLine(
                        this._map,
                        segment,
                        (totalLength - endOffsetInMeters) / totalLength
                    );

                    segment = segment.slice(0, newEnd.predecessor + 1);
                    segment.push(newEnd.latLng);
                }

                return segment;
            });

            this._ghosts = L.polyline(newLatLngs, {
                ...this.options,
                color: 'rgba(0,0,0,0)',
                stroke: 0,
                smoothFactor: 0,
                interactive: false,
            });
            this._ghosts.addTo(this._map);
        }
    },

    deleteArrowheads: function () {
        if (this._arrowheads) {
            this._arrowheads.remove();
            delete this._arrowheads;
            delete this._arrowheadOptions;
            this._hatsApplied = false;
        }
        if (this._ghosts) {
            this._ghosts.remove();
        }
    },

    _update: function () {
        if (!this._map) {
            return;
        }

        this._clipPoints();
        this._simplifyPoints();
        this._updatePath();

        if (this._hatsApplied) {
            this.buildVectorHats(this._arrowheadOptions);
            this._map.addLayer(this._arrowheads);
        }
    },

    remove: function () {
        if (this._arrowheads) {
            this._arrowheads.remove();
        }
        if (this._ghosts) {
            this._ghosts.remove();
        }
        return this.removeFrom(this._map || this._mapToAdd);
    },
});

L.arrowhead = function (latlngs, options) {
    return new L.ArrowHead(latlngs, options);
};

export function arrowhead(latlngs, options) {
  return new ArrowHead(latlngs, options);
}

L.LayerGroup.include({
	removeLayer: function (layer) {
		var id = layer in this._layers ? layer : this.getLayerId(layer);

		if (this._map && this._layers[id]) {
			if (this._layers[id]._arrowheads) {
				this._layers[id]._arrowheads.remove();
			}
			this._map.removeLayer(this._layers[id]);
		}

		delete this._layers[id];

		return this;
	},

	onRemove: function (map, layer) {
		for (var layer in this._layers) {
			if (this._layers[layer]) {
				this._layers[layer].remove();
			}
		}

		this.eachLayer(map.removeLayer, map);
	},
});

L.Map.include({
	removeLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (layer._arrowheads) {
			layer._arrowheads.remove();
		}
		if (layer._ghosts) {
			layer._ghosts.remove();
		}

		if (!this._layers[id]) {
			return this;
		}

		if (this._loaded) {
			layer.onRemove(this);
		}

		if (layer.getAttribution && this.attributionControl) {
			this.attributionControl.removeAttribution(layer.getAttribution());
		}

		delete this._layers[id];

		if (this._loaded) {
			this.fire('layerremove', { layer: layer });
			layer.fire('remove');
		}

		layer._map = layer._mapToAdd = null;

		return this;
	},
});

L.GeoJSON.include({
	geometryToLayer: function (geojson, options) {
		var geometry = geojson.type === 'Feature' ? geojson.geometry : geojson,
			coords = geometry ? geometry.coordinates : null,
			layers = [],
			pointToLayer = options && options.pointToLayer,
			_coordsToLatLng =
				(options && options.coordsToLatLng) || L.GeoJSON.coordsToLatLng,
			latlng,
			latlngs,
			i,
			len;

		if (!coords && !geometry) {
			return null;
		}

		switch (geometry.type) {
			case 'Point':
				latlng = _coordsToLatLng(coords);
				return this._pointToLayer(pointToLayer, geojson, latlng, options);

			case 'MultiPoint':
				for (i = 0, len = coords.length; i < len; i++) {
					latlng = _coordsToLatLng(coords[i]);
					layers.push(
						this._pointToLayer(pointToLayer, geojson, latlng, options)
					);
				}
				return new L.FeatureGroup(layers);

			case 'LineString':
			case 'MultiLineString':
				latlngs = L.GeoJSON.coordsToLatLngs(
					coords,
					geometry.type === 'LineString' ? 0 : 1,
					_coordsToLatLng
				);
				var polyline = new L.Polyline(latlngs, options);
				if (options.arrowheads) {
					polyline.arrowheads(options.arrowheads);
				}
				return polyline;

			case 'Polygon':
			case 'MultiPolygon':
				latlngs = L.GeoJSON.coordsToLatLngs(
					coords,
					geometry.type === 'Polygon' ? 1 : 2,
					_coordsToLatLng
				);
				return new L.Polygon(latlngs, options);

			case 'GeometryCollection':
				for (i = 0, len = geometry.geometries.length; i < len; i++) {
					var layer = this.geometryToLayer(
						{
							geometry: geometry.geometries[i],
							type: 'Feature',
							properties: geojson.properties,
						},
						options
					);

					if (layer) {
						layers.push(layer);
					}
				}
				return new L.FeatureGroup(layers);

			default:
				throw new Error('Invalid GeoJSON object.');
		}
	},

	addData: function (geojson) {
		var features = L.Util.isArray(geojson) ? geojson : geojson.features,
			i,
			len,
			feature;

		if (features) {
			for (i = 0, len = features.length; i < len; i++) {
				// only add this if geometry or geometries are set and not null
				feature = features[i];
				if (
					feature.geometries ||
					feature.geometry ||
					feature.features ||
					feature.coordinates
				) {
					this.addData(feature);
				}
			}
			return this;
		}

		var options = this.options;

		if (options.filter && !options.filter(geojson)) {
			return this;
		}

		var layer = this.geometryToLayer(geojson, options);
		if (!layer) {
			return this;
		}
		layer.feature = L.GeoJSON.asFeature(geojson);

		layer.defaultOptions = layer.options;
		this.resetStyle(layer);

		if (options.onEachFeature) {
			options.onEachFeature(geojson, layer);
		}

		return this.addLayer(layer);
	},

	_pointToLayer: function (pointToLayerFn, geojson, latlng, options) {
		return pointToLayerFn
			? pointToLayerFn(geojson, latlng)
			: new L.Marker(
					latlng,
					options && options.markersInheritOptions && options
			  );
	},
});
