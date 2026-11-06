#!/bin/sh

set -e

mkdir -p dist

node_modules/.bin/rollup -c build/rollup-config.js

cat src/geometryutil.js	src/index.js \
	| grep -v -e import -e export \
	| sed 's/Polyline/L.Polyline/g' \
	| sed 's/LayerGroup/L.LayerGroup/g' \
	| sed 's/CRS/L.CRS/g' \
	| sed 's/new Polyline/L.polyline/g' \
	| sed 's/new Polygone/L.polygone/g' \
	| sed 's/new LayerGroup/new L.layerGroup/g' \
	| sed 's/^Point/L.Point/g' \
	> dist/leafletv1-arrowheads.js
