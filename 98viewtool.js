// ==UserScript==
// @name         98图片预览助手
// @namespace    98imgloader
// @version      1.3.1
// @description  浏览帖子列表时自动加载内部前三张(可配置)图片供预览。如需支持其他免翻地址，请使用@match自行添加连接，如果某个版块不希望预览，请使用@exclude自行添加要排除的版块链接
// @author       sehuatang_chen
// @license      MIT

// @match        https://www.sehuatang.org/*
// @match        https://www.sehuatang.net/*
// @match        https://mzjvl.com/*
// @match        https://9xr2.app/*
// @match        https://kzs1w.com/*

// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/jquery_lazyload/1.9.7/jquery.lazyload.min.js

// ==/UserScript==
/* global $ */
$(document).ready(() => {
    console.log("98imgloader ready")
    GM_script.init_variables();
    GM_script.add_config_menu();

    var url = window.location.href;
    if (/^.*forum\.php\?.*mod=forumdisplay.*$/g.test(url)){
        normalthread.init()
    } else if (/^.*home\.php\?.*do=favorite.*$/g.test(url)) {
        // favorite.init()
    } else {
        console.log("url not matched.")
    }

});

const normalthread = {
    init: () => {
        normalthread.remove_ads();
        normalthread.add_one_key_btn();
        var $next_btn = $("#autopbn");
        $next_btn.on("click",function(){
            console.log("next_btn click!!!")
            //点击下一页后延迟page_thread_delayed秒再次触发图片加载。
            setTimeout(() => {
                normalthread.each_thread_list()
            }, parseInt(GM_getValue("page_thread_delayed")));
        });
        normalthread.each_thread_list();
    },
    add_one_key_btn: () => {
        var $load_img_btn = $("<a />");
        $load_img_btn.append($('<div>一键加载图片</div>'))
        $load_img_btn.on("click", function(){
            normalthread.each_thread_list(1)
        });
        $("#scrolltop").append($("<span />").append($load_img_btn));
        $load_img_btn.css("background","None");
        $load_img_btn.css("height","35px");
    },
    remove_ads: () => {
        $("tbody[id*='stick']").remove();
        $("div.show-text2").parent().parent().parent().remove();
        $("tbody[id='separatorline']").remove();
    },
    each_thread_list: (isonekeyload) => {
        var count = 0
        $("tbody[id*='normalthread']").each(function(index) {
            var $tbody=$(this);
            var info_id = "info_"+$tbody.attr("id").split("_")[1];
            var load_btn_id = "load_"+$tbody.attr("id").split("_")[1];

            if ($tbody.find("#"+load_btn_id).length == 0) {
                var $load_btn = $("<a />")
                $load_btn.text("加载")
                $load_btn.on("click", function(){
                    normalthread.load_thread_info($tbody)
                })
                $tbody.find("tr").append($('<td id="'+load_btn_id+'" style="width:30px"></td>').append($load_btn))
            }

            if (GM_getValue("switch_autoload") == 1 || isonekeyload == 1) {
                if ($("#"+info_id).length == 0) {
                    if (GM_getValue("load_thread_delayed") == 0) {
                        normalthread.load_thread_info($tbody)
                    } else {
                        count++;
                        setTimeout(() => {
                            normalthread.load_thread_info($tbody)
                        }, GM_getValue("load_thread_delayed") * count)
                    }
                }
            }

        })
    },
    load_thread_info: ($thread_tbody) => {
        var tbody_clone_id = "info_" + $thread_tbody.attr("id").split("_")[1];
        if ($("#"+tbody_clone_id).length != 0) {
            return ;
        }

        var $tbody_clone = $thread_tbody.clone();
        $tbody_clone.attr("id", tbody_clone_id);
        $tbody_clone.find("td,th").remove();
        var $tag_td = $('<td colspan="5"></td>');
        $tbody_clone.find("tr:eq(0)").append($tag_td);

        var url = $thread_tbody.find(".icn > a").attr("href");
        GM_xmlhttpRequest({
            method: 'GET',
            url: url,
            headers: tools.headers,
            onload: (result) => {
                if (result.status != 200) {
                    return ;
                }
                var doc = result.responseText;
                var $pre_search_doc = $(doc).find(tools.base_selector)
                tools.load_img($pre_search_doc, $tag_td)
                // tools.load_download_link($pre_search_doc, $tag_td)
            }
        });
        $thread_tbody.after($tbody_clone);
    }

}

const favorite = {
    init: () => {
        favorite.each_thread_list();
    },
    each_thread_list: (isonekeyload) => {
        var count = 0
        $("div.bm > form:eq(0) > ul[id='favorite_ul'] > li[id*='fav_']").each(function(index) {
            console.log($(this).find("a:eq(1)").attr("href"))
        })
    },
}

