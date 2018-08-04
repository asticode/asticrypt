const helpers = {
    isRoute: function(route, url, method) {
        if (route.method && route.method !== method) return false
        if (route.pathname && route.pathname !== url.pathname) return false
        if (route.pathnamePattern && !url.pathname.match(route.pathnamePattern)) return false
        if (route.host && route.host !== url.host) return false
        return true
    }
}

module.exports = helpers