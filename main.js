require('./lib/document-ready')

const d3 = require('d3')
const topojson = require('topojson')
require('d3-geo-projection')(d3)
require('./lib/d3-geo-polyhedron')(d3)
window.d3 = d3
window.Datamap = require('datamaps/dist/datamaps.world.js')

const countBy = require('lodash/countBy')
const flatten = require('lodash/flatten')
const forEach = require('lodash/forEach')
const identity = require('lodash/identity')
const includes = require('lodash/includes')
const max = require('lodash/max')
const min = require('lodash/min')
const round = require('lodash/round')
const sum = require('lodash/sum')
const uniq = require('lodash/uniq')
const values = require('lodash/values')

const littlefoot = require('./lib/littlefoot.min.js').default
littlefoot()

let world = {}
let survey = {}

function prepareWorld() {
    return new Promise((resolve, reject) => {
        d3.json('./data/world-110m.json', (err, w) => {
            if (err) reject(err)
            world = w;
            resolve()
        })
    })
}

function loadSurveyData() {
    return new Promise((resolve, reject) => {
        d3.csv('./data/survey-results.csv', (err, data) => {
            if (err) reject(err)
            survey = data;
            resolve()
        })
    })
}

const WIDTH = 700

function baseMap(options) {
    let map = options.map
    let width = options.width
    let height = options.height
    let projection = options.projection
    var path = d3.geo.path()
        .projection(projection);

    let graticule = d3.geo.graticule()

    let svg = d3.select(`h-map[data-map=${map}]`).append("svg")
        .attr("width", width)
        .attr("height", height);

    var defs = svg.append("defs");

    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", `${map}-sphere`)
        .attr("d", path);

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", `#${map}-sphere`);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", `#${map}-sphere`);


    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);

    svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

    d3.select(self.frameElement).style("height", height + "px");
}

function mercator() {
    let width = WIDTH
    let height = width

    var projection = d3.geo.mercator()
        .scale(100)
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'mercator', width, height, projection})
}

function gallPeters() {
    let width = WIDTH
    let height = width * 0.635416667

    let projection = d3.geo.cylindricalEqualArea()
        .parallel(45)
        .scale(145)
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'gall-peters', width, height, projection})
}

function snyder() {
    let width = WIDTH
    let height = width * 0.635416667

    let projection = d3.geo.cylindricalEqualArea()
        .parallel(45)
        .scale(115)
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'gall-peters', width, height, projection})
}

function watermanButterfly() {
    var width = WIDTH * 1.25,
        height = width * .572916667;

    var projection = d3.geo.polyhedron.waterman()
        .rotate([20, 0])
        .scale(90)
        .translate([width / 2, height / 2])
        .precision(.1);

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select("h-map[data-map=waterman-butterfly]").append("svg")
        .attr("width", width)
        .attr("height", height);

    var defs = svg.append("defs");

    defs.append("path")
        .datum({type: "Sphere"})
        .attr("id", "waterman-butterfly-sphere")
        .attr("d", path);

    defs.append("clipPath")
        .attr("id", "waterman-butterfly-clip")
      .append("use")
        .attr("xlink:href", "#waterman-butterfly-sphere");

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#waterman-butterfly-sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#waterman-butterfly-sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("clip-path", "url(#waterman-butterfly-clip)")
        .attr("d", path);


    svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("clip-path", "url(#waterman-butterfly-clip)")
      .attr("d", path);

    svg.insert("path", ".graticule")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("clip-path", "url(#waterman-butterfly-clip)")
      .attr("d", path);

    d3.select(self.frameElement).style("height", height + "px");
}

