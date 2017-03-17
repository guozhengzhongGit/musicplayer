// 根据设备尺寸设置rem
!(function(doc, win) {
    var docEle = doc.documentElement,
        evt = "onorientationchange" in window ? "orientationchange" : "resize",
        fn = function() {
            var width = docEle.clientWidth;
            width && (docEle.style.fontSize = 20 * (width / 320) + "px");
        };

    win.addEventListener(evt, fn, false);
    doc.addEventListener("DOMContentLoaded", fn, false);

}(document, window));

//初始化音乐函数
var ctx = {
    $playList: null,
    $listContent: null,
    playList: null,
    player: null,
    currentSong: null,
    $needle: null,
    currentIndex: 0,
    $curTime: null,
    $totTime: null,
    $processBtn: null,
    $processBar: null,
    $rdyBar: null,
    $curBar: null,
    $playBtn: null,
    $pauseBtn: null,
    canvas: null,
    backImage: null,
    interval: 0,
    processBtnState: 0,
    originX: 0,
    diskCovers: [],
    isPlaying: false,
    songUpdated: true,
    singleLoop: false//single loop
};

ctx.init = function () {
    ctx.initData();
    ctx.initState();
    ctx.initPlayList();
    ctx.updateSong();
    ctx.setInterval();
    ctx.initProcessBtn(ctx.$processBtn);
    ctx.updateCoverState(0);
};

ctx.initData = function () {
    ctx.currentIndex = +localStorage.getItem("currentSongIndex") || 0;
    ctx.currentIndex >= ctx.playList.length ? ctx.currentIndex = 0 : '';
    ctx.currentSong = ctx.playList[ctx.currentIndex];
    ctx.player = $('#mymusicplayer').get(0);
    ctx.$needle = $('#mymusicneedle');
    ctx.$curTime = $('#currentTime');
    ctx.$totTime = $('#totalTime');
    ctx.$processBtn = $('#processBtn');
    ctx.$processBar = $('#mymusicprocess .process-bar');
    ctx.$rdyBar = $('#mymusicprocess .rdy');
    ctx.$curBar = $('#mymusicprocess .cur');
    ctx.$playBtn = $('#mymusiccontrols .play');
    ctx.$pauseBtn = $('#mymusiccontrols .pause');
    ctx.$playList = $('#mymusicplayList');
    ctx.$listContent = $('#listContent');
    ctx.diskCovers = [$('.disk-cover:eq(0)'), $('.disk-cover:eq(1)'), $('.disk-cover:eq(2)')];
};

ctx.loop=function(){
    ctx.singleLoop=!ctx.singleLoop;
    $('#mymusiccontrols .loop-btn').toggleClass('active');
};

ctx.initPlayList = function () {
    var $li;
    ctx.$listContent.html('');
    $('#playListCount').html(ctx.playList.length);
    $.each(ctx.playList, function (i, item) {
        $li = $('<li>').html(item.name).append($('<span>').html('   -' + formatArtists(item.artists)));
        $li.on('click touch', function () {
            if(ctx.currentIndex!==i){
                ctx.isPlaying = true;
                ctx.moveTo(i);
            }
        });
        ctx.$listContent.append($li);
    });
    ctx.validatePlayList();
    ctx.$playList.css('bottom', -(ctx.$playList.height()+50) + 'px');
};

ctx.showPlayList = function () {
    ctx.$playList.animate({bottom: '0px'}, 200);
};

ctx.hidePlayList = function () {
    ctx.$playList.animate({bottom: -ctx.$playList.height() + 'px'}, 200);
};

ctx.validatePlayList = function () {
    ctx.$listContent.children('li.active').removeClass('active').children("div.song-play").remove();
    ctx.$listContent.children('li').eq(ctx.currentIndex).addClass('active')
        .prepend($('<div>').addClass('song-play'));
    ctx.$listContent.animate({
        scrollTop: (ctx.currentIndex + 1) * 41 - ctx.$listContent.height() / 2
    });
};

ctx.initState = function () {
    $('img').attr('draggable', false);
    ctx.player.addEventListener('ended', function(){
        if(ctx.singleLoop){
            ctx.moveTo(ctx.currentIndex);
        }else{
            ctx.next();
        }
    });
    ctx.player.addEventListener('canplay', ctx.readyToPlay);
    window.addEventListener('resize', ctx.updateCoverState);
    $("body").on('click touch', function (e) {
        if ($(e.target).parents('#mymusicplayList').length === 0 && !$(e.target).hasClass('list-btn')) {
            ctx.hidePlayList();
        }
    });
};

