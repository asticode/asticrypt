module.exports = {
    routes: {
        allStatic: {
            method: "GET",
            pathnamePattern: /.(css|js|woff2|png|jpg|svg|gif)$/
        },
        apiTest: {
            method: "POST",
            pathname: "/api/api.test"
        },
        appsActionsList: {
            method: "POST",
            pathname: "/api/apps.actions.list",
        },
        appsList: {
            method: "POST",
            pathname: "/api/apps.list",
        },
        chatPostMessage: {
            method: "POST",
            pathname: "/api/chat.postMessage",
        },
        checkCookie: {
            method: "GET",
            pathname: "/checkcookie",
        },
        commandsList: {
            method: "POST",
            pathname: "/api/commands.list",
        },
        conversationsView: {
            method: "POST",
            pathname: "/api/conversations.view",
        },
        conversationsHistory: {
            method: "POST",
            pathname: "/api/conversations.history",
        },
        dndTeamInfo: {
            method: "POST",
            pathname: "/api/dnd.teamInfo",
        },
        emojiList: {
            method: "POST",
            pathname: "/api/emoji.list",
        },
        filesInfo: {
            method: "POST",
            pathname: "/api/files.info",
        },
        filesList: {
            method: "POST",
            pathname: "/api/files.list",
        },
        filesUploadAsync: {
            method: "POST",
            pathname: "/api/files.uploadAsync",
        },
        filesUploadAsyncOptions: {
            method: "OPTIONS",
            pathname: "/api/files.uploadAsync",
        },
        filesUploadStatus: {
            method: "POST",
            pathname: "/api/files.uploadStatus",
        },
        helpIssuesList: {
            method: "POST",
            pathname: "/api/help.issues.list",
        },
        homepage: {
            method: "GET",
            pathname: "/",
        },
        homepagePost: {
            method: "POST",
            pathname: "/",
        },
        i18nTranslationsGet: {
            method: "POST",
            pathname: "/api/i18n.translations.get",
        },
        messages: {
            method: "GET",
            pathnamePattern: "/messages",
        },
        promoBanner: {
            method: "POST",
            pathname: "/api/promo.banner",
        },
        signin: {
            method: "GET",
            pathname: "/signin",
        },
        signinPost: {
            method: "POST",
            pathname: "/signin",
        },
        signout: {
            method: "GET",
            pathnamePattern: /^\/signout\//,
        },
        slackEdge: {
            host: "ca.slack-edge.com",
            method: "GET",
        },
        subscriptionsThreadGet: {
            method: "POST",
            pathname: "/api/subscriptions.thread.get",
        },
        subscriptionsThreadGetView: {
            method: "POST",
            pathname: "/api/subscriptions.thread.getView",
        },
        templates: {
            method: "GET",
            pathname: "/templates.php",
        },
        usersCounts: {
            method: "POST",
            pathname: "/api/users.counts",
        },
        vendorJS: {
            method: "GET",
            pathnamePattern: /modern.vendor.(.*).min.js$/,
        }
    },
}