// ==UserScript==
// @name         picklballbrackets upgrades
// @description  Additional features for picklballbrackets.com
// @version      0.1
// @author       PLMCHL
// @match        https://pickleballbrackets.com/ptplg.aspx*
// @grant        GM.xmlHttpRequest
// @grant        GM_xmlhttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==

const DUPR_SEARCH_URL = "https://backend.mydupr.com/player/v1.0/search/public";
const OBSERVER_CONFIG = {
    subtree: true,
    childList: true,
};

$(document).ready(function () {
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            handleMutation(mutation);
        });
    });

    var tablePlayers = document.querySelectorAll(".table-players");
    for (const tablePlayer of tablePlayers) {
        observer.observe(tablePlayer, OBSERVER_CONFIG);
    }
});

function handleMutation(mutation) {
    mutation.addedNodes.forEach((node) => {
        const $node = $(node);
        if (!$node.hasClass("playerrow")) {
            return;
        }
        $node.children().find("tr").toArray().forEach(handlePlayerRow);
    });
}

function handlePlayerRow(team_container) {
    const player_name_containers = $(team_container)
        .find(".removetag")
        .toArray();

    for (const player_name_container of player_name_containers) {
        const player_name_a = $(player_name_container).find("a").get(0);
        const player_name = $(player_name_a).text();

        GM.xmlHttpRequest({
            method: "POST",
            url: DUPR_SEARCH_URL,
            data: JSON.stringify({
                filter: {},
                includeUnclaimedPlayers: true,
                limit: 10,
                offset: 0,
                pageSource: "LD_ADD_PARTICIPANT",
                query: player_name,
                verifiedEmail: true,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            onload: function (result) {
                const { response } = result;

                // console.log(JSON.parse(response).result);

                const hits = JSON.parse(response).result.hits;

                let rating = "???";
                if (hits.length < 1) {
                    rating = "NF";
                } else if (hits.length > 1) {
                    console.log("Too many hits for player");
                } else {
                    rating = hits[0].ratings.doubles;
                }

                $(team_container)
                    .find("td:nth-child(1)")
                    .after(getTableItem(rating));
            },
        });
    }
}

function getTableItem(value) {
    return $(
        `<td style="min-width: 40px; max-width: 40px; width: 40px; text-align:center; " class="p-t-5 p-b-5">${value}</td>`
    );
}
