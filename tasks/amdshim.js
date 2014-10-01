module.exports = function (grunt) {
	"use strict";

	var libDir = "./lib/";
	var normalizeCfg = require(libDir + "normalizeConfig");
	var eachProp = require(libDir + "lang").eachProp;
	var getUtils = require(libDir + "utils");

	grunt.registerTask("amdshim", function (layerName, buildCfg, loaderCfg) {
		var buildConfig = grunt.config(buildCfg);
		if (!buildConfig) {
			grunt.fail.warn("No build config was found.");
			buildConfig = {};
		}
		buildConfig = normalizeCfg.build(buildConfig);
		var layersMap = buildConfig.layersByName;
		var layer = layersMap[layerName];

		var loaderConfig = grunt.config(loaderCfg);
		if (!loaderConfig) {
			grunt.fail.warn("No loader config was found.");
			loaderConfig = {};
		}
		loaderConfig = normalizeCfg.loader(grunt.config(loaderCfg));

		var utils = getUtils(loaderConfig);

		// Return true if shim2 is a deps of shim1
		// shim1 is an object and shim2 is a string
		function isDeps(shim1, shim2) {
			return shim1.deps && (shim1.deps.indexOf(shim2) !== -1);
		}

		var shim = loaderConfig.shim;

		if (shim) {
			// flatten deps
			var flatShim = {};

			eachProp(shim, function (id, value) {
				var newValue = {
					deps: value.deps ? [].concat(value.deps) : [],
					exports: value.exports,
					init: value.init
				};

				var fifo = [].concat(newValue.deps);
				while (fifo.length) {
					var currId = fifo.pop();
					var currValue = shim[currId];

					if (currValue && currValue.deps) {
						currValue.deps.forEach(function (id) {
							if (newValue.deps.indexOf(id) === -1) {
								newValue.deps.push(id);
								fifo.push(id);
							}
						});
					}
				}

				flatShim[id] = newValue;
			});

			var shimAry = Object.keys(flatShim).sort(function (shim1, shim2) {
				var value1 = flatShim[shim1];
				var value2 = flatShim[shim2];

				if (isDeps(value1, shim2)) {
					return 1;
				} else if (isDeps(value2, shim1)) {
					return -1;
				} else {
					return 0;
				}
			});

			shimAry.forEach(function (id) {
				var value = shim[id];

				var shimValue = {
					filepath: utils.nameToFilepath(id)
				};

				shimValue.content = grunt.file.read(shimValue.filepath) +
					"define(\"" + id + "\", (function (global) {\n" +
					"	return function () {\n" +
					"		var ret;\n" +
					(value.init ? (
					"		var fn = " + value.init.toString() + ";\n" +
					"       ret = fn.apply(global, arguments);\n") : "") +
					(value.exports ?
					"		return ret || global[\"" + value.exports + "\"];\n" :
					"		return ret;\n") +
					"    };\n" +
					"})(this));";

				layer.shim.push(shimValue);
			});

			// Save the config
			grunt.config([buildCfg], buildConfig);
		}

	});
};