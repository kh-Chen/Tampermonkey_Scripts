// ==UserScript==
// @name         98帖子浏览优化
// @namespace    98threadview
// @version      1.1.0
// @description  浏览帖子内容优化
// @author       sehuatang_chen
// @license      MIT

// @match        https://www.sehuatang.org/*
// @match        https://www.sehuatang.net/*
// @match        https://rgkm7.cs33u.com/*

// @grant        GM_xmlhttpRequest

// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.6.4/jquery.min.js
// @require      https://greasyfork.org/scripts/475748-zip%E8%A7%A3%E5%8E%8B%E5%B7%A5%E5%85%B7/code/zip%E8%A7%A3%E5%8E%8B%E5%B7%A5%E5%85%B7.js
// @require      https://greasyfork.org/scripts/475896-115%E6%8E%A8%E9%80%81%E5%B7%A5%E5%85%B7/code/115%E6%8E%A8%E9%80%81%E5%B7%A5%E5%85%B7.js

// ==/UserScript==

/* global $ */
$(document).ready(() => {
    console.log("98threadview ready")
    var url = window.location.href;
    if (/^.*forum\.php\?.*mod=viewthread.*$/g.test(url)){
        viewthread.init()
    } else {
        console.log("url not matched.")
    }
});

const viewthread = {
    init: () => {
        viewthread.remove_ads();
        viewthread.load_all_image();
        viewthread.add_one_key_btn();
    },
    remove_ads: () => {
        $("div.show-text").remove();
    },
    load_all_image: () => {
        $("img.zoom").each(function() {
            var $img=$(this);
            console.log($img)
            var pic_url = $img.attr( "zoomfile" ) || $img.attr( "file" )
            if ( pic_url != undefined && pic_url != null && pic_url != "" ) {
                $img.attr("src",pic_url)
                $img.attr("lazyloaded","true")
            }
        })
    },
    add_one_key_btn: () => {
        var $load_img_btn = $("<a />");
        $load_img_btn.append($('<div>一键加载</div>'))
        $load_img_btn.on("click", function(){
            let $sourcediv = tools.load_download_link()
            showDialog($sourcediv)
        });
        $("#scrolltop").append($("<span />").append($load_img_btn));
        $load_img_btn.css("background","None");
        // $load_img_btn.css("height","35px");
    },
}