function naturalEarthVs() {
    let query = 'h-map[data-map="natural-earth-vs"]'
    let buttons = d3.select(query)
        .append('h-tabs')

    let width = WIDTH
    let height = width * 0.52083

    let robinsonProjection = d3.geo.robinson().scale(100)
    let naturalProjection = d3.geo.naturalEarth().scale(110)
    let kavraiskiyProjection = d3.geo.kavrayskiy7().scale(100)

    let options = [
        {name: 'Natural Earth', projection: naturalProjection},
        {name: 'Robinson', projection: robinsonProjection},
        {name: 'Kavraiskiy VII', projection: kavraiskiyProjection},
    ];

    buttons.selectAll('li')
        .data(options)
        .enter()
            .append('li')
                .append('input')
                    .property('checked', d => d.name === options[0].name)
                    .attr('type', 'radio')
                    .attr('name', 'natural-earth-vs')
                    .attr('id', d => d.name + 'natural')
                    .on('change', update)

    buttons.selectAll('li')
        .append('label')
            .text(d => d.name)
            .attr('for', d => d.name + 'natural')

    options.forEach(o => o.projection.rotate([0, 0]).center([0, 0]))

    let i = 0
    let n = options.length - 1

    var projection = options[i].projection;

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select(query).append("svg")
        .classed('map', true)
        .attr("width", width)
        .attr("height", height);

    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);



    svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);


    var λ = d3.scale.linear()
        .domain([0, width])
        .range([-180, 180]);

    var φ = d3.scale.linear()
        .domain([0, height])
        .range([90, -90]);

    function update(option) {
        svg.selectAll("path").transition()
          .duration(750)
          .attrTween("d", projectionTween(projection, projection = option.projection));
    }

    update(options[0])

    function projectionTween(projection0, projection1) {
      return (d) => {
        var t = 0;

        var projection = d3.geo.projection(project)
            .scale(1)
            .translate([width / 2, height / 2]);

        var path = d3.geo.path()
            .projection(projection);

        function project(λ, φ) {
          λ *= 180 / Math.PI, φ *= 180 / Math.PI;
          var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
          return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        }

        return (newT) => {
          t = newT;
          return path(d);
        };
      };
    }
}

function mapTransitionssvg() {
    var width = 960,
        height = 500;

    var options = [
        {name: 'Mercator', projection: d3.geo.mercator().scale(100)},
        {name: 'Gall-Peters', projection: d3.geo.cylindricalEqualArea().parallel(45).scale(145).translate([width / 2, height / 2]).precision(.1)},
        {name: 'Natural Earth', projection: d3.geo.naturalEarth()},
    ];

    options.forEach(o => o.projection.rotate([0, 0]).center([0, 0]))

    let i = 0
    let n = options.length - 1

    var projection = options[i].projection;

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var svg = d3.select("h-map[data-map=transitions]").append("svg")
        .classed('map', true)
        .attr("width", width)
        .attr("height", height);

    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);



    svg.insert("path", ".graticule")
      .datum(topojson.feature(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path);


    var λ = d3.scale.linear()
        .domain([0, width])
        .range([-180, 180]);

    var φ = d3.scale.linear()
        .domain([0, height])
        .range([90, -90]);

    var menu = d3.select("#projection-menu")

    menu.selectAll("li")
        .data(options)
      .enter()
        .append('li')
            .append('input')
                .property('checked', d => d.name === options[i].name)
                .attr('type', 'radio')
                .attr('name', 'projections')
                .attr('id', d => d.name)
                .on("change", update)

    menu.selectAll("li")
        .append("label")
        .text(d => d.name)
        .attr('for', d => d.name)


    function update(option) {
        svg.selectAll("path").transition()
          .duration(750)
          .attrTween("d", projectionTween(projection, projection = option.projection));
    }

    function projectionTween(projection0, projection1) {
      return (d) => {
        var t = 0;

        var projection = d3.geo.projection(project)
            .scale(1)
            .translate([width / 2, height / 2]);

        var path = d3.geo.path()
            .projection(projection);

        function project(λ, φ) {
          λ *= 180 / Math.PI, φ *= 180 / Math.PI;
          var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
          return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
        }

        return (newT) => {
          t = newT;
          return path(d);
        };
      };
    }
}

