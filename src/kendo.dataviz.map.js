kendo_module({
    id: "dataviz.map",
    name: "Map",
    category: "dataviz",
    description: "",
    depends: [ "data", "userevents", "dataviz.core", "dataviz.svg", "dataviz.themes" ]
});

(function ($, undefined) {
    // Imports ================================================================
    var math = Math,
        atan = math.atan,
        exp = math.exp,
        pow = math.pow,
        sin = math.sin,
        log = math.log,
        tan = math.tan,

        kendo = window.kendo,
        Class = kendo.Class,
        Widget = kendo.ui.Widget,

        dataviz = kendo.dataviz,
        Point = dataviz.Point2D,
        deepExtend = kendo.deepExtend,
        limit = dataviz.limitValue;

    // CURRENTLY IN DIAGRAM MATH
    var Matrix = Class.extend({
        init: function (a, b, c, d, e, f) {
            this.a = a || 0;
            this.b = b || 0;
            this.c = c || 0;
            this.d = d || 0;
            this.e = e || 0;
            this.f = f || 0;
        },
        times: function (m) {
            return new Matrix(
                this.a * m.a + this.c * m.b,
                this.b * m.a + this.d * m.b,
                this.a * m.c + this.c * m.d,
                this.b * m.c + this.d * m.d,
                this.a * m.e + this.c * m.f + this.e,
                this.b * m.e + this.d * m.f + this.f
            );
        },
        apply: function (p) {
            return new Point(this.a * p.x + this.c * p.y + this.e, this.b * p.x + this.d * p.y + this.f);
        }
    });

    deepExtend(Matrix, {
        translate: function (x, y) {
            var m = new Matrix();
            m.a = 1;
            m.b = 0;
            m.c = 0;
            m.d = 1;
            m.e = x;
            m.f = y;
            return m;
        },
        unit: function () {
            return new Matrix(1, 0, 0, 1, 0, 0);
        },
        rotate: function (angle, x, y) {
            var m = new Matrix();
            m.a = math.cos(rad(angle));
            m.b = math.sin(rad(angle));
            m.c = -m.b;
            m.d = m.a;
            m.e = (x - x * m.a + y * m.b) || 0;
            m.f = (y - y * m.a - x * m.b) || 0;
            return m;
        },
        scale: function (scaleX, scaleY) {
            var m = new Matrix();
            m.a = scaleX;
            m.b = 0;
            m.c = 0;
            m.d = scaleY;
            m.e = 0;
            m.f = 0;
            return m;
        }
    });

    kendo.dataviz.Matrix = Matrix;


    // Constants ==============================================================
    var PI = math.PI,
        PI_DIV_2 = PI / 2,
        PI_DIV_4 = PI / 4,
        DEG_TO_RAD = PI / 180;

    // Map widget =============================================================
    var Map = Widget.extend({
        options: {
            name: "Map"
        }
    });

    // Implementation =========================================================
    var Location = function(lat, lng) {
        this.lat = lat;
        this.lng = lng;
    };

    Location.fromArray = function(ll) {
        return new Location(ll[1], ll[0]);
    };

    Location.fromLatLng = function(ll) {
        return new Location(ll[0], ll[1]);
    };

    var WGS84 = {
        a: 6378137,                 // Semi-major radius
        b: 6356752.314245179,       // Semi-minor radius
        f: 0.0033528106647474805,   // Flattening
        e: 0.08181919084262149      // Eccentricity
    };

    // WGS 84 / World Mercator
    var Mercator = Class.extend({
        init: function(options) {
            this.options = deepExtend({}, this.options, options);
        },

        MAX_LNG: 180,
        MAX_LAT: 85.0840590501,
        INVERSE_ITERATIONS: 15,
        INVERSE_CONVERGENCE: 1e-12,

        options: {
            centralMeridian: 0,
            datum: WGS84
        },

        forward: function(loc) {
            var proj = this,
                options = proj.options,
                datum = options.datum,
                r = datum.a,
                lng0 = options.centralMeridian,
                lat = limit(loc.lat, -proj.MAX_LAT, proj.MAX_LAT),
                lng = limit(loc.lng, -proj.MAX_LNG, proj.MAX_LNG),
                x = rad(lng - lng0) * r,
                y = proj._projectLat(lat);

            return new Point(x, y);
        },

        _projectLat: function(lat) {
            var datum = this.options.datum,
                ecc = datum.e,
                r = datum.a,
                y = rad(lat),
                ts = tan(PI_DIV_4 + y / 2),
                con = ecc * sin(y),
                p = pow((1 - con) / (1 + con), ecc / 2);

            // See:
            // http://en.wikipedia.org/wiki/Mercator_projection#Generalization_to_the_ellipsoid
            return r * log(ts * p);
        },

        inverse: function(point) {
            var proj = this,
                options = proj.options,
                datum = options.datum,
                r = datum.a,
                lng0 = options.centralMeridian,
                lng = point.x / (DEG_TO_RAD * r) + lng0,
                lat = proj._inverseY(point.y);

            return new Location(lat, lng);
        },

        _inverseY: function(y) {
            var proj = this,
                datum = proj.options.datum,
                r = datum.a,
                ecc = datum.e,
                ecch = ecc / 2,
                ts = exp(-y / r),
                phi = PI_DIV_2 - 2 * atan(ts),
                i;

            for (i = 0; i <= proj.INVERSE_ITERATIONS; i++) {
                var con = ecc * sin(phi),
                    p = pow((1 - con) / (1 + con), ecch),
                    dphi = PI_DIV_2 - 2 * atan(ts * p) - phi;

                phi += dphi;

                if (math.abs(dphi) <= proj.INVERSE_CONVERGENCE) {
                    break;
                }
            }

            return deg(phi);
        }
    });

    // WGS 84 / Pseudo-Mercator
    // Used by Google Maps, Bing, OSM, etc.
    // Spherical projection of ellipsoidal coordinates.
    var SphericalMercator = Mercator.extend({
        MAX_LAT: 85.0511287798,

        _projectLat: function(lat) {
            var r = this.options.datum.a,
                y = rad(lat),
                ts = tan(PI_DIV_4 + y / 2);

            return r * log(ts);
        },

        _inverseY: function(y) {
            var r = this.options.datum.a,
                ts = exp(-y / r);

            return deg(PI_DIV_2 - (2 * atan(ts)));
        }
    });

    var Equirectangular = Class.extend({
        forward: function(loc) {
            return new Point(loc.lng, loc.lat);
        },

        inverse: function(point) {
            return new Location(point.y, point.x);
        }
    });

    var EPSG3857 = Class.extend({
        init: function() {
            var crs = this,
                proj = crs._proj = new SphericalMercator();

            var c = 2 * PI * proj.options.datum.a;

            // Scale circumference to 1, mirror Y and shift origin to top left
            this.ctm = Matrix.translate(0.5, 0.5).times(Matrix.scale(1/c, -1/c));

            // Inverse transform
            this.rctm = Matrix.scale(c, -c).times(Matrix.translate(-0.5, -0.5));
        },

        // Location <-> Point (map units, e.g. meters)
        toPoint: function(loc) {
            var p = this._proj.forward(loc);

            return this.ctm.apply(p);
        },

        toLocation: function(point) {
            point = this.rctm.apply(point);

            return this._proj.inverse(point);
        }
    });

    var EPSG3395 = Class.extend({
        init: function() {
            this._proj = new Mercator();
        },

        toPoint: function(loc) {
            return this._proj.forward(loc);
        },

        toLocation: function(point) {
            return this._proj.inverse(point);
        }
    });

    // WGS 84
    var EPSG4326 = Class.extend({
        init: function() {
            this._proj = new Equirectangular();
        },

        toPoint: function(loc) {
            return this._proj.forward(loc);
        },

        toLocation: function(point) {
            return this._proj.inverse(point);
        }
    });

    // Helper methods =========================================================
    function rad(degrees) {
        return degrees * DEG_TO_RAD;
    }

    function deg(radians) {
        return radians / DEG_TO_RAD;
    }

    // Exports ================================================================
    dataviz.ui.plugin(Map);

    deepExtend(dataviz, {
        map: {
            crs: {
                EPSG3395: EPSG3395,
                EPSG3857: EPSG3857,
                EPSG4326: EPSG4326
            },
            datums: {
                WGS84: WGS84
            },
            projections: {
                Equirectangular: Equirectangular,
                Mercator: Mercator,
                SphericalMercator: SphericalMercator
            },

            Location: Location
        }
    });

})(window.kendo.jQuery);
