// ==UserScript==
// @name         picklballbrackets upgrades
// @description  Additional features for picklballbrackets.com
// @version      0.1
// @author       PLMCHL
// @match        https://pickleballbrackets.com/ptplg.aspx*
// @grant        GM.xmlHttpRequest
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js
// ==/UserScript==

$(document).ready(function () {
    //     console.log('ready');

    $(".table-players").on("DOMNodeInserted", "tr.playerrow", function () {
        //     console.log(`test`);

        const dupr_score = $(this).find(".dupr_score");

        if (dupr_score.length > 0) {
            console.log("loaded");
            return;
        }

        const aaa = $(this).find(".removetag");

        for (const bbb of aaa) {
            const ccc = $(bbb).find("a").get(0);
            const name = $(ccc).text();

            //                   console.log(name);

            const url = "https://backend.mydupr.com/player/v1.0/search/public";

            GM.xmlHttpRequest({
                method: "POST",
                url: url,
                data: JSON.stringify({
                    filter: {},
                    includeUnclaimedPlayers: true,
                    limit: 10,
                    offset: 0,
                    pageSource: "LD_ADD_PARTICIPANT",
                    query: name,
                    verifiedEmail: true,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
                onload: function (result) {
                    //         console.log (result);

                    const { response } = result;

                    console.log(JSON.parse(response).result);

                    const hits = JSON.parse(response).result.hits;

                    if (hits.length < 1) {
                        console.log("missing hit");
                    }

                    if (hits.length > 1) {
                        console.log("oooops");
                    }

                    const text = hits[0].ratings.doubles;

                    $(bbb).append($("<div>").addClass("dupr_score").html(text));
                },
            });
        }
    });
});