ctx.updateCoverState = function (derection, preLoad) {
    var temp, speed = 800, defualtUrl = "img/placeholder_disk_play_song.png",
        preIndex = ctx.currentIndex - 1 < 0 ? ctx.playList.length - 1 : ctx.currentIndex - 1,
        nextIndex = ctx.currentIndex + 2 > ctx.playList.length ? 0 : ctx.currentIndex + 1,
        posLeft = -ctx.diskCovers[0].width(),
        posCenter = "10%",
        posRight = ctx.diskCovers[0].parent().width() + ctx.diskCovers[0].width() / 2,
        updateAlbumImgs = function () {
            ctx.diskCovers[0].children('.album').attr('src', ctx.playList[preIndex].album.picUrl);
            ctx.diskCovers[1].children('.album').attr('src', ctx.playList[ctx.currentIndex].album.picUrl);
            ctx.diskCovers[2].children('.album').attr('src', ctx.playList[nextIndex].album.picUrl);
        },
        animationEnd = function () {
            if (!ctx.songUpdated) {
                updateAlbumImgs();
                ctx.updateSong();
                ctx.songUpdated = true;
            }
        }, albumStopRotate = function () {
            ctx.changeAnimationState(ctx.diskCovers[0], 'paused');
            ctx.changeAnimationState(ctx.diskCovers[2], 'paused');
        };

    if (derection === 1) {
        ctx.songUpdated = false;
        temp = ctx.diskCovers[0];
        ctx.diskCovers[0] = ctx.diskCovers[1];
        ctx.diskCovers[1] = ctx.diskCovers[2];
        ctx.diskCovers[2] = temp;

        albumStopRotate();

        if (preLoad) {
            ctx.diskCovers[1].children('.album').attr('src', defualtUrl);
        }

        ctx.diskCovers[2].css('left', posRight);
        ctx.diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        ctx.diskCovers[0].animate({left: posLeft}, speed, animationEnd);
    } else if (derection === -1) {
        ctx.songUpdated = false;
        temp = ctx.diskCovers[2];
        ctx.diskCovers[2] = ctx.diskCovers[1];
        ctx.diskCovers[1] = ctx.diskCovers[0];
        ctx.diskCovers[0] = temp;

        albumStopRotate();
        ctx.diskCovers[0].css('left', posLeft);
        ctx.diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        ctx.diskCovers[2].animate({left: posRight}, speed, animationEnd);
    } else {
        ctx.songUpdated = true;
        ctx.diskCovers[0].css('left', posLeft).show();
        ctx.diskCovers[1].css('left', posCenter).show();
        ctx.diskCovers[2].css('left', posRight).show();
        updateAlbumImgs();
    }

};

ctx.changeAnimationState = function ($ele, state) {
    $ele.css({
        'animation-play-state': state,
        '-webkit-animation-play-state': state
    });
};

ctx.updateSong = function () {
    ctx.player.src = ctx.currentSong.mp3Url;
    setTimeout(ctx.updatePic, 10);
    ctx.updateMusicInfo();
    if (ctx.isPlaying) {
        setTimeout(ctx.play, 500);
    }
    localStorage.setItem("currentSongIndex", ctx.currentIndex);
};

ctx.updatePic = function () {
    $(".bg").css('background-image', 'url(' + ctx.currentSong.album.picUrl + ')');
};

ctx.updateMusicInfo = function () {
    $('#songName').html(ctx.currentSong.name);
    $('#artist').html(formatArtists(ctx.currentSong.artists));
};

ctx.play = function () {
    ctx.player.play();
    ctx.isPlaying = true;
    ctx.changeAnimationState(ctx.diskCovers[1], 'running');
    ctx.moveNeedle(true);
    ctx.$playBtn.hide();
    ctx.$pauseBtn.show();
};

ctx.pause = function () {
    ctx.player.pause();
    ctx.isPlaying = false;
    ctx.moveNeedle(false);
    ctx.changeAnimationState(ctx.diskCovers[1], 'paused');
    ctx.$playBtn.show();
    ctx.$pauseBtn.hide();
};