function asiaProjections() {
    let width = WIDTH

    var options = [
        {name: 'Mercator', src: 'img/mercator.png'},
        {name: 'Gall-Peters', src: 'img/gall-peters.png'},
        {name: 'Natural Earth', src: 'img/natural-earth.png'},
        {name: 'Taiwan', src: 'img/taiwan.png'},
    ];

    var el = d3.select('h-map[data-map=asia-projections]')
    var menu = el.selectAll('h-tabs').data([true]).enter().append('h-tabs')

    el.selectAll('img')
        .data(options)
        .enter()
            .append('img')
                .attr('src', d => d.src)
                .classed('map', true)
                .attr('width', width)

    menu.selectAll('li')
        .data(options)
        .enter()
            .append('li')
                .append('input')
                    .property('checked', d => d.name === options[0].name)
                    .attr('type', 'radio')
                    .attr('name', 'projections')
                    .attr('id', d => d.name)
                    .on('change', update)

    menu.selectAll('li')
        .append('label')
            .text(d => d.name)
            .attr('for', d => d.name)

    function update(option) {
        el.selectAll('img').classed('hidden', d => d.name !== option.name)
    }
    update(options[0])
}

function surveyResults() {
    let buttons = d3.select('h-map[data-map="survey-results"]')
        .append('h-tabs')

    function update(country) {
        let all = country === 'All'
        let items = survey
            .filter(l => all || l.country === country)
            .map(l => l.selections)
            .map(l => l.trim().split(' '))
            .filter(arr => arr.length > 1)

        items = flatten(items).filter(identity)

        let counted = countBy(items)

        let minVal = min(values(counted))
        if (minVal === 1)  minVal = 0
        let maxVal = max(values(counted))

        let colorScale = d3.scale.linear()
            .domain([minVal, maxVal])
            .range(['#BDE5D3', '#3D9970'])

        var newFills = {}
        forEach(counted, function(num, country) {
            newFills[country] = colorScale(num)
            map.options.data[country] = {
                votes: num,
                outOf: max,
                percent: round((num / maxVal) * 100, 0),
            }
        })

        map.updateChoropleth(newFills, {reset: true})
    }

    let map = new Datamap({
        scope: 'world',
        element: document.querySelector('h-map[data-map="survey-results"]'),
        height: WIDTH * 0.4,
        width: WIDTH,
        data: {},
        geographyConfig: {
            highlightOnHover: false,
            highlightBorderWidth: 1,
            popupOnHover: true,
            popupTemplate(geo, data) {
                return `<div class="hoverinfo"><strong>
                    Votes for ${geo.properties.name}: ${data.votes || 0} of ${maxVal}, ${data.percent || 0}%
                </strong></div>`
            },
        },
        fills: {
            defaultFill: '#DDDDDD',
        },
        setProjection: function(element) {
            var projection = d3.geo.equirectangular()
                .center([125, 13])
                .rotate([200, 0])
                .scale(112)
                .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
            var path = d3.geo.path().projection(projection);

            return {path: path, projection: projection};
        },
    })

    let origins = uniq(survey.map(res => res.country)).sort()
    origins.unshift('All')

    buttons.selectAll('li')
        .data(origins)
        .enter()
            .append('li')
                .append('input')
                    .property('checked', d => d === origins[0])
                    .attr('type', 'radio')
                    .attr('name', 'origins')
                    .attr('id', d => d)
                    .on('change', update)

    buttons.selectAll('li')
        .append('label')
            .text(d => d)
            .attr('for', d => d)

    update(origins[0])
}

