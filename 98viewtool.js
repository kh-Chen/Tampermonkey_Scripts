// ==UserScript==
// @name         98图片预览助手
// @namespace    98imgloader
// @version      1.0.3
// @description  浏览帖子列表时自动加载内部前三张图片供预览。如需支持免翻地址，请使用@match自行添加连接，如果某个版块不希望预览，请使用@exclude自行添加要排除的版块链接。当前排除技术区
// @author       sehuatang_chen
// @license      MIT

// @match        https://*sehuatang.org/forum.php?mod=forumdisplay*
// @match        https://*sehuatang.net/forum.php?mod=forumdisplay*
// @match        https://*mzjvl.com/forum.php?mod=forumdisplay*

// @exclude        https://mzjvl.com/forum.php?mod=forumdisplay&fid=95&filter=author&typeid=710*

// @grant          GM_xmlhttpRequest
// @require https://code.jquery.com/jquery-3.6.1.min.js

// ==/UserScript==
/* global $ */
$(document).ready(function(){
    console.log("98imgloader ready")
    var headers = {
        'User-agent': navigator.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    }

    $("tbody[id*='stick']").remove();
    $("div.show-text2").parent().parent().parent().remove();
    $("tbody[id='separatorline']").remove();

    function do_load_img(){
        $("tbody[id*='normalthread']").each(function(){
            var tbody=$(this);
            var tbody_img_id = "img_"+tbody.attr("id").split("_")[1];
            if ($("#"+tbody_img_id).length != 0) {
                return;
            }

            var tbody_img = tbody.clone();
            tbody_img.attr("id", tbody_img_id);
            tbody_img.find("td,th").remove();
            var td_img = $('<td colspan="5"></td>');
            tbody_img.find("tr:eq(0)").append(td_img);

            var url = tbody.find(".icn > a").attr("href");
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                headers: headers,
                onload: function(result) {
                    if (result.status != 200) {
                        return ;
                    }
                    var doc = result.responseText;
                    $(doc).find(".zoom").slice(0, 3).each(function() {
                        var zoomfile = $(this).attr("zoomfile")
                        //console.log(zoomfile)
                        if (zoomfile != undefined && zoomfile != null && zoomfile != '') {
                            var tag_img = $('<img>');
                            tag_img.attr('src', zoomfile);
                            tag_img.css({
                                "max-width": "33%",
                                "max-height": "300px",
                            });

                            td_img.append(tag_img);
                        }

                    });
                }
            });
            tbody.after(tbody_img);
        })
    }

    var next_btn = $("#autopbn");
    next_btn.on("click",function(){
        console.log("next_btn click!!!")
        //点击下一页后延迟1秒再次触发图片加载。
        setTimeout(do_load_img, 1000);
    })

    // $("#threadlisttableid").bind("DOMNodeInserted", function(){
    //     console.log("DOMNodeInserted!!!")
    // });
    do_load_img()


});
