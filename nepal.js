/*global d3, topojson, console*/
var nepal = (function () {
    'use strict';

    var choroplethMap = function (options) {

        var svgId = options.svgId,
            width = options.width,
            height = options.height,
            viewBox = options.viewBox,
            preserveAspectRatio = options.preserveAspectRatio,
            admLevelType = options.admLevelType,
            nepalJsonPath = options.nepalJsonPath,
            dataJsonPath = options.dataJsonPath,
            range = options.range,
            svg,
            projection,
            path;

        console.log("options =", options);

        svg = d3.select("body").append("svg")
            .attr("id", svgId)
            .attr("class", "Reds")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", viewBox)
            .attr("preserveAspectRatio", preserveAspectRatio)
            .style("border", "1px solid black");

        projection = d3.geo.mercator();

        path = d3.geo.path()
            .projection(projection);

        d3.json(nepalJsonPath, function (error, npl) {
            if (error) {
                return console.error(error);
            }

            var admLevel,
                bounds,
                scale,
                translation,
                container,
                quantile;

            switch (admLevelType) {
            case "devregion":
                admLevel = topojson.feature(npl, npl.objects.regions);
                break;

            case "zone":
                admLevel = topojson.feature(npl, npl.objects.zones);
                break;

            case "district":
                admLevel = topojson.feature(npl, npl.objects.districts);
                break;

            case "vdc":
                admLevel = topojson.feature(npl, npl.objects.vdcs);
                break;

            default:
                console.log("Valid Administrative Level Types: devregion, zone, district, and vdc.");
                break;
            }

            projection
                .scale(1)
                .translate([0, 0]);

            bounds = path.bounds(admLevel);
            scale = 0.98 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
            translation = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];

            container = svg.append("g")
                .attr("class", admLevelType + "-container");

            projection
                .scale(scale)
                .translate(translation);

            d3.json(dataJsonPath, function (jsonData) {

                var data = {},
                    min,
                    max;

                jsonData.forEach(function (d) {
                    data[d.id] = +d.data.literacy;
                });

                max = d3.max(d3.values(data));
                min = d3.min(d3.values(data));

                quantile = d3.scale.quantile()
                    .domain([min, max])
                    .range(d3.range(range));

                container.selectAll("." + admLevelType)
                    .data(admLevel.features)
                    .enter().append("path")
                    .attr("class", function (d) {
                        return admLevelType + " q" + quantile(data[d.id]) + "-" + range;
                    })
                    .attr("id", function (d) {
                        return admLevelType + "-" + d.id;
                    })
                    .attr("d", path);
            });
        });
    };

    return {
        choroplethMap: choroplethMap
    };
}());