function asianPowerOrganizations() {
    let buttons = d3.select('h-map[data-map="asian-power-organizations"]')
        .append('h-tabs')
            // .classed('vertical', true)

    let color = d3.scale.category10()

    let map = new Datamap({
        scope: 'world',
        element: document.querySelector('h-map[data-map="asian-power-organizations"]'),
        // projection: 'naturalEarth',
        height: WIDTH * 0.4,
        width: WIDTH,
        geographyConfig: {
            highlightOnHover: false,
            highlightBorderWidth: 1,
            popupTemplate(geo, data) {
                if (!data.fillKey) {
                    return ""
                }
                return `<div class="hoverinfo"><strong>${geo.properties.name}</strong></div>`
            },
        },
        fills: {
            'defaultFill': '#DDDDDD',
            'East Asia Summit': color(0),
            'ASEAN': color(1),
            'ASEAN Regional Forum': color(2),
            'Asia-Pacific Economic Cooperation': color(3),
            'ASEAN +3': color(4),
            'Trans-Pacific Partnership': color(5),
            'Regional Comprehensive Economic Partnership': color(6),
            'Shanghai Cooperation Organization': color(7),
            'Council for Security Cooperation in the Asia Pacific': color(8),
        },
        setProjection: function(element) {
            var projection = d3.geo.equirectangular()
                .center([125, 13])
                .rotate([200, 0])
                .scale(112)
                .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
            var path = d3.geo.path().projection(projection);

            return {path: path, projection: projection};
        },
    })

    let afghanistan = 'AFG'
    let armenia = 'ARM'
    let australia = 'AUS'
    let azerbaijan = 'AZE'
    let bangladesh = 'BGD'
    let belarus = 'BLR'
    let brunei = 'BRN'
    let cambodia = 'KHM'
    let canada = 'CAN'
    let chile = 'CHL'
    let china = 'CHN'
    let EU = 'BEL'
    let hongKong = 'HKG'
    let india = 'IND'
    let indonesia = 'IDN'
    let iran = 'IRN'
    let japan = 'JPN'
    let kazakhstan = 'KAZ'
    let kyrgyzstan = 'KGZ'
    let laos = 'LAO'
    let malaysia = 'MYS'
    let mexico = 'MEX'
    let mongolia = 'MNG'
    let myanmar = 'MMR'
    let nepal = 'NPL'
    let newGuinea = 'PNG'
    let newZealand = 'NZL'
    let northKorea = 'PRK'
    let pakistan = 'PAK'
    let peru = 'PER'
    let philippines = 'PHL'
    let russia = 'RUS'
    let singapore = 'SGP'
    let southKorea = 'ROK'
    let sriLanka = 'LKA'
    let taiwan = 'TWN'
    let tajikistan = 'TJK'
    let thailand = 'THA'
    let timorLeste = 'TLS'
    let turkey = 'TUR'
    let US = 'USA'
    let uzbekistan = 'UZB'
    let vietnam = 'VNM'

    let partnerships = [
        {name: 'East Asia Summit', members: [australia, brunei, cambodia, russia, china, india, indonesia, japan, laos, malaysia, myanmar, newZealand, philippines, singapore, southKorea, thailand, US, vietnam]},
        {name: 'ASEAN', members: [thailand, cambodia, laos, indonesia, philippines, vietnam, brunei, malaysia, myanmar, singapore]},
        {name: 'ASEAN Regional Forum', members: [brunei, myanmar, cambodia, indonesia, laos, malaysia, philippines, singapore, thailand, vietnam, australia, canada, china, india, japan, southKorea, northKorea, russia, newZealand, US, mongolia, EU, pakistan, timorLeste, bangladesh, sriLanka]},
        {name: 'Asia-Pacific Economic Cooperation', members: [australia, brunei, canada, chile, china, hongKong, indonesia, japan, southKorea, malaysia, mexico, newZealand, newGuinea, peru, philippines, russia, singapore, taiwan, US, vietnam]},
        {name: 'ASEAN +3', members: [thailand, cambodia, laos, indonesia, philippines, vietnam, brunei, malaysia, myanmar, singapore, china, southKorea, japan]},
        {name: 'Trans-Pacific Partnership', members: [australia, canada, japan, malaysia, mexico, peru, US, chile, brunei, vietnam, singapore, newZealand]},
        {name: 'Regional Comprehensive Economic Partnership', members: [indonesia, malaysia, brunei, philippines, singapore, thailand, vietnam, laos, myanmar, cambodia, china, japan, southKorea, india, australia, newZealand]},
        {name: 'Shanghai Cooperation Organization', members: [kazakhstan, kyrgyzstan, russia, tajikistan, uzbekistan, afghanistan, belarus, india, iran, mongolia, pakistan, armenia, azerbaijan, cambodia, nepal, sriLanka, turkey]},
        {name: 'Council for Security Cooperation in the Asia Pacific', members: [australia, canada, cambodia, EU, india, indonesia, japan, malaysia, mongolia, newZealand, northKorea, newGuinea, china, philippines, russia, singapore, southKorea, thailand, US, vietnam]},
    ]


    buttons.selectAll('li')
        .data(partnerships)
        .enter()
            .append('li')
                .append('input')
                    .property('checked', d => d.name === partnerships[0].name)
                    .attr('type', 'radio')
                    .attr('name', 'partnerships')
                    .attr('id', d => d.name)
                    .on('change', update)

    buttons.selectAll('li')
        .append('label')
            .text(d => d.name)
            .attr('for', d => d.name)

    function update(group) {
        let members = group.members
        let name = group.name
        let newFills = {}
        forEach(members, country => {
            newFills[country] = {fillKey: name}
        })
        map.updateChoropleth(newFills, {reset: true})
    }

    update(partnerships[0])
}