const tools = {
    load_download_link: () => {
        let $from_con = $("#postlist > div[id^=post_]:eq(0) ")
        let $tag_div = $('<div></div>');

        let $link_div = $('<div id="link_div"></div>');
        let $attach_div = $('<div id="attach_div"></div>');
        $tag_div.append($attach_div)
        $tag_div.append($link_div)

        $from_con.find("span[id*='attach_']")
            .each(function(){
                var $attach = $(this);
                if ($attach.find("a").length > 0){
                    let $attach_clone = $attach.parent().clone()
                    $attach_clone.find("dl").removeClass("tattl");
                    $attach_div.append($('<div></div>').append($attach_clone));
                    tools.handleZipOrTxt($link_div,$attach_div,$attach);
                }
            });
        $from_con.find("dl.tattl")
            .each(function(){
                var $attach = $(this);
                if ($attach.find("p.attnm").length > 0){
                    let $attach_clone = $attach.parent().clone()
                    $attach_clone.find("dl").removeClass("tattl");
                    $attach_div.append($('<div></div>').append($attach_clone));
                    tools.handleZipOrTxt($link_div,$attach_div,$attach);
                }
            });
        var links = [];
        $from_con.find("div.blockcode")
            .each(function(){
                var $codediv = $(this)
                $codediv.find("li").each(function(){
                    var link = $(this).text()
                    if (tools.check_link(link)) {
                        links.push(link)
                    }
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
        $from_con.find(tools._get_custom_selector())
            .each(function(){
                var text = $(this).text() + ' ';
                if (text.trim() != '') {
                    var _links = tools.match_link(text)
                    links.push(..._links);
                }
            });

        Array.from(new Set(links.map(link => link.trim()))).map((link,index,arr) => tools.append_link(link,$link_div))

        if ($link_div.children().length == 0 && $attach_div.children().length == 0) {
            $tag_div.append("未识别到资源连接")
        } else {
            var $115btn = $('<button type=button>一键推送</button>')
            $115btn.on('click',function(){
                var arrlink = []
                $(this).parent().parent().find('a[dlflag="1"]').each(function(){
                    var _115link = $(this).attr('href')
                    if (tools.check_link_can115(_115link)) {
                        arrlink.push(_115link)
                    }
                })
                if (arrlink.length == 0) {
                    tools.tip("没有找到ed2k或磁力链接！");
                    return
                }
                call115.push_urls(arrlink).then( result => {
                    if (Array.isArray(result)) {
                        let succ = 0;
                        let error = 0;
                        let errortext = "";
                        result.map((item,index,arr) => {
                            if (item.state) {
                                succ++
                            } else {
                                error++;
                                errortext += (item.error_msg + "：" + item.url + '<br/>')
                            }
                        })
                        if (error == 0) {
                            tools.tip(`成功推送${succ}条链接`)
                        } else {
                            tools.tip(`共推送${result.length}条链接，成功${succ}条，失败${error}条：<br/> ${errortext}`,1000*10)
                        }
                    }
                }).catch( msg => tools.tip(msg))
            })

            $115btn.css({
                "margin-right": "10px",
                "border-radius": "4px",
                "border": "none",
                "min-height": "1em",
                "padding": "6px 12px",
                "cursor": "pointer",
                "color": "#000",
                "background-color": "#ecf0f1",
            });

            $tag_div.append($('<div style="display:flex;justify-content:flex-end"></div>').append($115btn))
            // $tag_div.prepend($('<div style="color:red">喜欢本贴的话别忘了点进去评分评论收藏哦！</div>'))
        }
        return $tag_div
    },
    handleZipOrTxt: ($link_div, $attach_div, $attach) => {
        var $a_tag = $attach.find('a:eq(0)')
        if ($a_tag.text().toLowerCase().endsWith('.zip')){
            var $btn = $('<button type=button>解析压缩包</button>')
            var zipdownloadlink = $a_tag.attr("href")
            $btn.on('click',function(){
                readfirsttxtfileinzip(zipdownloadlink).then( text => {
                    text.split('\n').map((text,index,arr) => tools.append_link(text,$link_div))
                }).catch( error => {
                    console.log(error)
                    if (error.message == 'Encrypted zip are not supported') {
                        tools.tip('暂不支持加密压缩包')
                    }else if (error == 'download err.'){
                        tools.tip("压缩包文件下载失败")
                    }
                })
            })
            $attach_div.append($('<div></div>').append($btn))
        }else if ($a_tag.text().toLowerCase().endsWith('.txt')) {
            var $btn = $('<button type=button>加载文档</button>')
            var txtdownloadlink = $a_tag.attr("href")
            $btn.on('click',function(){
                let _header = {
                    ...headers,
                    'Referer':txtdownloadlink
                }
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: txtdownloadlink,
                    headers: _header,
                    responseType: 'blob',
                    onload: (result) => {
                        if (result.status === 200 || result.status === 304) {
                            var reader = new FileReader();
                                reader.readAsText(result.response, 'utf-8');
                                reader.onload = function (e) {
                                    var text = reader.result
                                    text.split('\n').map((text,index,arr) => tools.append_link(text,$link_div))
                                }
                        }else{
                            tools.tip("文件下载失败")
                        }
                    }
                });
            })
            $attach_div.append($('<div></div>').append($btn))
        }
    },
    link_head: {
        can115: ["magnet:?xt=","ed2k://"],
        other: ["115://","https://pan.quark","https://pan.baidu"],
    },
    check_link: (linkstr) => tools._check_link(linkstr, [...tools.link_head.can115, ...tools.link_head.other ]),
    check_link_can115: (linkstr) => tools._check_link(linkstr,tools.link_head.can115),
    _check_link: (linkstr, heads) => heads.some( (head) => linkstr.startsWith(head) ),
    regExps:[],
    match_link: (text) => {
        if (tools.regExps.length == 0) {
            let all_link_head = [...tools.link_head.can115, ...tools.link_head.other ];
            all_link_head.map((currentValue,index,arr) => {
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
        let all_link_head = [...tools.link_head.can115, ...tools.link_head.other ];
        for(let i = 0; i < all_link_head.length; i++){
            var _selector = ':contains('+all_link_head[i]+')';
            custom_selector = custom_selector + _selector;
            if ( i != all_link_head.length-1 ) {
                custom_selector = custom_selector + ",";
            }
        }
        return custom_selector;
    },
    append_link: (link,$tag_div) => {
        link = link.trim()
        var $linkdiv = $(`<div><a href="${link}" dlflag="1" target="_blank">${link}</a></div>`)
        if (tools.check_link_can115(link)) {
            var $uploadbtn = $(`<span link="${link}" title="推送到115（需要当前浏览器已登录）" style="margin-left: 10px">${imgs.upload_svg}</span>`)
            $uploadbtn.on("click",function(){
                call115.push_urls($(this).attr("link")).then( result => {
                    if (result[0].state) tools.tip("推送成功")
                    else tools.tip(result[0].error_msg)
                }).catch( msg => tools.tip(msg))
            })
            $uploadbtn.appendTo($linkdiv)
        }
        $tag_div.append($linkdiv)
    },
    _tipTimerId:null,
    tip: (content,time) => {
        $("#msg").remove();
        clearTimeout(tools._tipTimerId);
        let $tipcon = $(`
            <div id="msg" style="opacity:0;transition: all 0.5s;position:fixed;top: 10%;left: 50%;transform: translate(-50%,-50%);background: #000;color: #fff;border-radius: 4px;text-align: center;padding: 10px 20px;">
                ${content}
            </div>
        `)
        $("body").append($tipcon);
        setTimeout( () => {
            $tipcon.css("opacity", 0.8)
        })
        tools._tipTimerId = setTimeout( () => {
            $tipcon.css("opacity", 0)
            $tipcon.on("transitionend", function() {
                $("#msg").remove();
            })
        }, time?time:2000);
    }
}

const showDialog = ($content) => {
    var $dialog_madel = $('<div />');
    $dialog_madel.css({
        "width": "100%",
        "height": "100%",
        "background": "rgba(0, 0, 0, 0.4)",
        "position": "fixed",
        "top": "0",
        "left": "0",
        "visibility": "hidden",
        "opacity": "0",
        "z-index": "999",
        "transition": "all 0.3s",
    })
    $dialog_madel.on("click", function() {
        $dialog_madel.remove();
    })
    $dialog_madel.keyup(function(e){
        var key = e.which || e.keyCode;
        if(key == 27){
            $dialog_madel.remove();
        }
    });

    var $dialog_window = $('<div />');
    $dialog_window.css({
        "position": "fixed",
        "top": "50%",
        "left": "50%",
        "padding"       : "10px 20px",
        "background-color": "#fff",
        "border-radius": "10px",
        "transform": "translate(-50%,-50%)",
    });
    $dialog_window.on("click", function(event) {
        event.stopPropagation()
    })
    $dialog_window.appendTo($dialog_madel)

    var $dialog_title = $(`
        <div>
            <span style="font-weight: bold">资源提取</span>
            <span id="close_cfg_window" title="关闭窗口" >${imgs.close_svg}</span>
        </div>
    `);
    $dialog_title.css({
        "border-bottom": "1px solid gray",
        "font-size": "20px",
        "display": "flex",
        "justify-content": "space-between"
    });
    $dialog_title.find("#close_cfg_window").on("click", function(){
        $dialog_madel.remove();
    })
    $dialog_title.appendTo($dialog_window)

    let $dialog_content = $('<div style="max-height:500px;max-weight:800px;overflow-y: auto;overflow-x: auto;"></div>')
    $content.appendTo($dialog_content);
    $dialog_content.appendTo($dialog_window);

    // var $btns = $(`
    //     <div>
    //         <button id="cancel_btn">取消</button>
    //     </div>
    // `);
    // $btns.css({
    //     "display": "flex",
    //     "justify-content": "flex-end",
    // })
    // var css_btn = {
    //     "margin-right": "10px",
    //     "border-radius": "4px",
    //     "border": "none",
    //     "min-height": "1em",
    //     "padding": "6px 12px",
    //     "cursor": "pointer"
    // }
    // var $cancel_btn = $btns.find("#cancel_btn")

    // $cancel_btn.css(css_btn);
    // $cancel_btn.css({
    //     "color": "#000",
    //     "background-color": "#ecf0f1",
    // });


    // $cancel_btn.click(function(){
    //     tools.tip("已取消")
    //     $dialog_madel.remove()
    // });
    // $btns.appendTo($dialog_window)

    $dialog_madel.appendTo($("body"));
    $dialog_madel.css('visibility', 'visible');
    $dialog_madel.css('opacity', '1');
    $dialog_madel.css('transform', 'scale(1)');
}
const imgs = {
    load_img_data: "data:image/gif;base64,R0lGODlhEAAQAPQAAP///2FhYfv7+729vdbW1q2trbe3t/Dw8OHh4bKystHR0czMzPX19dzc3Ovr68LCwsfHxwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh/h1CdWlsdCB3aXRoIEdJRiBNb3ZpZSBHZWFyIDQuMAAh/hVNYWRlIGJ5IEFqYXhMb2FkLmluZm8AIfkECQoAAAAsAAAAABAAEAAABVAgII5kaZ6lMBRsISqEYKqtmBTGkRo1gPAG2YiAW40EPAJphVCREIUBiYWijqwpLIBJWviiJGLwukiSkDiEqDUmHXiJNWsgPBMU8nkdxe+PQgAh+QQJCgAAACwAAAAAEAAQAAAFaCAgikfSjGgqGsXgqKhAJEV9wMDB1sUCCIyUgGVoFBIMwcAgQBEKTMCA8GNRR4MCQrTltlA1mCA8qjVVZFG2K+givqNnlDCoFq6ioY9BaxDPI0EACzxQNzAHPAkEgDAOWQY4Kg0JhyMhACH5BAkKAAAALAAAAAAQABAAAAVgICCOI/OQKNoUSCoKxFAUCS2khzHvM4EKOkPLMUu0SISC4QZILpgk2bF5AAgQvtHMBdhqCy6BV0RA3A5ZAKIwSAkWhSwwjkLUCo5rEErm7QxVPzV3AwR8JGsNXCkPDIshACH5BAkKAAAALAAAAAAQABAAAAVSICCOZGmegCCUAjEUxUCog0MeBqwXxmuLgpwBIULkYD8AgbcCvpAjRYI4ekJRWIBju22idgsSIqEg6cKjYIFghg1VRqYZctwZDqVw6ynzZv+AIQAh+QQJCgAAACwAAAAAEAAQAAAFYCAgjmRpnqhADEUxEMLJGG1dGMe5GEiM0IbYKAcQigQ0AiDnKCwYpkYhYUgAWFOYCIFtNaS1AWJESLQGAKq5YWIsCo4lgHAzFmPEI7An+A3sIgc0NjdQJipYL4AojI0kIQAh+QQJCgAAACwAAAAAEAAQAAAFXyAgjmRpnqhIFMVACKZANADCssZBIkmRCLCaoWAIPm6FBUkwJIgYjR5LN7INSCwHwYktdIMqgoNFGhQQpMMt0WCoiGDAAvkQMYkIGLCXQI8OQzdoCC8xBGYFXCmLjCYhADsAAAAAAAAAAAA=",
    expand_svg  : '<svg viewBox="0 0 1024 1024" width="16px" style="cursor:pointer" xmlns="http://www.w3.org/2000/svg" ><path fill="currentColor" d="M128 192h768v128H128V192zm0 256h512v128H128V448zm0 256h768v128H128V704zm576-352 192 160-192 128V352z"></path></svg>',
    hide_svg    : '<svg viewBox="0 0 1024 1024" width="16px" style="cursor:pointer" xmlns="http://www.w3.org/2000/svg" ><path d="M876.8 156.8c0-9.6-3.2-16-9.6-22.4-6.4-6.4-12.8-9.6-22.4-9.6-9.6 0-16 3.2-22.4 9.6L736 220.8c-64-32-137.6-51.2-224-60.8-160 16-288 73.6-377.6 176C44.8 438.4 0 496 0 512s48 73.6 134.4 176c22.4 25.6 44.8 48 73.6 67.2l-86.4 89.6c-6.4 6.4-9.6 12.8-9.6 22.4 0 9.6 3.2 16 9.6 22.4 6.4 6.4 12.8 9.6 22.4 9.6 9.6 0 16-3.2 22.4-9.6l704-710.4c3.2-6.4 6.4-12.8 6.4-22.4Zm-646.4 528c-76.8-70.4-128-128-153.6-172.8 28.8-48 80-105.6 153.6-172.8C304 272 400 230.4 512 224c64 3.2 124.8 19.2 176 44.8l-54.4 54.4C598.4 300.8 560 288 512 288c-64 0-115.2 22.4-160 64s-64 96-64 160c0 48 12.8 89.6 35.2 124.8L256 707.2c-9.6-6.4-19.2-16-25.6-22.4Zm140.8-96c-12.8-22.4-19.2-48-19.2-76.8 0-44.8 16-83.2 48-112 32-28.8 67.2-48 112-48 28.8 0 54.4 6.4 73.6 19.2L371.2 588.8ZM889.599 336c-12.8-16-28.8-28.8-41.6-41.6l-48 48c73.6 67.2 124.8 124.8 150.4 169.6-28.8 48-80 105.6-153.6 172.8-73.6 67.2-172.8 108.8-284.8 115.2-51.2-3.2-99.2-12.8-140.8-28.8l-48 48c57.6 22.4 118.4 38.4 188.8 44.8 160-16 288-73.6 377.6-176C979.199 585.6 1024 528 1024 512s-48.001-73.6-134.401-176Z" fill="currentColor"></path><path d="M511.998 672c-12.8 0-25.6-3.2-38.4-6.4l-51.2 51.2c28.8 12.8 57.6 19.2 89.6 19.2 64 0 115.2-22.4 160-64 41.6-41.6 64-96 64-160 0-32-6.4-64-19.2-89.6l-51.2 51.2c3.2 12.8 6.4 25.6 6.4 38.4 0 44.8-16 83.2-48 112-32 28.8-67.2 48-112 48Z" fill="currentColor"></path></svg>',
    close_svg   : '<svg viewBox="0 0 1024 1024" width="16px" style="cursor:pointer" xmlns="http://www.w3.org/2000/svg" ><path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"></path></svg>',
    upload_svg  : '<svg viewBox="0 0 1024 1024" width="16px" style="cursor:pointer" xmlns="http://www.w3.org/2000/svg" ><path fill="currentColor" d="M544 864V672h128L512 480 352 672h128v192H320v-1.6c-5.376.32-10.496 1.6-16 1.6A240 240 0 0 1 64 624c0-123.136 93.12-223.488 212.608-237.248A239.808 239.808 0 0 1 512 192a239.872 239.872 0 0 1 235.456 194.752c119.488 13.76 212.48 114.112 212.48 237.248a240 240 0 0 1-240 240c-5.376 0-10.56-1.28-16-1.6v1.6H544z"></path></svg>',
    hideuser_svg: '<svg viewBox="0 0 1024 1024" width="16px" style="cursor:pointer" xmlns="http://www.w3.org/2000/svg" ><path d="M730.614 612.961c-27.79 14.626-52.036 35.076-71.115 59.728C615.725 648.664 565.459 635 512 635c-169.551 0-307 137.449-307 307 0 24.3-19.7 44-44 44s-44-19.7-44-44c0-163.047 98.787-303.02 239.774-363.332C279.812 528.088 229 440.978 229 342c0-156.297 126.703-283 283-283s283 126.703 283 283c0 98.978-50.812 186.088-127.774 236.668a394.09 394.09 0 0 1 63.388 34.293zM512 537c107.696 0 195-87.304 195-195s-87.304-195-195-195-195 87.304-195 195 87.304 195 195 195z m252.887 268.8l-64.974-64.973c-17.183-17.183-17.183-45.043 0-62.226s45.043-17.183 62.226 0l64.974 64.974 64.974-64.974c17.183-17.183 45.042-17.183 62.225 0s17.183 45.043 0 62.226L889.338 805.8l64.974 64.974c17.183 17.183 17.183 45.042 0 62.225s-45.042 17.183-62.225 0l-64.974-64.974L762.139 933c-17.183 17.183-45.043 17.183-62.226 0s-17.183-45.042 0-62.225l64.974-64.974z" fill="#000000" p-id="4945"></path></svg>'
}