ctx.moveNeedle = function (play) {
    if (play) {
        ctx.$needle.removeClass("pause-needle").addClass("resume-needle");
    } else {
        ctx.$needle.removeClass("resume-needle").addClass("pause-needle");
    }
};

ctx.preSwitchSong = function () {
    ctx.songUpdated = false;
    ctx.currentSong = ctx.playList[ctx.currentIndex];
    ctx.player.pause();
    ctx.moveNeedle(false);
    ctx.validatePlayList();
};

ctx.moveTo = function (index) {
    if (ctx.songUpdated) {
        ctx.currentIndex = index;
        ctx.preSwitchSong();
        setTimeout('ctx.updateCoverState(1,true)', ctx.isPlaying ? 400 : 0);
    }
};

ctx.next = function () {
    if (ctx.songUpdated) {
        ctx.currentIndex = ctx.currentIndex < ctx.playList.length - 1 ? ctx.currentIndex + 1 : 0;
        ctx.preSwitchSong();
        setTimeout('ctx.updateCoverState(1)', ctx.isPlaying ? 400 : 0);
    }
};

ctx.prev = function () {
    if (ctx.songUpdated) {
        ctx.currentIndex = ctx.currentIndex > 0 ? ctx.currentIndex - 1 : ctx.playList.length - 1;
        ctx.preSwitchSong();
        setTimeout('ctx.updateCoverState(-1)', ctx.isPlaying ? 400 : 0);
    }
};

ctx.updateProcess = function () {
    var buffer = ctx.player.buffered,
        bufferTime = buffer.length > 0 ? buffer.end(buffer.length - 1) : 0,
        duration = ctx.player.duration,
        currentTime = ctx.player.currentTime;
    ctx.$totTime.text(validateTime(duration / 60) + ":" + validateTime(duration % 60));
    ctx.$rdyBar.width(bufferTime / duration * 100 + '%');
    if (!ctx.processBtnState) {
        ctx.$curBar.width(currentTime / duration * 100 + '%');
        ctx.$curTime.text(validateTime(currentTime / 60) + ":" + validateTime(currentTime % 60));
    }
};

ctx.setInterval = function () {
    if (!ctx.interval) {
        ctx.updateProcess();
        ctx.interval = setInterval(ctx.updateProcess, 1000);
    }
};

ctx.clearInterval = function () {
    if (ctx.interval) {
        clearInterval(ctx.interval);
    }

};

ctx.initProcessBtn = function ($btn) {
    var moveFun = function (e) {
            var duration = ctx.player.duration,
                e = e.originalEvent,
                totalWidth = ctx.$processBar.width(), percent, moveX, newWidth;
            console.log(totalWidth);
            e.preventDefault();
            if (ctx.processBtnState) {
                moveX = (e.clientX || e.touches[0].clientX) - ctx.originX;
                newWidth = ctx.$curBar.width() + moveX;

                if (newWidth > totalWidth || newWidth < 0) {
                    ctx.processBtnState = 0;
                } else {
                    percent = newWidth / totalWidth;
                    ctx.$curBar.width(newWidth);
                    ctx.$curTime.text(validateTime(percent * duration / 60) + ":" + validateTime(percent * duration % 60));
                }
                ctx.originX = (e.clientX || e.touches[0].clientX);
            }
        },
        startFun = function (e) {
            e = e.originalEvent;
            ctx.processBtnState = 1;
            ctx.originX = (e.clientX || e.touches[0].clientX);
        },
        endFun = function () {
            if (ctx.processBtnState) {
                ctx.player.currentTime = ctx.$curBar.width() / ctx.$processBar.width() * ctx.player.duration;
                ctx.processBtnState = 0;
                ctx.updateProcess();
            }
        };
    $btn.on('mousedown touchstart', startFun);
    $("body").on('mouseup touchend', endFun);
    $("#mymusicprocess").on('mousemove touchmove', moveFun);
};


function validateTime(number) {
    var value = (number > 10 ? number + '' : '0' + number).substring(0, 2);
    return isNaN(value) ? '00' : value;
}