function americaIsTheMiddle() {
    let width = WIDTH
    let height = width * 0.55

    let projection = d3.geo.wagner7()
        .scale(130)
        .rotate([90, 0, 0])
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'america-is-the-middle', width, height, projection})
}
function chinaIsTheMiddle() {
    let width = WIDTH
    let height = width * 0.55

    let projection = d3.geo.wagner7()
        .scale(130)
        .rotate([245, 0, 0])
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'china-is-the-middle', width, height, projection})
}
function macarthurCorrective() {
    let width = WIDTH
    let height = width * 0.55

    let projection = d3.geo.wagner7()
        .scale(130)
        .rotate([205, 0, 180])
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'macarthur-corrective', width, height, projection})
}

function macarthurCorrective() {
    let width = WIDTH
    let height = width * 0.55

    let projection = d3.geo.wagner7()
        .scale(130)
        .rotate([205, 0, 180])
        .translate([width / 2, height / 2])
        .precision(.1);

    baseMap({map: 'macarthur-corrective', width, height, projection})
}

function emotionalInvolvement() {
    let width = 500

    var options = [
        {name: 'Map A', src: 'img/figure-1.png'},
        {name: 'Map B', src: 'img/figure-2.png'},
        {name: 'Map C', src: 'img/figure-3.png'},
        {name: 'Map D', src: 'img/figure-4.png'},
    ];

    var el = d3.select('h-map[data-map=emotional-involvement]')
    var menu = el.selectAll('h-tabs').data([true]).enter().append('h-tabs')

    el.selectAll('img')
        .data(options)
        .enter()
            .append('img')
                .attr('src', d => d.src)
                .classed('map', true)
                .attr('width', width)

    menu.selectAll('li')
        .data(options)
        .enter()
            .append('li')
                .append('input')
                    .property('checked', d => d.name === options[0].name)
                    .attr('type', 'radio')
                    .attr('name', 'emotion')
                    .attr('id', d => d.name + 'emotion')
                    .on('change', update)

    menu.selectAll('li')
        .append('label')
            .text(d => d.name)
            .attr('for', d => d.name + 'emotion')

    function update(option) {
        el.selectAll('img').classed('hidden', d => d.name !== option.name)
    }
    update(options[0])
}

function loadMaps() {
    // mercator()
    // gallPeters()
    // watermanButterfly()
    // naturalEarthVs()
    // asiaProjections()
    // surveyResults()
    // asianPowerOrganizations()
    // americaIsTheMiddle()
    // chinaIsTheMiddle()
    // macarthurCorrective()
    emotionalInvolvement()
}
document.ready
    .then(() => Promise.all([
        prepareWorld(),
        loadSurveyData(),
    ]))
    .then(loadMaps)
