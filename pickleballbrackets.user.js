// ==UserScript==
// @name         picklballbrackets upgrades
// @description  Additional features for picklballbrackets.com
// @version      0.2
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
    // Get bracket low/high
    const [_0, _1, _2, _3, _4, _5] = $(team_container)
        .closest(".table-players")
        .prev()
        .find("h4")
        .text()
        .trim()
        .match(/^.* (.*) Skill: \((.*) (To|And) (.*)\) Age: .*\).*$/);
    const bracket_type = _1;
    const bracket_low = parseFloat(_2);
    const bracket_high = parseFloat(_4);

    // Fetch DUPRs
    const player_name_containers = $(team_container)
        .find(".removetag")
        .toArray();
    for (const player_name_container of player_name_containers) {
        const player_name_a = $(player_name_container).find("a").get(0);
        const player_name = $(player_name_a).text();

        if (player_name.trim() == "") {
            continue;
        }

        $(team_container)
            .find("td:nth-child(1)")
            .after(getTableItem("⌛"))
            .remove();

        GM.xmlHttpRequest({
            method: "POST",
            url: DUPR_SEARCH_URL,
            data: JSON.stringify({
                filter: {
                    rating: {
                        category: "DUPR",
                        maxRating: 10,
                        minRating: 0,
                        type: bracket_type.toUpperCase(),
                    },
                },
                includeUnclaimedPlayers: false,
                limit: 2,
                query: player_name,
            }),
            headers: {
                "Content-Type": "application/json",
            },
            onload: function (result) {
                const { response } = result;

                const hits = JSON.parse(response).result.hits;

                let rating = undefined;
                let age = undefined;
                if (hits.length < 1) {
                    rating = "NF";
                } else if (hits.length > 1) {
                    rating = `<a href="https://dashboard.dupr.com/dashboard/browse/players" target="_blank">🔍</a>`;
                } else {
                    rating = hits[0].ratings[bracket_type.toLowerCase()];
                    age = hits[0].age;
                }

                $(team_container)
                    .find("td:nth-child(1)")
                    .after(
                        getTableItem(rating).css(
                            "color",
                            getRatingColor(rating, bracket_low, bracket_high)
                        )
                    )
                    .remove();

                if (age) {
                    $(team_container)
                        .find("td:nth-child(4)")
                        .after(getTableItem(age))
                        .remove();
                }
            },
        });
    }
}

function getTableItem(value) {
    return $(
        `<td style="min-width: 40px; max-width: 40px; width: 40px; text-align:center; " class="p-t-5 p-b-5">${value}</td>`
    );
}

function getRatingColor(rating, low, high) {
    if (rating < low) {
        return "blue";
    }

    if (rating > high) {
        if (rating - high < 0.5) {
            return "orange";
        }
        return "red";
    }

    return undefined;
}
