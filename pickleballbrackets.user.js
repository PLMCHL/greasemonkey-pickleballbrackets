// ==UserScript==
// @name         picklballbrackets upgrades
// @description  Additional features for picklballbrackets.com
// @version      0.1
// @author       PLMCHL
// @match        https://pickleballbrackets.com/ptplg.aspx*
// @grant        GM.xmlHttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==

const DUPR_SEARCH_URL = "https://backend.mydupr.com/player/v1.0/search/public";

$(document).ready(function () {
    $(".table-players").on("DOMNodeInserted", "tr.playerrow", function () {
        const dupr_score = $(this).find(".dupr_score");

        // Don't trigger the update if we already loaded their score
        if (dupr_score.length > 0) {
            console.log("loaded");
            return;
        }

        const player_name_containers = $(this).find(".removetag");

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

                    if (hits.length < 1) {
                        console.log("No hits for player");
                    }

                    if (hits.length > 1) {
                        console.log("Too many hits for player");
                    }

                    const doubles_rating = hits[0].ratings.doubles;

                    $(player_name_container).append(
                        $("<div>").addClass("dupr_score").html(doubles_rating)
                    );
                },
            });
        }
    });
});
