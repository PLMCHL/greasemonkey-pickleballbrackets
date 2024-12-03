// ==UserScript==
// @name         picklballbrackets upgrades
// @description  Additional features for picklballbrackets.com
// @version      0.3
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

const RATING_TD_SELECTOR = "td:nth-child(1)";
const AGE_TD_SELECTOR = "td:nth-child(4)";
const LOCATION_TD_SELECTOR = "td:nth-child(5)";

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
        .match(
            /^.* (\w*) Skill: \(([\d\.]*)( To | And )?([\w\d\.]*)\) Age: .*\).*$/
        );
    const bracket_type = _1;
    const bracket_low = parseFloat(_2);
    const bracket_high = parseFloat(_4) || bracket_low + 0.5;

    // Fetch DUPRs
    const player_name_tds = $(team_container).find(".removetag").toArray();
    for (const player_name_td of player_name_tds) {
        const player_name_a = $(player_name_td).find("a").get(0);
        const player_name_text = $(player_name_a).text().trim();

        if (player_name_text == "") {
            continue;
        }
        const [_, lastName, firstName] = player_name_text.match(/^(.*), (.*)$/);
        const player_name = `${firstName} ${lastName}`;

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

                const { rating, age } = getPlayerDetails(
                    team_container,
                    JSON.parse(response).result.hits,
                    player_name,
                    bracket_type
                );

                if (rating) {
                    $(team_container)
                        .find(RATING_TD_SELECTOR)
                        .after(
                            getTableItem(rating).css(
                                "color",
                                getRatingColor(
                                    rating,
                                    bracket_low,
                                    bracket_high
                                )
                            )
                        )
                        .remove();
                }

                if (age) {
                    $(team_container)
                        .find(AGE_TD_SELECTOR)
                        .after(getTableItem(age))
                        .remove();
                }
            },
        });
    }
}

function getPlayerDetails(team_container, hits, player_name, bracket_type) {
    const location = getLocation(team_container);

    // Filter out names that don't match
    const clean_hits = hits.filter(
        (hit) =>
            hit &&
            cleanString(player_name) == cleanString(hit.fullName) &&
            (!location.state ||
                !hit.shortAddress ||
                hit.shortAddress.includes(location.state))
    );

    if (
        // No results
        clean_hits.length < 1 ||
        // Multiple results
        clean_hits.length > 1
    ) {
        const original_dupr = $(team_container).find(RATING_TD_SELECTOR).text();
        return {
            rating: `<a href="https://dashboard.dupr.com/dashboard/browse/players" target="_blank">${original_dupr}🔍</a>`,
        };
    }

    // Player found
    const rating = clean_hits[0].ratings[bracket_type.toLowerCase()];
    const age = clean_hits[0].age;
    return { age, rating };
}

function getLocation(team_container) {
    const [_0, _1, _2, _3] = $(team_container)
        .find(LOCATION_TD_SELECTOR)
        .text()
        .trim()
        .match(/^([\w ]*)(, )?(\w*)$/);

    if (!_1) {
        return {};
    }
    if (!_3) {
        return { state: _1 };
    }
    return { city: _1, state: _3 };
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

function cleanString(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[\W_]+/g, " ");
}