const tools = {
    img_data: "data:image/gif;base64,R0lGODlhEAAQAPQAAP///2FhYfv7+729vdbW1q2trbe3t/Dw8OHh4bKystHR0czMzPX19dzc3Ovr68LCwsfHxwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/h1CdWlsdCB3aXRoIEdJRiBNb3ZpZSBHZWFyIDQuMAAh/hVNYWRlIGJ5IEFqYXhMb2FkLmluZm8AIfkECQoAAAAsAAAAABAAEAAABVAgII5kaZ6lMBRsISqEYKqtmBTGkRo1gPAG2YiAW40EPAJphVCREIUBiYWijqwpLIBJWviiJGLwukiSkDiEqDUmHXiJNWsgPBMU8nkdxe+PQgAh+QQJCgAAACwAAAAAEAAQAAAFaCAgikfSjGgqGsXgqKhAJEV9wMDB1sUCCIyUgGVoFBIMwcAgQBEKTMCA8GNRR4MCQrTltlA1mCA8qjVVZFG2K+givqNnlDCoFq6ioY9BaxDPI0EACzxQNzAHPAkEgDAOWQY4Kg0JhyMhACH5BAkKAAAALAAAAAAQABAAAAVgICCOI/OQKNoUSCoKxFAUCS2khzHvM4EKOkPLMUu0SISC4QZILpgk2bF5AAgQvtHMBdhqCy6BV0RA3A5ZAKIwSAkWhSwwjkLUCo5rEErm7QxVPzV3AwR8JGsNXCkPDIshACH5BAkKAAAALAAAAAAQABAAAAVSICCOZGmegCCUAjEUxUCog0MeBqwXxmuLgpwBIULkYD8AgbcCvpAjRYI4ekJRWIBju22idgsSIqEg6cKjYIFghg1VRqYZctwZDqVw6ynzZv+AIQAh+QQJCgAAACwAAAAAEAAQAAAFYCAgjmRpnqhADEUxEMLJGG1dGMe5GEiM0IbYKAcQigQ0AiDnKCwYpkYhYUgAWFOYCIFtNaS1AWJESLQGAKq5YWIsCo4lgHAzFmPEI7An+A3sIgc0NjdQJipYL4AojI0kIQAh+QQJCgAAACwAAAAAEAAQAAAFXyAgjmRpnqhIFMVACKZANADCssZBIkmRCLCaoWAIPm6FBUkwJIgYjR5LN7INSCwHwYktdIMqgoNFGhQQpMMt0WCoiGDAAvkQMYkIGLCXQI8OQzdoCC8xBGYFXCmLjCYhADsAAAAAAAAAAAA=",
    base_selector: "#postlist > div[id^=post_] div.pct:eq(0) div.t_fsz ",
    headers: {
        'User-agent': navigator.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    },
    load_img: ($from_con, $to_con) => {
        var $tag_div = $('<div ></div>');
        $tag_div.css({
            "width"         :"100%",
            "margin-bottom" :"5px",
            "overflow-x"    :"auto",
            "max-height"    :(GM_getValue("img_max_height")+10) + "px",
        });
        $to_con.append($tag_div);
        var $inner_tag_div = $('<div style="display: flex;align-items: flex-start;"></div>');

        $from_con.find("img.zoom")
            .slice(0, parseInt(GM_getValue("img_max_count")))
            .each(function(){
                var pic_url = $(this).attr( "zoomfile" ) || $(this).attr( "file" ) || $(this).attr( "src" );
                if (pic_url != undefined && pic_url != null && pic_url != '') {
                    var $tag_img = $('<img />');
                    $tag_img.attr({
                        "data-original" : pic_url,
                        "src"           : GM_getValue("switch_lazy_load_img") == 1 ? tools.img_data : pic_url,
                        "onclick"       :"zoom(this, this.src, 0, 0, 0)",
                    })
                    $tag_img.css({
                        "max-width"    :GM_getValue("img_max_width") + "px",
                        "max-height"   :GM_getValue("img_max_height") + "px",
                        "cursor"       :"pointer",
                        "margin-right" :"3px",
                        "float"        :"left"
                    });
                    $inner_tag_div.append($tag_img);
                    if (GM_getValue("switch_lazy_load_img") == 1) {
                        $tag_img.lazyload({threshold:50});
                    }
                }
            });
        if ($inner_tag_div.children().length == 0) {
            $tag_div.append("未识别到图片")
        } else {
            $tag_div.append($inner_tag_div)
        }
    },
    //为防止拿到资源地址后不点进帖子导致不评分评论收藏等，损害创作者权益，默认关闭此功能
    //开启方式自己找，别来问，别宣传
    load_download_link: ($from_con, $to_con) => {
        var $tag_div = $('<div></div>');
        $from_con.find("span[id*='attach_']")
            .each(function(){
                var $attach = $(this)
                if ($attach.find("a").length > 0){
                    $tag_div.append($attach.parent().clone())
                }
            });
        $from_con.find("dl.tattl")
            .each(function(){
                var $attach = $(this);
                if ($attach.find("p.attnm").length > 0){
                    $tag_div.append($attach.parent().clone())
                }
            });
        var links = [];
        $from_con.find("div.blockcode")
            .each(function(){
                var $codediv = $(this)
                $codediv.find("li").each(function(){
                    links.push($(this).text())
                })
            });
        $from_con.find("a[href]")
            .each(function(){
                var $a_tag = $(this)
                var link = $a_tag.attr("href")
                if (tools.check_link(link)) {
                    links.push(link)
                }
            });

        var custom_selector = tools._get_custom_selector();
        $from_con.find(custom_selector)
            .each(function(){
                var text = $(this).text() + ' ';
                if (text.trim() != '') {
                    var _links = tools.match_link(text)
                    links.push(..._links);
                }
            });
        var re_links = Array.from(new Set(links))
        $.each(re_links, function(index, item){
            $tag_div.append('<div><a href="'+item+'" target="_blank">'+item+'</a></div>')
        })
        if ($tag_div.children().length == 0) {
            $tag_div.append("未识别到资源连接")
        } else {
            $tag_div.prepend($('<div style="color:red">喜欢本贴的话别忘了点进去评分评论收藏哦！</div>'))
        }
        $to_con.append($tag_div);
    },
    link_head: ["magnet:?xt=","ed2k://","https://pan.quark"],
    check_link: (linkstr) => {
        for(let i = 0; i < tools.link_head.length; i++){
            if (linkstr.startsWith(tools.link_head[i])) {
                return true
            }
        }
        return false
    },
    regExps:[],
    match_link: (text) => {
        if (tools.regExps.length == 0) {
            tools.link_head.map((currentValue,index,arr) => {
                var key = currentValue.replaceAll("?","\\?")
                if (currentValue == "ed2k://") {
                    tools.regExps.push(new RegExp(`(${key})(.+?)(\\|/|复制代码)`, 'g'))
                }else{
                    tools.regExps.push(new RegExp(`(${key})(.+?)(?=\\s|复制代码)`, 'g'))
                }
            })
        }
        var result = []
        tools.regExps.map((regExp,index,arr) => {
            var _link = text.match(regExp);
            if (_link != null) {
                result.push(..._link);
            }
        })

        return result;
    },
    _get_custom_selector: () => {
        var custom_selector = '';
        for(let i = 0; i < tools.link_head.length; i++){
            var _selector = ':contains('+tools.link_head[i]+')'
            if ( i != tools.link_head.length-1 ) {
                custom_selector = custom_selector + _selector + ","
            }else{
                custom_selector = custom_selector + _selector
            }
        }
        return custom_selector;
    }
}

