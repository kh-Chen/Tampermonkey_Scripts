// ==UserScript==
// @name         98图片预览助手
// @namespace    98imgloader
// @version      1.0.5
// @description  浏览帖子列表时自动加载内部前三张图片供预览。如需支持免翻地址，请使用@match自行添加连接，如果某个版块不希望预览，请使用@exclude自行添加要排除的版块链接
// @author       sehuatang_chen
// @license      MIT

// @match        https://*sehuatang.org/forum.php?mod=forumdisplay*
// @match        https://*sehuatang.net/forum.php?mod=forumdisplay*
// @match        https://*mzjvl.com/forum.php?mod=forumdisplay*

// @grant        GM_xmlhttpRequest
// @require      https://code.jquery.com/jquery-3.6.1.min.js

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

    function do_load_thread_info(){
        $("tbody[id*='normalthread']").each(function(){
            var tbody=$(this);
            var tbody_clone_id = "info_"+tbody.attr("id").split("_")[1];
            if ($("#"+tbody_clone_id).length != 0) {
                return;
            }

            var tbody_clone = tbody.clone();
            tbody_clone.attr("id", tbody_clone_id);
            tbody_clone.find("td,th").remove();
            var tag_td = $('<td colspan="5"></td>');
            tbody_clone.find("tr:eq(0)").append(tag_td);

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
                    load_img(doc,tag_td)
                    //为防止拿到资源后不点进帖子导致不评分评论收藏等，默认关闭此功能
                    //如果你看见了这个功能并想使用，不要声张，打开注释即可。
                    //load_download_link(doc,tag_td)
                }
            });
            tbody.after(tbody_clone);
        })
    }

    function load_img(doc,con){
        var tag_div = $('<div></div>');
        tag_div.css("margin-bottom","5px");
        $(doc).find(".zoom").slice(0, 3).each(function() {
            var zoomfile = $(this).attr("zoomfile")
            if (zoomfile != undefined && zoomfile != null && zoomfile != '') {
                var tag_img = $('<img>');
                tag_img.attr('src', zoomfile);
                tag_img.css({
                    "max-width": "33%",
                    "max-height": "300px",
                });

                tag_div.append(tag_img);
            }
        });
        if (tag_div.children().length == 0) {
            tag_div.append("未识别到图片")
        }
        con.append(tag_div);
    }

    function load_download_link(doc,con){
        var tag_div = $('<div></div>');
        var _doc = $(doc);
        _doc.find("span[id*='attach_']").each(function() {
            var attach = $(this)
            if (attach.find("a").length > 0){
                tag_div.append(attach.parent().clone())
            }
        });
        _doc.find("dl.tattl").each(function() {
            var attach = $(this);
            if (attach.find("p.attnm").length > 0){
                tag_div.append(attach.parent().clone())
            }
        });
        _doc.find("div.blockcode").each(function() {
            var codediv = $(this)
            codediv.find("li").each(function(){
                tag_div.append('<div>'+$(this).text()+'</div>')
            })
        });
        if (tag_div.children().length == 0) {
            tag_div.append("未识别到资源连接")
        }
        con.append(tag_div);
    }

    var next_btn = $("#autopbn");
    next_btn.on("click",function(){
        console.log("next_btn click!!!")
        //点击下一页后延迟1.5秒再次触发图片加载。
        setTimeout(do_load_thread_info, 1500);
    })

    // $("#threadlisttableid").bind("DOMNodeInserted", function(){
    //     console.log("DOMNodeInserted!!!")
    // });
    do_load_thread_info()


});