function formatArtists(artists) {
    var names = [];
    $.each(artists, function (i, item) {
        names.push(item.name);
    });
    return names.join('/');
}
//文档加载完成
$(document).ready(function () {

    //初始化
    $(".nav-list>ul>li").eq(0).addClass("active");
    $("#findmusic>.showimg>.num>li").eq(0).addClass("active");
    var widthnum = parseInt($(window).width());



    // 底部导航点击变色
$(".footer>ul>li>a").on("click",function () {
    $(".footer>ul>li>a").removeClass("active");
   $(this).addClass("active");
});
    //歌单点击变色
    $(".nav-list>ul>li").on("click",function () {
        $(this).addClass("active").siblings().removeClass("active");
    });

    //轮播效果
    var i=0;
    var t=setInterval(function () {
      move();
    },1500);

    //图片向左滚动，在手机上体现为手指向←滑动
    function move() {
        i++;
        if(i==8){
            $("#findmusic>.showimg>.num>li").eq(0).addClass("active").siblings().removeClass("active");
        }
        if(i==9){
            i=1;
            $("#findmusic>.showimg>.findmusic-img").css({left:0});

        }
        $("#findmusic>.showimg>.num>li").eq(i).addClass("active").siblings().removeClass("active");
        $("#findmusic>.showimg>.findmusic-img").stop().animate({left:-i*widthnum});
    }

    //图片向右滚动。在手机上体现为手指向→滑动。
    function moveR() {
        i--;
        if(i==-1){
            $("#findmusic>.showimg>.findmusic-img").css({left:(-8)*widthnum});
            i=7;

        }
        $("#findmusic>.showimg>.num>li").eq(i).addClass("active").siblings().removeClass("active");
        $("#findmusic>.showimg>.findmusic-img").stop().animate({left:-i*widthnum});

    }


    var startX,endX,onOff;
    //滑动阈值
    onOff = 20;
    //获得触摸开始时的位置
    $("#findmusic>.showimg").on("touchstart",function (e) {
       startX = e.originalEvent.touches[0].clientX;
        console.log(startX);
    });
    //获得触摸结束一瞬间的位置
    $("#findmusic>.showimg").on("touchmove",function (e) {
       endX = e.originalEvent.touches[0].clientX;
        console.log(endX);
    });
    //触摸结束以后比较大小
    $("#findmusic>.showimg").on("touchend",function (e) {
        if(Math.abs(startX-endX)>onOff){
           console.log(startX>endX?move():moveR());
        }
    });

    $(".showimg").on("touchmove",function () {
       clearInterval(t);
    });
    $(".showimg").on("touchend",function () {
          clearInterval(t);
          t=setInterval(function () {
              move();
          },1500);
    });


    // 请求播放音乐
    var url1 = '/play_list.json';
    var url2 = '/musicjson/playlisttwo.json';
    var url3 = '/musicjson/playlistthree.json';

    // 换到播放页面的图标
$(".musicbox-box>.musicbox-content>a>img").on("click",function () {
    $(".footer>ul>li>a").removeClass("active");
    $(".footer>ul>li:nth-child(2)>a").addClass("active");
});

    $("#playmusicone").on("click",function () {
        var a = {id:"618628669"};
        ajaxmusic(a);
    });

    $("#playmusictwo").on("click",function () {
        var a = {id:"618468325"};
        ajaxmusic(a);
    });

    $("#playmusicthree").on("click",function () {
        var a = {id:"583004327"};
        ajaxmusic(a);
    });
    $("#playmusicfour").on("click",function () {
        var a = {id:"624049069"};
        ajaxmusic(a);
    });
    $("#playmusicfive").on("click",function () {
        var a = {id:"629612003"};
        ajaxmusic(a);
    });
    $("#playmusicsix").on("click",function () {
        var a = {id:"625206396"};
        ajaxmusic(a);
    });
    $("#playmusicseven").on("click",function () {
        var a = {id:"628357643"};
        ajaxmusic(a);
    });
    $("#playmusiceight").on("click",function () {
        var a = {id:"624403999"};
        ajaxmusic(a);
    });
    $("#playmusicnine").on("click",function () {
        var a = {id:"621919493"};
        ajaxmusic(a);
    });
    function ajaxmusic(a) {
        $.ajax("/download",{
            type:"GET",
            data:a,
            dataType:"json",
            success:function (data) {
                console.log(data);
                ctx.playList = data.result.tracks;
                ctx.init();
            },
            err:function (err) {
                console.log(err);
            }
        });
    }
});