const GM_script = {
    init_variables: () => {
        if ( GM_getValue("switch_autoload") == undefined) {
            GM_setValue("switch_autoload", 0);
        }
        if ( GM_getValue("page_thread_delayed") == undefined) {
            GM_setValue("page_thread_delayed", 1000);
        }
        if ( GM_getValue("switch_lazy_load_img") == undefined) {
            GM_setValue("switch_lazy_load_img", 1);
        }
        if ( GM_getValue("load_thread_delayed") == undefined) {
            GM_setValue("load_thread_delayed", 500);
        }
        if ( GM_getValue("img_max_height") == undefined) {
            GM_setValue("img_max_height", 300);
        }
        if ( GM_getValue("img_max_width") == undefined) {
            GM_setValue("img_max_width", 300);
        }
        if ( GM_getValue("img_max_count") == undefined) {
            GM_setValue("img_max_count", 3);
        }
    },
    add_config_menu: () => {
        GM_registerMenuCommand("设置", function() {
            var $config_window = $('<div />');
            $config_window.attr({
                "id": "config_window"
            });
            $config_window.css({
                "position"      : "fixed",
                "z-index"       : "99999",
                "top"           : "50%",
                "left"          : "50%",
                "background"    : "#ccc",
                "border-radius" : "4px",
                "padding"       : "10px 20px"
            });

            var $form = $(`
                <form>
                    <div>
                        <input type="checkbox" id="switch_autoload" name="switch_autoload" />
                        <label for="switch_autoload">开启自动加载</label>
                        <div style="color: gray;font-style: italic;">* 进入帖子列表或翻页后，自动加载所有未加载过的帖子</div>
                    </div>
                    <div>
                        <label for="load_thread_delayed">帖子列表遍历延迟</label>
                        <input type="number" id="load_thread_delayed" name="load_thread_delayed" min="0" max="5000"/>
                        <label for="load_thread_delayed">毫秒</label>
                        <div style="color: gray;font-style: italic;">* 间隔多少毫秒加载下个帖子。0为不设延迟，取值范围0-5000</div>
                    </div>
                    <div>
                        <label for="page_thread_delayed">点击下一页后延迟</label>
                        <input type="number" id="page_thread_delayed" name="page_thread_delayed" min="500" max="5000"/>
                        <label for="page_thread_delayed">毫秒再次触发加载</label>
                        <div style="color: gray;font-style: italic;">* 在开启自动加载的前提下，点击下一页后如果没有自动加载新出的帖子，可以适当调大该值。取值范围500-5000</div>
                    </div>
                    <div>
                        <input type="checkbox" id="switch_lazy_load_img" name="switch_lazy_load_img" />
                        <label for="switch_lazy_load_img">开启图片懒加载</label>
                        <div style="color: gray;font-style: italic;">* 只有图片将要进入显示区时才会下载</div>
                    </div>
                    <div>
                        <label for="img_max_count">每个帖子最多加载</label>
                        <input type="number" id="img_max_count" name="img_max_count" min="0" max="10"/>
                        <label for="img_max_count">张图片</label>
                        <div style="color: gray;font-style: italic;">* 取值范围0-10</div>
                    </div>
                    <div>
                        <label for="img_max_width">每行图片最宽占用</label>
                        <input type="number" id="img_max_width" name="img_max_width" min="200" max="1000"/>
                        <label for="img_max_width">像素</label>
                        <div style="color: gray;font-style: italic;">* 图片最宽占用多少空间。单位像素，取值范围200-1000</div>
                    </div>
                    <div>
                        <label for="img_max_height">每行图片最高占用</label>
                        <input type="number" id="img_max_height" name="img_max_height" min="200" max="1000"/>
                        <label for="img_max_height">像素</label>
                        <div style="color: gray;font-style: italic;">* 图片最高占用多少空间。单位像素，取值范围200-1000</div>
                    </div>
                </form>
            `);

            $config_window.append($form);

            var $btns = $(`
                <div>
                    <button id="confirm_btn" style="margin-right:10px">确认</button>
                    <button id="cancel_btn">取消</button>
                </div>
            `);
            $btns.find("#confirm_btn").click(function(){
                console.log("config value:");
                console.log("switch_autoload", $form.find("#switch_autoload").prop("checked"));
                GM_setValue("switch_autoload", $form.find("#switch_autoload").prop("checked") ? 1 : 0);
                console.log("switch_lazy_load_img", $form.find("#switch_lazy_load_img").prop("checked"));
                GM_setValue("switch_lazy_load_img", $form.find("#switch_lazy_load_img").prop("checked") ? 1 : 0);
                console.log("load_thread_delayed", $form.find("#load_thread_delayed").val());
                GM_setValue("load_thread_delayed", $form.find("#load_thread_delayed").val());
                console.log("page_thread_delayed", $form.find("#page_thread_delayed").val());
                GM_setValue("page_thread_delayed", $form.find("#page_thread_delayed").val());
                console.log("img_max_height", $form.find("#img_max_height").val());
                GM_setValue("img_max_height", $form.find("#img_max_height").val());
                console.log("img_max_width", $form.find("#img_max_width").val());
                GM_setValue("img_max_width", $form.find("#img_max_width").val());
                console.log("img_max_count", $form.find("#img_max_count").val());
                GM_setValue("img_max_count", $form.find("#img_max_count").val());

                $config_window.remove();
            });

            $btns.find("#cancel_btn").click(function(){
                $config_window.remove()
            });
            $config_window.append($btns);

            $form.find("#switch_autoload").prop("checked",GM_getValue("switch_autoload") == 1);
            $form.find("#switch_lazy_load_img").prop("checked",GM_getValue("switch_lazy_load_img") == 1 );
            $form.find("#load_thread_delayed").val(GM_getValue("load_thread_delayed"));
            $form.find("#page_thread_delayed").val(GM_getValue("page_thread_delayed"));
            $form.find("#img_max_height").val(GM_getValue("img_max_height"));
            $form.find("#img_max_width").val(GM_getValue("img_max_width"));
            $form.find("#img_max_count").val(GM_getValue("img_max_count"));

            $config_window.appendTo($("body"));
            $config_window.css("transform", "translate(-50%,-50%)")
        })
    }
}
